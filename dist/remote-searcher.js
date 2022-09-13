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
                operation: 'getEntities',
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
        return this.request('POST', {
            searcher: {
                operation: 'getDoc',
                parameters: {
                    idOrUrl,
                },
            },
        });
    }
    async listDocs(userOptions) {
        return this.request('POST', {
            searcher: {
                operation: 'getlistDocsDoc',
                parameters: {
                    userOptions,
                },
            },
        });
    }
    async search(term, userOptions) {
        return this.request('POST', {
            searcher: {
                operation: 'search',
                parameters: {
                    term,
                    userOptions,
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
            responseType: 'json',
            url: this.options.db,
        });
        return resp.body?.result;
    }
}
