import fs from 'node:fs';
import got from 'got';
import { Dataset } from './dataset.js';
export class HttpDataset extends Dataset {
    METADATA_HEADERS = [
        'x-amz-meta-',
        'x-metadata-',
        'x-meta-',
    ];
    req;
    abort() {
        if (this.req) {
            this.req.destroy();
            this.req = void 0;
            this.transferred = 0;
        }
    }
    async headRequest() {
        return this.request('HEAD', this.url);
    }
    async pullRequest(destFilePath) {
        return this.request('GET', this.url, destFilePath);
    }
    request(method, url, destFilePath) {
        this.transferring = true;
        return new Promise((resolve, reject) => {
            const req = got(url, {
                isStream: true,
                method,
                timeout: {
                    response: 15000,
                },
            });
            this.req = req;
            req.on('error', reject);
            req.on('downloadProgress', (progress) => {
                this.transferred = progress.transferred;
            });
            req.on('response', (resp) => {
                const size = +resp.headers['content-length'];
                this.size = size;
                req.off('error', reject);
                const info = {
                    metadata: Object.entries(resp.headers).reduce((acc, [key, value]) => {
                        const prefix = this.METADATA_HEADERS.find((item) => key.startsWith(item));
                        if (prefix) {
                            acc[key.replace(prefix, '')] = String(value);
                        }
                        return acc;
                    }, {}),
                    remote: String(resp.headers['x-features'])?.split(',').includes('searcher'),
                    size,
                    status: resp.statusCode,
                };
                if (destFilePath) {
                    const stream = fs.createWriteStream(destFilePath);
                    stream.on('finish', () => {
                        process.nextTick(() => {
                            resolve(info);
                        });
                    });
                    req.pipe(stream);
                }
                else {
                    req.destroy();
                    resolve(info);
                }
            });
        }).finally(() => {
            this.transferring = false;
        });
    }
}
