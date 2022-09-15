import sqlite3 from 'sqlite3';
import hljs from 'highlight.js';
import MarkdownIt from 'markdown-it';
import mdfigures from 'markdown-it-image-figures';
export class Searcher {
    options;
    db;
    md = new MarkdownIt({
        highlight: function (str, lang) {
            if (lang && hljs.getLanguage(lang)) {
                try {
                    return hljs.highlight(str, { language: lang }).value;
                }
                catch (__) { }
            }
            return '';
        },
        html: true,
    });
    metadata;
    constructor(options) {
        this.options = options;
        this.md.use(mdfigures, {
            figcaption: true,
        });
    }
    async close() {
        return new Promise((resolve, reject) => {
            if (this.db) {
                this.db.close((err) => {
                    if (err) {
                        return reject(err);
                    }
                    this.db = void 0;
                    resolve(void 0);
                });
            }
            else {
                resolve(void 0);
            }
        });
    }
    async open() {
        if (this.db) {
            return this.db;
        }
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.options.db, sqlite3.OPEN_READONLY, (err) => {
                if (err) {
                    return reject(err);
                }
                process.nextTick(() => {
                    resolve(this.db);
                });
            });
        });
    }
    async getMetadata() {
        if (!this.metadata) {
            const metadata = await this.selectAll('SELECT * FROM metadata');
            this.metadata = metadata.reduce((acc, row) => {
                acc[row.id] = row.value;
                return acc;
            }, {});
        }
        return this.metadata;
    }
    async getEntities(limit = 100, docIds) {
        const sql = `SELECT entities.id, entities.name, COUNT(*) AS entityCount FROM docs_entities
			LEFT JOIN entities ON entities.id = docs_entities.entity
			${docIds ? `WHERE docs_entities.doc IN (${docIds.map(() => '?')})` : ''}
			GROUP BY docs_entities.entity ORDER BY entityCount DESC
			LIMIT ${limit}`;
        const entities = await this.selectAll(sql, docIds ? [...docIds] : []);
        return entities.map((entity) => {
            return {
                count: entity.entityCount,
                id: entity.id,
                name: entity.name,
            };
        });
    }
    async getTopEntities() {
        const entities = await this.getEntities();
        return entities.filter((entity) => {
            return entity.count >= 2;
        });
    }
    async getTOC() {
        const docs = await this.selectAll(`SELECT id, title FROM docs WHERE crawl = false AND title IS NOT NULL`);
        const sections = await this.selectAll(`SELECT id, doc, level, title FROM sections WHERE title IS NOT NULL`);
        return docs.map((doc) => {
            return {
                id: doc.id,
                title: doc.title,
                sections: sections.filter((section) => section.doc === doc.id).map((section) => {
                    const anchor = section.title.match(/\s?\{\#(\!\d+)\}/)?.[1] || null;
                    return {
                        anchor,
                        id: section.id,
                        level: section.level,
                        title: section.title?.replace(/\s?\{\#\!\d+\}/g, ''),
                    };
                }),
            };
        });
    }
    async getDoc(idOrUrl) {
        const metadata = await this.getMetadata();
        const doc = await this.selectOne(`SELECT
				docs.*,
				imageDocs.crawl as imageDocCrawl,
				imageDocs.crc as imageDocCrc,
				imageDocs.size as imageDocSize,
				imageDocs.type as imageDocType,
				imageDocs.url as imageDocUrl
			FROM docs
				LEFT JOIN docs as imageDocs ON docs.image = imageDocs.id
			WHERE ${idOrUrl === 'string' ? 'docs.url = ?' : 'docs.id = ?'}`, [idOrUrl]);
        if (!doc) {
            return null;
        }
        let contents = doc.contents;
        if (!contents) {
            const sections = await this.selectAll(`SELECT * FROM sections WHERE doc = ? ORDER BY id ASC`, [doc.id]);
            contents = this.replaceAnchors(await this.replaceLinks(sections.map((section) => {
                const level = section.level || 3;
                return `${section.title ? `${'#'.repeat(level)} ${section.title}\n\n` : ''}${section.contents || ''}`;
            }).join('\n\n')));
            contents = this.renderMarkdown(contents);
        }
        const docMetadata = doc.metadata ? JSON.parse(doc.metadata) : null;
        if (!Buffer.isBuffer(contents) && metadata.footer) {
            contents += metadata.footer.replace(/\{(\w+)\}/g, (_, key) => {
                // @ts-ignore
                return doc[key] || docMetadata?.[key];
            });
        }
        return {
            contents,
            id: doc.id,
            image: doc.image && doc.imageDocUrl ? {
                crawl: !!doc.imageDocCrawl,
                crc: doc.imageDocCrc,
                id: doc.image,
                size: doc.imageDocSize,
                type: doc.imageDocType,
                url: doc.imageDocUrl,
            } : null,
            metadata: docMetadata,
            publishedAt: doc.publishedAt ? new Date(doc.publishedAt) : null,
            size: doc.size,
            summary: doc.summary,
            title: doc.title,
            type: doc.type,
            url: doc.url,
        };
    }
    async listDocs(userOptions) {
        const options = Object.assign({
            limit: 100,
            returnEntities: 'related',
            sortBy: 'publishedAt',
        }, userOptions);
        let entities = null;
        if (!options.entityIds?.length && options.sortBy === 'entities') {
            entities = await this.getTopEntities();
            options.entityIds = entities.map(({ id }) => id);
        }
        const sql = `SELECT
			DISTINCT(docs.id),
			docs.title,
			docs.summary,
			docs.metadata,
			docs.publishedAt,
			docs.url,
			docs.image,
			imageDocs.crawl as imageCrawl,
			imageDocs.crc as imageCrc,
			imageDocs.size as imageSize,
			imageDocs.type as imageType,
			imageDocs.url as imageUrl
		FROM docs
		LEFT JOIN docs as imageDocs ON docs.image = imageDocs.id
		${options.entityIds?.length
            ? `LEFT JOIN docs_entities ON docs.id = docs_entities.doc
					WHERE docs_entities.entity IN (${options.entityIds.map(() => '?')})`
            : `WHERE docs.title IS NOT NULL`}
		ORDER BY docs.boost, docs.publishedAt DESC
		LIMIT ${options.limit}`;
        const items = await this.selectAll(sql, options.entityIds);
        if (!entities && options.returnEntities) {
            if (options.returnEntities === 'related') {
                entities = await this.getEntities(void 0, items.map(({ id }) => id));
            }
            else if (options.returnEntities === 'top') {
                entities = await this.getTopEntities();
            }
        }
        const docs = items.map((doc) => {
            return {
                id: doc.id,
                image: doc.image && doc.imageUrl ? {
                    crawl: !!doc.imageCrawl,
                    crc: doc.imageCrc,
                    id: doc.image,
                    size: doc.imageSize,
                    type: doc.imageType,
                    url: doc.imageUrl,
                } : null,
                metadata: doc.metadata ? JSON.parse(doc.metadata) : null,
                publishedAt: doc.publishedAt ? new Date(doc.publishedAt) : null,
                summary: doc.summary,
                title: doc.title,
                url: doc.url,
            };
        });
        return {
            entities: options.returnEntities ? entities : null,
            docs,
        };
    }
    async search(term, userOptions) {
        const options = Object.assign({
            limit: 100,
            snippetSize: 64,
        }, userOptions);
        const sql = `SELECT
			sections_fts.rowid,
			sections.boost,
			sections.doc,
			sections.metadata,
			sections.image,
			sections.id,
			sections.level,
			docs.boost as docBoost,
			docs.image as docImage,
			docs.metadata as docMetadata,
			docs.publishedAt as docPublishedAt,
			docs.title as docTitle,
			docs.type as docType,
			docs.summary as docSummary,
			docs.url as docUrl,
			imageDocs.crawl as imageDocCrawl,
			imageDocs.crc as imageDocCrc,
			imageDocs.size as imageDocSize,
			imageDocs.type as imageDocType,
			imageDocs.url as imageDocUrl,
			imageSections.crawl as imageSectionCrawl,
			imageSections.crc as imageSectionCrc,
			imageSections.url as imageSectionUrl,
			linkSections.crawl as linkSectionCrawl,
			linkSections.crc as linkSectionCrc,
			linkSections.url as linkSectionUrl,
			highlight(sections_fts, 0, '', '') as title,
			snippet(sections_fts, 1, '', '', '...', ${options.snippetSize}) as snippet,
			(bm25(sections_fts, 10, 1) - sections.boost - docs.boost) as score
		FROM sections_fts
			LEFT JOIN sections ON sections.id = sections_fts.rowid
			LEFT JOIN docs ON docs.id = sections.doc
			LEFT JOIN docs as imageDocs ON docs.image = imageDocs.id
			LEFT JOIN docs as imageSections ON sections.image = imageSections.id
			LEFT JOIN docs as linkSections ON sections.link = linkSections.id
		WHERE sections_fts MATCH ? ORDER BY score LIMIT ${options.limit};`;
        const items = await this.selectAll(sql, [term]);
        return Promise.all(items.map(async (item) => {
            return {
                boost: item.boost,
                doc: {
                    boost: item.docBoost,
                    id: item.doc,
                    image: item.docImage ? {
                        crawl: !!item.imageDocCrawl,
                        crc: item.imageDocCrc,
                        id: item.docImage,
                        size: item.imageDocSize,
                        type: item.imageDocType,
                        url: item.imageDocUrl,
                    } : null,
                    metadata: item.docMetadata ? JSON.parse(item.docMetadata) : null,
                    publishedAt: item.docPublishedAt ? new Date(item.docPublishedAt) : null,
                    summary: item.docSummary,
                    title: item.docTitle,
                    type: item.docType,
                    url: item.docUrl,
                },
                id: item.id,
                image: item.image ? {
                    crawl: !!item.imageSectionCrawl,
                    crc: item.imageSectionCrc,
                    id: item.image,
                    size: null,
                    type: null,
                    url: item.imageSectionUrl,
                } : null,
                level: item.level,
                link: item.link ? {
                    crawl: !!item.linkSectionCrawl,
                    crc: item.linkSectionCrc,
                    id: item.link,
                    url: item.linkSectionUrl,
                } : null,
                metadata: item.metadata ? JSON.parse(item.metadata) : null,
                title: item.title ? this.removeAnchors(item.title) : null,
                score: item.score * -1,
                snippet: this.renderMarkdown(this.removeAnchors(await this.replaceLinks(item.snippet)), true, true),
            };
        }));
    }
    renderMarkdown(contents, removeImages = false, removeAnchorLinks = false) {
        const ellipsis = '...';
        const filtered = contents.split(/\n\n/).map((line) => {
            if (removeImages && line.startsWith('![') && line.endsWith(')')) {
                // image
                return line.match(/\s\"?(.*)\"?\)$/)?.[1];
            }
            else if (line.startsWith('![') && line.endsWith(ellipsis)) {
                // incomplete image
                return line.match(/\s\"(.*)\"?$/)?.[1];
            }
            else if (line.startsWith('[') && line.endsWith(ellipsis)) {
                // incomplete link
                return line.match(/\[([^\]]+)$/)?.[1];
            }
            if (removeAnchorLinks) {
                let match = null;
                while (match = line.match(/\[([^\]]+)\]\(\#\!\d+.*?\)/)) {
                    line = line.slice(0, match.index) + match[1] + line.slice(match.index + match[0].length);
                }
            }
            return line;
        }).join('\n\n');
        return this.md.render(filtered);
    }
    replaceAnchors(contents) {
        return contents.replace(/\{\#\!(\d+)\}/g, (_m, id) => {
            return `<span id="!${id}"></span>`;
        });
    }
    removeAnchors(contents) {
        return contents.replace(/\{\#\!(\d+)\}/g, '');
    }
    async replaceLinks(contents) {
        const match = [...contents.matchAll(/\#\:(\d+)/g)];
        const ids = [];
        for (let item of match) {
            ids.push(+item[1]);
        }
        const docs = await this.selectAll(`SELECT id, crawl, crc, url FROM docs WHERE id IN (${ids.map(() => '?')})`, [...ids]);
        let cursor = 0;
        let result = '';
        for (let item of match) {
            const index = item.index || 0;
            const link = docs.find((d) => d.id === +item[1]);
            result += contents.slice(cursor, index);
            if (link && this.options.normalizeUrl) {
                result += String(this.options.normalizeUrl(link, this.options.datasetId));
            }
            else if (link?.url) {
                result += link.url;
            }
            else {
                result += item[0];
            }
            cursor = index + item[0].length;
        }
        return result + contents.slice(cursor);
        ;
    }
    async selectAll(sql, params = []) {
        const db = await this.open();
        if (!db) {
            throw new Error('Unable to open database.');
        }
        return new Promise((resolve, reject) => {
            db.all(sql, params, (err, rows) => {
                if (err) {
                    return reject(err);
                }
                resolve(rows);
            });
        });
    }
    async selectOne(sql, params = []) {
        const db = await this.open();
        if (!db) {
            throw new Error('Unable to open database.');
        }
        return new Promise((resolve, reject) => {
            db.get(sql, params, (err, row) => {
                if (err) {
                    return reject(err);
                }
                resolve(row);
            });
        });
    }
}
