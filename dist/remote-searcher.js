import got from 'got';
import { Searcher } from './searcher.js';
export class RemoteSearcher extends Searcher {
    constructor(options) {
        super(options);
    }
    async open() {
        // noop
    }
    async close() {
        // noop
    }
    async getMetadata() {
        return {};
    }
    async getEntities(limit = 100, docIds) {
        return this.request('POST', {
            searcher: {
                operation: 'getEntities',
                parameters: {
                    limit,
                    docIds,
                },
            },
        });
    }
    async getTopEntities() {
        return this.request('POST', {
            searcher: {
                operation: 'getTopEntities',
                parameters: {},
            },
        });
    }
    async getTOC() {
        return this.request('POST', {
            searcher: {
                operation: 'getTOC',
                parameters: {},
            },
        });
    }
    async getDoc(idOrUrl) {
        const result = await this.request('POST', {
            searcher: {
                operation: 'getDoc',
                parameters: {
                    docId: idOrUrl,
                },
            },
        });
        if (result?.contentType && result?.body) {
            return {
                contents: result.body,
                type: result.contentType,
            };
        }
        return result;
    }
    async listDocs(options) {
        return this.request('POST', {
            searcher: {
                operation: 'listDocs',
                parameters: {
                    options,
                },
            },
        });
    }
    async search(term, options) {
        return this.request('POST', {
            searcher: {
                operation: 'search',
                parameters: {
                    term,
                    options,
                },
            },
        });
    }
    async selectAll(sql, bindings = []) {
        return this.request('POST', {
            searcher: {
                operation: 'selectAll',
                parameters: {
                    sql,
                    bindings,
                },
            },
        });
    }
    async selectOne(sql, bindings = []) {
        return this.request('POST', {
            searcher: {
                operation: 'selectOne',
                parameters: {
                    sql,
                    bindings,
                },
            },
        });
    }
    async request(method, payload) {
        const resp = await got({
            json: payload,
            method,
            timeout: {
                response: 150000,
            },
            //responseType: 'json',
            url: this.options.db,
        });
        if (resp.headers['content-type']?.includes('application/json')) {
            return JSON.parse(resp.body)?.result;
        }
        return {
            contentType: resp.headers['content-type'],
            body: resp.rawBody,
        };
    }
}
