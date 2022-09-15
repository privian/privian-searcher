import got, { Method } from 'got';
import { Searcher } from './searcher.js';
import type {
		IDoc,
		IEntity,
		IOptions,
		ISearchOptions,
		ISearchItem,
		ITOCItem,
		IListDocsOptions,
} from './types.js';

export class RemoteSearcher extends Searcher {
	constructor(options: IOptions) {
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

	async getEntities(limit: number = 100, docIds?: number[]): Promise<IEntity[]> {
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

	async getTopEntities(): Promise<IEntity[]> {
		return this.request('GET', {
			action: {
				searcher: {
					operation: 'getTopEntities',
					parameters: {},
				},
			},
		});
	}

	async getTOC(): Promise<ITOCItem[]> {
		return this.request('GET', {
			action: {
				searcher: {
					operation: 'getTOC',
					parameters: {},
				},
			},
		});
	}

	async getDoc(idOrUrl: number | string): Promise<Partial<IDoc> | null> {
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

	async listDocs(options?: Partial<IListDocsOptions>): Promise<{ docs: Partial<IDoc>[], entities: IEntity[] | null }> {
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
	
	async search(term: string, options?: Partial<ISearchOptions>): Promise<ISearchItem[]> {
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
	
	async selectAll<T>(sql: string, bindings: any[] = []): Promise<T[]> {
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

	async selectOne<T>(sql: string, bindings: any[] = []): Promise<T> {
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

	protected async request(method: Method, payload?: Record<string, any>) {
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