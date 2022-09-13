import { Method, Request } from 'got';
import { Dataset } from './dataset.js';
import type { IStorageInfo } from './types.js';
export declare class HttpDataset extends Dataset {
    readonly METADATA_HEADERS: string[];
    req?: Request;
    abort(): void;
    headRequest(): Promise<IStorageInfo>;
    pullRequest(destFilePath: string): Promise<IStorageInfo>;
    request(method: Method, url: string, destFilePath?: string): Promise<IStorageInfo>;
}
