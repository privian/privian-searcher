import { EventEmitter } from 'node:events';
import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';
import parseDuration from 'parse-duration';
import { Searcher } from './searcher.js';
import { RemoteSearcher } from './remote-searcher.js';
export class Dataset extends EventEmitter {
    url;
    options;
    MIN_UPDATE_INTERVAL = 900000;
    localFilePath;
    metadata = {};
    pullInterval;
    pulling = false;
    searcher;
    size = null;
    stats = null;
    transferred = 0;
    transferring = false;
    updateAvailable = false;
    updatesCheckedAt = null;
    constructor(url, options = {
        allowRemote: true,
        autoUpdate: true,
    }) {
        super();
        this.url = url;
        this.options = options;
        this.localFilePath = this.options.localFilePath || path.join(os.tmpdir(), path.basename(this.url));
    }
    get id() {
        return path.basename(new URL(this.url, 'http://localhost').pathname).replace(/\.db$/, '');
    }
    async checkForUpdates(head) {
        if (!head) {
            head = await this.head();
        }
        const localInfo = await this.readLocalInfo();
        this.updateAvailable = !localInfo || !this.compareInfo(localInfo, head);
        this.updatesCheckedAt = new Date();
        if (this.updateAvailable) {
            this.emit('update_available');
        }
        return this.updateAvailable;
    }
    async head() {
        return this.headRequest();
    }
    async load() {
        const head = await this.head();
        if (head.remote && this.options.allowRemote !== false) {
            this.metadata = head.metadata;
            this.searcher = new RemoteSearcher({
                datasetId: this.id,
                db: this.url,
                normalizeUrl: this.options.normalizeUrl,
            });
        }
        else {
            this.searcher = new Searcher({
                datasetId: this.id,
                db: this.localFilePath,
                normalizeUrl: this.options.normalizeUrl,
            });
            if (this.options.autoUpdate) {
                await this.checkForUpdates(head);
                if (this.updateAvailable) {
                    await this.pull();
                }
                this.metadata = head.metadata;
                const updateInterval = this.metadata.updateInterval && parseDuration(this.metadata.updateInterval);
                if (updateInterval && updateInterval >= this.MIN_UPDATE_INTERVAL) {
                    this.startPullInterval(updateInterval);
                }
            }
        }
    }
    async mkdir(dirPath) {
        await fs.promises.mkdir(dirPath, {
            recursive: true,
        });
    }
    async pull(force = false) {
        if (!force && (this.pulling || !this.updateAvailable)) {
            return false;
        }
        try {
            this.pulling = true;
            const tmpFilePath = this.localFilePath + '.tmp';
            let stats = null;
            try {
                stats = await fs.promises.stat(tmpFilePath);
            }
            catch (err) {
                if (err.code !== 'ENOENT') {
                    throw err;
                }
            }
            // don't pull when a tmp file already exists
            if (!stats?.mtimeMs) {
                await this.mkdir(path.dirname(this.localFilePath));
                // create empty tmp file
                fs.closeSync(fs.openSync(tmpFilePath, 'w'));
                const info = await this.pullRequest(tmpFilePath);
                if (info) {
                    await this.writeInfo(this.localFilePath, info);
                    await this.searcher?.close();
                    // wait for fs sync
                    await new Promise((resolve) => setTimeout(resolve, 500));
                    await fs.promises.rename(tmpFilePath, this.localFilePath);
                    this.updateAvailable = false;
                    this.emit('updated');
                }
            }
        }
        finally {
            this.pulling = false;
        }
        return true;
    }
    async readLocalInfo() {
        let info = null;
        try {
            info = JSON.parse(await fs.promises.readFile(this.localFilePath + '.info', 'utf8'));
        }
        catch (err) {
            if (err.code === 'ENOENT') {
                return null;
            }
            throw err;
        }
        return info;
    }
    async writeInfo(filePath, info) {
        return fs.promises.writeFile(filePath + '.info', JSON.stringify(info));
    }
    compareInfo(info1, info2) {
        return JSON.stringify(info1) === JSON.stringify(info2);
    }
    destroy(unlinkData = true) {
        if (this.transferring) {
            this.abort();
        }
        if (this.pullInterval) {
            clearInterval(this.pullInterval);
        }
        if (unlinkData) {
            try {
                fs.unlinkSync(this.localFilePath);
                fs.unlinkSync(this.localFilePath + '.info');
                fs.unlinkSync(this.localFilePath + '.tmp');
            }
            catch {
                // noop
            }
        }
    }
    startPullInterval(interval) {
        this.pullInterval = setInterval(() => {
            this.pull();
        }, interval);
    }
}
