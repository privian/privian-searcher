/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import { EventEmitter } from 'node:events';
import fs from 'node:fs';
import { Searcher } from './searcher.js';
import type { IDatasetOptions, IStorageInfo } from './types.js';
export declare abstract class Dataset extends EventEmitter {
    readonly url: string;
    readonly options: IDatasetOptions;
    readonly MIN_UPDATE_INTERVAL = 900000;
    loadInterval?: NodeJS.Timeout;
    localFilePath: string;
    metadata: Record<string, string>;
    pulling: boolean;
    remote: boolean;
    searcher?: Searcher;
    size: number | null;
    stats: fs.Stats | null;
    transferred: number;
    transferring: boolean;
    updateAvailable: boolean;
    updatesCheckedAt: Date | null;
    constructor(url: string, options?: IDatasetOptions);
    get id(): string;
    checkForUpdates(head?: IStorageInfo): Promise<boolean>;
    head(): Promise<IStorageInfo>;
    load(): Promise<void>;
    mkdir(dirPath: string): Promise<void>;
    pull(force?: boolean): Promise<boolean>;
    readLocalInfo(): Promise<IStorageInfo | null>;
    writeInfo(filePath: string, info: IStorageInfo): Promise<void>;
    compareInfo(info1: IStorageInfo, info2: IStorageInfo): boolean;
    destroy(unlinkData?: boolean): void;
    startLoadInterval(interval: number): void;
    abstract abort(): void;
    abstract headRequest(): Promise<IStorageInfo>;
    abstract pullRequest(destFilePath: string): Promise<IStorageInfo>;
}
