/// <reference types="node" />
export interface IDbDoc {
    boost: number;
    contents: Buffer | null;
    crawl: boolean;
    crawledAt: number | null;
    createdAt: number | null;
    crc: string | null;
    error: string | null;
    id: number;
    image: number | null;
    metadata: string | null;
    origianlSize: number | null;
    publishedAt: number | null;
    size: number | null;
    status: number | null;
    summary: string | null;
    title: string | null;
    type: string | null;
    url: string;
}
export interface IDbSection {
    boost: number;
    contents: string | null;
    doc: number;
    id: number;
    image: number | null;
    level: number | null;
    link: number | null;
    metadata: string | null;
    title: string | null;
}
export interface IOptions {
    datasetId?: string;
    db: string;
    normalizeUrl?: (link: ILink, datasetId?: string) => string;
}
export interface ISearchOptions {
    limit: number;
    snippetSize: number;
}
export interface IListDocsOptions {
    entityIds?: number[];
    limit?: number;
    returnEntities?: 'top' | 'related';
    sortBy?: 'publishedAt' | 'entities';
}
export interface ILink {
    crawl: boolean;
    crc: string | null;
    id: number;
    url: string;
}
export interface IImage {
    crawl: boolean;
    crc: string | null;
    id: number;
    type: string | null;
    size: number | null;
    url: string;
}
export interface IDoc {
    contents: Buffer | string | null;
    id: number;
    image: IImage | null;
    metadata: Record<string, any> | null;
    publishedAt: Date | null;
    size: number | null;
    summary: string | null;
    title: string | null;
    type: string | null;
    url: string | null;
}
export interface IEntity {
    count: number;
    id: number;
    name: string;
}
export interface ITOCSection {
    anchor: string | null;
    id: number;
    level: number | null;
    title: string | null;
}
export interface ITOCItem {
    id: number;
    title: string;
    sections: ITOCSection[];
}
export interface ISearchItem {
    boost: number;
    doc: {
        boost: number;
        id: number;
        image: IImage | null;
        metadata: Record<string, any> | null;
        publishedAt: Date | null;
        title: string | null;
        type: string | null;
        summary: string | null;
        url: string;
    };
    id: number;
    image: IImage | null;
    level: number | null;
    link: ILink | null;
    metadata: Record<string, any> | null;
    snippet: string;
    title: string | null;
}
export interface IDatasetOptions {
    allowRemote: boolean;
    autoUpdate: boolean;
    localFilePath?: string;
    normalizeUrl?: (link: ILink, datasetId?: string) => string;
}
export interface IStorageOptions {
    allowRemote?: boolean;
    dir?: string;
    normalizeUrl?: (link: ILink, datasetId?: string) => string;
}
export interface IStorageInfo {
    metadata: Record<string, string>;
    remote: boolean;
    size: number;
    status: number;
}
