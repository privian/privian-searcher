import { Method } from 'got';
import { Searcher } from './searcher.js';
import type { IDoc, IEntity, IOptions, ISearchOptions, ISearchItem, ITOCItem, IListDocsOptions } from './types.js';
export declare class RemoteSearcher extends Searcher {
    constructor(options: IOptions);
    open(): Promise<void>;
    close(): Promise<void>;
    getMetadata(): Promise<{}>;
    getEntities(limit?: number, docIds?: number[]): Promise<IEntity[]>;
    getTopEntities(): Promise<IEntity[]>;
    getTOC(): Promise<ITOCItem[]>;
    getDoc(idOrUrl: number | string): Promise<Partial<IDoc>>;
    listDocs(options?: Partial<IListDocsOptions>): Promise<{
        docs: Partial<IDoc>[];
        entities: IEntity[] | null;
    }>;
    search(term: string, options?: Partial<ISearchOptions>): Promise<ISearchItem[]>;
    selectAll<T>(sql: string, bindings?: any[]): Promise<T[]>;
    selectOne<T>(sql: string, bindings?: any[]): Promise<T>;
    protected request(method: Method, payload?: any): Promise<any>;
}
