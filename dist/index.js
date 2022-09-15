export * from './dataset.js';
export * from './searcher.js';
export * from './storage.js';
export * from './types.js';
/*
import { Storage } from './storage.js';

const s = new Storage({
    dir: './data',
})
s.add('http://localhost:3001/631ebfe30001b6424a39/datasets/news2.db')
const d = s.get('news2');
await d.load();
console.log('>', await d.searcher?.listDocs({
    entityIds: ['152'] as any[],
    limit: 2,
}))
*/
