import sqlite3 from 'sqlite3';
import MarkdownIt from 'markdown-it';
import type { IDoc, IEntity, IOptions, ISearchOptions, ISearchItem, ITOCItem, IListDocsOptions } from './types.js';
export declare class Searcher {
    readonly options: IOptions;
    db?: sqlite3.Database;
    readonly md: MarkdownIt;
    metadata?: Record<string, string>;
    constructor(options: IOptions);
    close(): Promise<unknown>;
    open(): Promise<sqlite3.Database>;
    getMetadata(): Promise<Record<string, string>>;
    getEntities(limit?: number, docIds?: number[]): Promise<IEntity[]>;
    getTopEntities(): Promise<IEntity[]>;
    getTOC(): Promise<ITOCItem[]>;
    getDoc(idOrUrl: number | string): Promise<IDoc>;
    listDocs(userOptions?: Partial<IListDocsOptions>): Promise<{
        docs: Partial<IDoc>[];
        entities: IEntity[] | null;
    }>;
    search(term: string, userOptions?: Partial<ISearchOptions>): Promise<ISearchItem[]>;
    renderMarkdown(contents: string, removeImages?: boolean, removeAnchorLinks?: boolean): string;
    replaceAnchors(contents: string): string;
    removeAnchors(contents: string): string;
    replaceLinks(contents: string): Promise<string>;
    selectAll<T>(sql: string, params?: any[]): Promise<T[]>;
    selectOne<T>(sql: string, params?: any[]): Promise<T>;
}
