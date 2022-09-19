import { Dataset } from './dataset.js';
import type { IDatasetOptions, IStorageOptions } from './types.js';
export declare class Storage {
    readonly options: IStorageOptions;
    static getDatasetClass(url: string): new (url: string, options: IDatasetOptions) => Dataset;
    readonly datasets: Map<string, Dataset>;
    readonly datasetsIdMapping: Map<string, string>;
    constructor(options: IStorageOptions);
    add(url: string): boolean;
    remove(urlOrId: string): void;
    list(): {
        id: string;
        error: string | undefined;
        loaded: boolean;
        localFilePath: string | undefined;
        metadata: Record<string, string>;
        mtime: number | undefined;
        remote: boolean;
        size: number | null;
        transferred: number;
        tranferring: boolean;
        updateAvailable: boolean;
        updatesCheckedAt: Date | null;
        url: string;
    }[];
    get(urlOrId: string): Dataset;
    getUrlById(id: string): string | undefined;
    newDataset(url: string): Dataset;
    getFilePath(url: string): string;
}
