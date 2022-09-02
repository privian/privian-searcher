import path from 'node:path';
import { URL } from 'node:url';
import { Dataset } from './dataset.js';
import { HttpDataset } from './http-dataset.js';
import type { IStorageOptions } from './types.js';

export class Storage {
	readonly datasets: Map<string, Dataset> = new Map();

	readonly datasetsIdMapping: Map<string, string> = new Map();

	constructor(readonly options: IStorageOptions) {
	}

	add(url: string): boolean {
		if (this.datasets.has(url)) {
			return false;
		}
		const dataset = this.newDataset(url);
		this.datasets.set(url, dataset);
		this.datasetsIdMapping.set(url, dataset.id);
		return true;
	}

	remove(urlOrId: string) {
		const dataset = this.get(urlOrId);
		if (dataset) {
			dataset.destroy();
			dataset.removeAllListeners();
			this.datasets.delete(dataset.url);
			this.datasetsIdMapping.delete(dataset.url);
		}
	}

	list() {
		return [...this.datasets].map(([ _, dataset ]) => {
			return {
				id: dataset.id,
				localFilePath: dataset.filePath,
				metadata: dataset.metadata,
				mtime: dataset.stats?.mtimeMs,
				size: dataset.size,
				transferred: dataset.transferred,
				tranferring: dataset.transferring,
				updateAvailable: dataset.updateAvailable,
				updatesCheckedAt: dataset.updatesCheckedAt,
				url: dataset.url,
			};
		});
	}

	get(urlOrId: string): Dataset {
		let dataset: Dataset | undefined = void 0;
		if (urlOrId.includes('://')) {
			dataset = this.datasets.get(urlOrId);
		} else {
			const url = this.getUrlById(urlOrId);
			dataset = url ? this.datasets.get(url) : void 0;
		}
		if (!dataset) {
			throw new Error('Dataset not found.');
		}
		return dataset;
	}

	getUrlById(id: string) {
		return [...this.datasetsIdMapping].find((item) => item[1] === id)?.[0];
	}

	newDataset(url: string) {
		const parsed = new URL(url);
		switch (parsed.protocol) {
			case 'http:':
			case 'https:':
				return new HttpDataset(url, this.getFilePath(url), {
					autoUpdate: true,
					normalizeUrl: this.options.normalizeUrl,
				});
			default:
				throw new Error(`Unsupported protocol ${url}.`);
		}
	}

	getFilePath(url: string) {
		const parsed = new URL(url);
		return path.resolve(process.cwd(), path.join(this.options.dir, parsed.protocol.slice(0, -1), parsed.hostname, parsed.pathname));
	}
}
