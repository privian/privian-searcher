import { Dataset } from './dataset.js';
import { HttpDataset } from './http-dataset.js';
import type { IStorageOptions } from './types.js';
export declare class Storage {
    readonly options: IStorageOptions;
    readonly datasets: Map<string, Dataset>;
    readonly datasetsIdMapping: Map<string, string>;
    constructor(options: IStorageOptions);
    add(url: string): boolean;
    remove(urlOrId: string): void;
    list(): {
        id: string;
        localFilePath: string;
        metadata: Record<string, string>;
        mtime: number | undefined;
        size: number | null;
        transferred: number;
        tranferring: boolean;
        updateAvailable: boolean;
        updatesCheckedAt: Date | null;
        url: string;
    }[];
    get(urlOrId: string): Dataset;
    getUrlById(id: string): string | undefined;
    newDataset(url: string): HttpDataset;
    getFilePath(url: string): string;
}
