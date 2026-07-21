// Seeds real London places into Directus (idempotent by slug). Run after schema.mjs.
// Reads the canonical dataset from /data/catalog.json (single source of truth) -
// edit that file, then re-run `npm run seed`.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { readItems, createItem, importFile } from '@directus/sdk';
import { getClient } from './client.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const catalog = JSON.parse(readFileSync(resolve(here, '../../data/catalog.json'), 'utf8'));
const { categories: CATEGORIES, tags: TAGS, occasions: OCCASIONS, images: IMG, places: PLACES } = catalog;

const client = await getClient();

// ponytail: sanity check the fixture covers all four categories before hitting the network.
{
  const cats = new Set(PLACES.map((p) => p.category));
  for (const c of CATEGORIES) if (!cats.has(c.slug)) throw new Error(`seed fixture missing category: ${c.slug}`);
}

async function ensureBySlug(collectionName, obj) {
  const found = await client.request(readItems(collectionName, { filter: { slug: { _eq: obj.slug } }, limit: 1 }));
  if (found.length) return found[0].id;
  const created = await client.request(createItem(collectionName, obj));
  return created.id;
}

async function importHero(imageKey, title) {
  const url = IMG[imageKey];
  if (!url) return null;
  try {
    const file = await client.request(importFile(url, { title }));
    return file.id;
  } catch (e) {
    console.log('  warn  hero image import failed for', title, '-', e?.errors?.[0]?.message || e.message);
    return null;
  }
}

// Reference data first, capture id maps.
console.log('Categories / tags / occasions...');
const catId = {};
for (const c of CATEGORIES) catId[c.slug] = await ensureBySlug('categories', c);
const tagId = {};
for (const slug of TAGS) tagId[slug] = await ensureBySlug('tags', { name: slug.replaceAll('-', ' '), slug });
const occId = {};
for (const slug of OCCASIONS) occId[slug] = await ensureBySlug('occasions', { name: slug.replaceAll('-', ' '), slug });

console.log('Places + reviews...');
for (const p of PLACES) {
  const existing = await client.request(readItems('places', { filter: { slug: { _eq: p.slug } }, limit: 1 }));
  if (existing.length) {
    console.log('  skip ', p.slug, '(exists)');
    continue;
  }

  const heroId = await importHero(p.image, p.title);

  const place = await client.request(
    createItem('places', {
      title: p.title,
      slug: p.slug,
      category: catId[p.category],
      area: p.area,
      address: p.address,
      geo: p.geo,
      price_band: p.price_band,
      booking_url: p.booking_url,
      status: 'published',
      hero_image: heroId,
      tags: p.tags.map((t) => ({ tags_id: tagId[t] })),
      occasions: p.occasions.map((o) => ({ occasions_id: occId[o] })),
    }),
  );

  await client.request(
    createItem('reviews', {
      place: place.id,
      author: 'Unlocking London',
      verdict: p.review.verdict,
      pull_quote: p.review.pull_quote,
      body: p.review.body,
      status: 'published',
      published_at: new Date().toISOString(),
    }),
  );

  console.log('  ok   ', p.slug, heroId ? '(with hero)' : '(no hero)');
}

console.log('Seed complete.');
