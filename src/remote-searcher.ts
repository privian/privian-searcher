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
				operation: 'getEntities',
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

	async getDoc(idOrUrl: number | string): Promise<IDoc> {
		return this.request('POST', {
			searcher: {
				operation: 'getDoc',
				parameters: {
					idOrUrl,
				},
			},
		});
	}

	async listDocs(userOptions?: Partial<IListDocsOptions>): Promise<{ docs: Partial<IDoc>[], entities: IEntity[] | null }> {
		return this.request('POST', {
			searcher: {
				operation: 'getlistDocsDoc',
				parameters: {
					userOptions,
				},
			},
		});
	}
	
	async search(term: string, userOptions?: Partial<ISearchOptions>): Promise<ISearchItem[]> {
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
		const resp = await got<{
			result?: any;
		}>({
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