// Idempotent schema provisioning for Unlocking London.
// Re-runnable: every create is guarded (lookup-first or catch-and-skip).
//
// Directus 11 permission model note: permissions attach to POLICIES, not roles.
// So each role gets a policy, permissions live on the policy, and directus_access
// links role -> policy.
//
// ---------------------------------------------------------------------------
// Deferred collections (NOT created here - add when the feature actually lands):
//   favourites   (user <-> place, saved pins)
//   lists        (user-curated collections of places)
//   ratings      (per-user place ratings, separate from editorial reviews)
//   plans        (itineraries / grouped outings)
//   swipes       (onboarding taste swipes / like-dislike log)
// ---------------------------------------------------------------------------
import {
  createCollection,
  createField,
  createRelation,
  updateRelation,
  createRole,
  readRoles,
  createPolicy,
  readPolicies,
  createPermission,
  readPermissions,
  updateSettings,
} from '@directus/sdk';
import { getClient } from './client.mjs';

const client = await getClient();

// --- tiny helpers ----------------------------------------------------------
async function step(label, fn) {
  try {
    await fn();
    console.log('  ok   ', label);
  } catch (e) {
    const msg = e?.errors?.[0]?.message || e?.message || String(e);
    console.log('  skip ', label, '-', msg);
  }
}

// Low-level REST for directus_access (SDK helper naming varies across versions).
const raw = (options) => client.request(() => options);

const str = (field, opts = {}) => ({
  field,
  type: 'string',
  meta: { interface: 'input', required: !!opts.required },
  schema: { is_unique: !!opts.unique, is_nullable: !opts.required },
});
const text = (field) => ({ field, type: 'text', meta: { interface: 'input-multiline' }, schema: {} });
const json = (field, opts = {}) => ({
  field,
  type: 'json',
  meta: { interface: 'input-code', options: { language: 'json' }, required: !!opts.required },
  schema: { is_nullable: !opts.required },
});
const ts = (field) => ({ field, type: 'timestamp', meta: { interface: 'datetime' }, schema: {} });
const select = (field, choices, def) => ({
  field,
  type: 'string',
  meta: { interface: 'select-dropdown', options: { choices: choices.map((c) => ({ text: c, value: c })) } },
  schema: { default_value: def },
});
const pk = () => ({
  field: 'id',
  type: 'integer',
  meta: { hidden: true },
  schema: { is_primary_key: true, has_auto_increment: true },
});

async function collection(name, fields, meta = {}) {
  await step(`collection ${name}`, () =>
    client.request(createCollection({ collection: name, meta: { icon: 'place', ...meta }, schema: {}, fields: [pk(), ...fields] })),
  );
}

// Many-to-one: scalar FK field on `coll` pointing at `related`.
const UUID_TARGETS = ['directus_files', 'directus_users'];
async function m2o(coll, field, related, { onDelete = 'SET NULL' } = {}) {
  const isFile = related === 'directus_files';
  const type = UUID_TARGETS.includes(related) ? 'uuid' : 'integer';
  await step(`field ${coll}.${field}`, () =>
    client.request(
      createField(coll, {
        field,
        type,
        meta: {
          interface: isFile ? 'file' : 'select-dropdown-m2o',
          special: isFile ? ['file'] : null,
        },
        schema: {},
      }),
    ),
  );
  await step(`relation ${coll}.${field} -> ${related}`, () =>
    client.request(createRelation({ collection: coll, field, related_collection: related, meta: {}, schema: { on_delete: onDelete } })),
  );
}

// Many-to-many via a junction collection. `files:true` links the B side to directus_files.
async function m2m(collA, aliasField, collB, junction, { files = false } = {}) {
  const aKey = `${collA}_id`;
  const bKey = files ? 'directus_files_id' : `${collB}_id`;
  const bColl = files ? 'directus_files' : collB;
  const bType = files ? 'uuid' : 'integer';

  await step(`collection ${junction}`, () =>
    client.request(createCollection({ collection: junction, meta: { hidden: true }, schema: {}, fields: [pk()] })),
  );
  await step(`field ${junction}.${aKey}`, () => client.request(createField(junction, { field: aKey, type: 'integer', meta: {}, schema: {} })));
  await step(`field ${junction}.${bKey}`, () => client.request(createField(junction, { field: bKey, type: bType, meta: {}, schema: {} })));
  await step(`field ${collA}.${aliasField}`, () =>
    client.request(createField(collA, { field: aliasField, type: 'alias', meta: { special: ['m2m'], interface: files ? 'files' : 'list-m2m' } })),
  );
  await step(`relation ${junction}.${aKey}`, () =>
    client.request(
      createRelation({
        collection: junction,
        field: aKey,
        related_collection: collA,
        meta: { one_field: aliasField, junction_field: bKey },
        schema: { on_delete: 'SET NULL' },
      }),
    ),
  );
  await step(`relation ${junction}.${bKey}`, () =>
    client.request(
      createRelation({
        collection: junction,
        field: bKey,
        related_collection: bColl,
        meta: { one_field: null, junction_field: aKey },
        schema: { on_delete: 'SET NULL' },
      }),
    ),
  );
}

// --- collections ------------------------------------------------------------
console.log('Collections...');
await collection('categories', [str('name'), str('slug', { unique: true }), str('pin_icon'), str('pin_color')], { icon: 'category' });
await collection('tags', [str('name'), str('slug')], { icon: 'sell' });
await collection('occasions', [str('name'), str('slug')], { icon: 'celebration' });

