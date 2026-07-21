// Runnable check for the normalize logic. No test framework.
//   node src/common/normalize.check.mjs
import assert from 'node:assert/strict';
import { normalizePlace } from './normalize.js';

// 1. Junction flattening: tags_id / occasions_id / directus_files_id.
const raw = {
  id: 1,
  title: 'Test',
  tags: [{ tags_id: { id: 10, name: 'Cosy', slug: 'cosy' } }, { tags_id: { id: 11, name: 'Loud', slug: 'loud' } }],
  occasions: [{ occasions_id: { id: 20, name: 'Date', slug: 'date' } }],
  gallery: [{ directus_files_id: 'file-a' }, { directus_files_id: 'file-b' }],
  reviews: [
    { id: 100, status: 'published', body: 'yes' },
    { id: 101, status: 'draft', body: 'hidden' },
  ],
};

const out = normalizePlace(raw);

assert.deepEqual(out.tags, [
  { id: 10, name: 'Cosy', slug: 'cosy' },
  { id: 11, name: 'Loud', slug: 'loud' },
]);
assert.deepEqual(out.occasions, [{ id: 20, name: 'Date', slug: 'date' }]);
assert.deepEqual(out.gallery, ['file-a', 'file-b']);

// 2. Reviews filtered to published only.
assert.equal(out.reviews.length, 1);
assert.equal(out.reviews[0].id, 100);

// 3. Missing / null relations -> [].
const empty = normalizePlace({ id: 2, title: 'Bare' });
assert.deepEqual(empty.tags, []);
assert.deepEqual(empty.occasions, []);
assert.deepEqual(empty.gallery, []);
assert.deepEqual(empty.reviews, []);

// 4. Junction rows with a null target are dropped (not left as null).
const holey = normalizePlace({ tags: [{ tags_id: null }, { tags_id: { id: 5 } }] });
assert.deepEqual(holey.tags, [{ id: 5 }]);

console.log('normalize.check.mjs OK');
