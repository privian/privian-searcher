/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import { Searcher } from './searcher.js';
import type { IDatasetOptions, IStorageInfo } from './types.js';
export declare abstract class Dataset extends EventEmitter {
    readonly url: string;
    readonly filePath: string;
    readonly options: IDatasetOptions;
    readonly MIN_UPDATE_INTERVAL = 900000;
    info: IStorageInfo | null;
    metadata: Record<string, string>;
    pullInterval?: NodeJS.Timeout;
    pulling: boolean;
    readonly searcher: Searcher;
    size: number | null;
    stats: fs.Stats | null;
    transferred: number;
    transferring: boolean;
    updateAvailable: boolean;
    updatesCheckedAt: Date | null;
    constructor(url: string, filePath: string, options: IDatasetOptions);
    get id(): string;
    checkForUpdates(): Promise<boolean>;
    dbAll(sql: string, params: any[]): Promise<unknown[]>;
    dbGet(sql: string, params: any[]): Promise<unknown>;
    head(): Promise<IStorageInfo>;
    load(): Promise<void>;
    mkdir(dirPath: string): Promise<void>;
    pull(force?: boolean): Promise<boolean>;
    readInfo(filePath: string): Promise<IStorageInfo | null>;
    readMetadata(): Promise<void>;
    readStats(): Promise<fs.Stats | null>;
    writeInfo(filePath: string, info: IStorageInfo): Promise<void>;
    compareInfo(info1: IStorageInfo, info2: IStorageInfo): boolean;
    destroy(unlinkData?: boolean): void;
    startPullInterval(interval: number): void;
    abstract abort(): void;
    abstract headRequest(): Promise<IStorageInfo>;
    abstract pullRequest(destFilePath: string): Promise<IStorageInfo>;
}
