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
        return this.request('GET', {
            action: {
                searcher: {
                    operation: 'getEntities',
                    parameters: {
                        limit,
                        docIds,
                    },
                },
            },
        });
    }
    async getTopEntities() {
        return this.request('GET', {
            action: {
                searcher: {
                    operation: 'getTopEntities',
                    parameters: {},
                },
            },
        });
    }
    async getTOC() {
        return this.request('GET', {
            action: {
                searcher: {
                    operation: 'getTOC',
                    parameters: {},
                },
            },
        });
    }
    async getDoc(idOrUrl) {
        const result = await this.request('GET', {
            action: {
                searcher: {
                    operation: 'getDoc',
                    parameters: {
                        docId: idOrUrl,
                    },
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
        return this.request('GET', {
            action: {
                searcher: {
                    operation: 'listDocs',
                    parameters: {
                        options,
                    },
                },
            },
        });
    }
    async search(term, options) {
        return this.request('GET', {
            action: {
                searcher: {
                    operation: 'search',
                    parameters: {
                        term,
                        options,
                    },
                },
            },
        });
    }
    async selectAll(sql, bindings = []) {
        return this.request('GET', {
            action: {
                searcher: {
                    operation: 'selectAll',
                    parameters: {
                        sql,
                        bindings,
                    },
                },
            },
        });
    }
    async selectOne(sql, bindings = []) {
        return this.request('GET', {
            action: {
                searcher: {
                    operation: 'selectOne',
                    parameters: {
                        sql,
                        bindings,
                    },
                },
            },
        });
    }
    async request(method, payload) {
        const searchParams = new URLSearchParams();
        if (payload && method === 'GET') {
            for (let key in payload) {
                searchParams.set(key, typeof payload[key] === 'string' ? payload[key] : JSON.stringify(payload[key]));
            }
        }
        const resp = await got({
            json: method !== 'GET' ? payload : void 0,
            method,
            timeout: {
                response: 150000,
            },
            searchParams,
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
