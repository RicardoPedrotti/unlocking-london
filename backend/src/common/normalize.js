// @ts-check
// Single source for Directus -> app place normalization.
// Plain CommonJS (not .ts) so the runnable check (normalize.check.mjs) can
// import the real function under plain `node` without a TS loader.
//
// Flattens M2M junction rows to their target objects/ids and drops
// unpublished reviews (admin-token reads bypass Directus row filters, so we
// enforce the reviews-published rule here).

/**
 * @param {any[] | null | undefined} arr junction rows
 * @param {string} key junction field pointing at the target (e.g. 'tags_id')
 * @returns {any[]} target objects/ids, [] when the relation is missing
 */
function flatten(arr, key) {
  return Array.isArray(arr) ? arr.map((x) => x && x[key]).filter((v) => v != null) : [];
}

/**
 * @param {any} raw Directus place item (expanded per API_CONTRACT.md)
 * @returns {any} normalized place
 */
function normalizePlace(raw) {
  return {
    ...raw,
    tags: flatten(raw.tags, 'tags_id'),
    occasions: flatten(raw.occasions, 'occasions_id'),
    gallery: flatten(raw.gallery, 'directus_files_id'),
    reviews: Array.isArray(raw.reviews) ? raw.reviews.filter((r) => r && r.status === 'published') : [],
  };
}

module.exports = { normalizePlace, flatten };
