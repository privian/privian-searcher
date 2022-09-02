import { EventEmitter } from 'node:events';
import path from 'node:path';
import fs from 'node:fs';
import parseDuration from 'parse-duration';
import { Searcher } from './searcher.js';
export class Dataset extends EventEmitter {
    url;
    filePath;
    options;
    MIN_UPDATE_INTERVAL = 900000;
    info = null;
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
    constructor(url, filePath, options) {
        super();
        this.url = url;
        this.filePath = filePath;
        this.options = options;
        this.searcher = new Searcher({
            datasetId: this.id,
            db: this.filePath,
            normalizeUrl: this.options.normalizeUrl,
        });
        this.load();
    }
    get id() {
        return path.basename(this.url).replace(/\.db$/, '');
    }
    async checkForUpdates() {
        this.updateAvailable = !this.info || !this.compareInfo(this.info, await this.head());
        this.updatesCheckedAt = new Date();
        if (this.updateAvailable) {
            this.emit('update_available');
        }
        return this.updateAvailable;
    }
    async dbAll(sql, params) {
        if (!this.info) {
            return [];
        }
        return this.searcher.dbAll(sql, params);
    }
    async dbGet(sql, params) {
        if (!this.info) {
            return null;
        }
        return this.searcher.dbGet(sql, params);
    }
    async head() {
        return this.headRequest();
    }
    async load() {
        await this.readInfo(this.filePath);
        if (this.info) {
            await this.readMetadata();
        }
        if (this.options.autoUpdate) {
            await this.pull();
            const updateInterval = this.metadata.updateInterval && parseDuration(this.metadata.updateInterval);
            if (updateInterval && updateInterval >= this.MIN_UPDATE_INTERVAL) {
                this.startPullInterval(updateInterval);
            }
        }
    }
    async mkdir(dirPath) {
        await fs.promises.mkdir(dirPath, {
            recursive: true,
        });
    }
    async pull(force = false) {
        if (this.pulling) {
            return false;
        }
        try {
            this.pulling = true;
            if (!force) {
                await this.checkForUpdates();
            }
            if (force || this.updateAvailable) {
                const tmpFilePath = this.filePath + '.tmp';
                let stats = null;
                // random delay to handle concurrent pulls
                await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * 500)));
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
                    await this.mkdir(path.dirname(this.filePath));
                    // create empty tmp file
                    fs.closeSync(fs.openSync(tmpFilePath, 'w'));
                    const info = await this.pullRequest(tmpFilePath);
                    if (info) {
                        await this.writeInfo(this.filePath, info);
                        await this.readInfo(this.filePath);
                        await this.searcher.close();
                        // wait for fs sync
                        await new Promise((resolve) => setTimeout(resolve, 500));
                        await fs.promises.rename(tmpFilePath, this.filePath);
                        await this.readMetadata();
                        this.updateAvailable = false;
                        this.emit('updated');
                    }
                }
            }
        }
        finally {
            this.pulling = false;
        }
        return true;
    }
    async readInfo(filePath) {
        try {
            this.info = JSON.parse(await fs.promises.readFile(filePath + '.info', 'utf8'));
        }
        catch (err) {
            if (err.code === 'ENOENT') {
                return null;
            }
            throw err;
        }
        return this.info;
    }
    async readMetadata() {
        try {
            this.metadata = await this.searcher.getMetadata();
            this.emit('metadata');
        }
        catch (err) {
            throw new Error(`Unable to read metadata: ${err.message}`);
        }
    }
    async readStats() {
        try {
            this.stats = await fs.promises.stat(this.filePath);
            this.size = this.stats.size;
        }
        catch (err) {
            if (err.code !== 'ENOENT') {
                throw err;
            }
        }
        return this.stats;
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
                fs.unlinkSync(this.filePath);
                fs.unlinkSync(this.filePath + '.info');
                fs.unlinkSync(this.filePath + '.tmp');
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