await collection(
  'places',
  [
    str('title', { required: true }),
    str('slug', { unique: true, required: true }),
    str('area'),
    str('address'),
    select('price_band', ['£', '££', '£££', '££££'], null),
    json('geo', { required: true }), // { lat, lng } - REQUIRED
    json('opening_hours'),
    str('booking_url'),
    json('external_ids'),
    select('status', ['draft', 'published', 'archived'], 'draft'),
  ],
  { icon: 'place' },
);

await collection(
  'reviews',
  [text('body'), str('verdict'), text('pull_quote'), str('author'), ts('published_at'), select('status', ['draft', 'published'], 'draft')],
  { icon: 'reviews' },
);

await collection('taste_profiles', [json('onboarding'), ts('updated_at')], { icon: 'psychology' });

// --- relations --------------------------------------------------------------
console.log('Relations...');
await m2o('places', 'category', 'categories');
await m2o('places', 'hero_image', 'directus_files');
await m2m('places', 'gallery', null, 'places_gallery', { files: true });
await m2m('places', 'tags', 'tags', 'places_tags');
await m2m('places', 'occasions', 'occasions', 'places_occasions');

await m2o('reviews', 'place', 'places', { onDelete: 'CASCADE' });
await m2m('reviews', 'images', null, 'reviews_images', { files: true });

// Reverse O2M: places.reviews (the editorial spine). The M2O above creates the
// FK on reviews; this adds the one-side alias on places + points the relation's
// one_field at it, so `fields=reviews.*` on a place actually resolves.
await step('field places.reviews (o2m alias)', () =>
  client.request(
    createField('places', { field: 'reviews', type: 'alias', meta: { special: ['o2m'], interface: 'list-o2m' } }),
  ),
);
await step('relation reviews.place one_field -> places.reviews', () =>
  client.request(updateRelation('reviews', 'place', { meta: { one_field: 'reviews' } })),
);

await m2o('taste_profiles', 'user', 'directus_users'); // effectively O2O (one profile per user)

// --- roles, policies, permissions -------------------------------------------
console.log('Roles & permissions...');

async function ensureRole(name) {
  const found = await client.request(readRoles({ filter: { name: { _eq: name } }, limit: 1 }));
  if (found.length) return found[0].id;
  const role = await client.request(createRole({ name }));
  return role.id;
}
async function ensurePolicy(name, extra = {}) {
  const found = await client.request(readPolicies({ filter: { name: { _eq: name } }, limit: 1 }));
  if (found.length) return found[0].id;
  const p = await client.request(createPolicy({ name, app_access: true, ...extra }));
  return p.id;
}
async function ensureAccess(roleId, policyId) {
  const rows = await raw({
    method: 'GET',
    path: '/access',
    params: { 'filter[role][_eq]': roleId, 'filter[policy][_eq]': policyId, limit: 1 },
  });
  if (Array.isArray(rows) && rows.length) return;
  await raw({ method: 'POST', path: '/access', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: roleId, policy: policyId }) });
}
async function permit(policyId, collectionName, action, opts = {}) {
  const found = await client.request(
    readPermissions({ filter: { policy: { _eq: policyId }, collection: { _eq: collectionName }, action: { _eq: action } }, limit: 1 }),
  );
  if (found.length) return;
  await client.request(
    createPermission({
      policy: policyId,
      collection: collectionName,
      action,
      fields: opts.fields ?? ['*'],
      permissions: opts.permissions ?? {},
      validation: opts.validation ?? {},
      presets: opts.presets ?? null,
    }),
  );
}

const contentCollections = ['places', 'reviews', 'categories', 'tags', 'occasions'];
const junctions = ['places_tags', 'places_occasions', 'places_gallery', 'reviews_images'];

// Editorial: full CRUD on content + junctions, plus manage files.
const edRole = await ensureRole('Editorial');
const edPolicy = await ensurePolicy('Editorial');
await ensureAccess(edRole, edPolicy);
for (const c of [...contentCollections, ...junctions]) {
  for (const action of ['create', 'read', 'update', 'delete']) await permit(edPolicy, c, action);
}
for (const action of ['create', 'read', 'update']) await permit(edPolicy, 'directus_files', action);
console.log('  Editorial role ready');

// App User: read published content, own their taste profile.
const appRole = await ensureRole('App User');
const appPolicy = await ensurePolicy('App User');
await ensureAccess(appRole, appPolicy);

// Reference data + relation junctions + files: readable in full (no status column on lookups).
for (const c of ['categories', 'tags', 'occasions', ...junctions, 'directus_files']) await permit(appPolicy, c, 'read');
// Content with a lifecycle: published only.
const publishedOnly = { permissions: { status: { _eq: 'published' } } };
await permit(appPolicy, 'places', 'read', publishedOnly);
await permit(appPolicy, 'reviews', 'read', publishedOnly);
// Own taste profile only.
const ownOnly = { permissions: { user: { _eq: '$CURRENT_USER' } } };
await permit(appPolicy, 'taste_profiles', 'create', { ...ownOnly, presets: { user: '$CURRENT_USER' } });
await permit(appPolicy, 'taste_profiles', 'read', ownOnly);
await permit(appPolicy, 'taste_profiles', 'update', ownOnly);
console.log('  App User role ready');

// Public registration -> new users default to App User.
await step('public registration settings', () =>
  client.request(updateSettings({ public_registration: true, public_registration_role: appRole })),
);

console.log('Schema bootstrap complete.');
