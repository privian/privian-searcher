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

	async getTopEntities(): Promise<IEntity[]> {
		return this.request('POST', {
			searcher: {
				operation: 'getTopEntities',
				parameters: {},
			},
		});
	}

	async getTOC(): Promise<ITOCItem[]> {
		return this.request('POST', {
			searcher: {
				operation: 'getTOC',
				parameters: {},
			},
		});
	}

	async getDoc(idOrUrl: number | string): Promise<Partial<IDoc> | null> {
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

	async listDocs(options?: Partial<IListDocsOptions>): Promise<{ docs: Partial<IDoc>[], entities: IEntity[] | null }> {
		return this.request('POST', {
			searcher: {
				operation: 'listDocs',
				parameters: {
					options,
				},
			},
		});
	}
	
	async search(term: string, options?: Partial<ISearchOptions>): Promise<ISearchItem[]> {
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
	
	async selectAll<T>(sql: string, bindings: any[] = []): Promise<T[]> {
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

	async selectOne<T>(sql: string, bindings: any[] = []): Promise<T> {
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

	protected async request(method: Method, payload?: any) {
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