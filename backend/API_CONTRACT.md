# Unlocking London BFF - API contract (v1)

The Expo app talks ONLY to this backend. The backend fronts Directus (Directus
stays internal/private). Base path: `/v1`. JSON in/out. CORS open for dev.

Auth: the app stores `access_token` (+ `refresh_token`) from `/auth/*` and sends
`Authorization: Bearer <access_token>` on `/me/*` calls. Public content
(`/places`, `/categories`, `/occasions`, `/assets`) needs no Bearer - the
backend reads those from Directus using a cached admin session (server-side).

## Content

### GET /v1/places
Published places, normalized (M2M junctions flattened). Returns `Place[]`.

### GET /v1/places/:id
One place by id, normalized. 404 if not found/unpublished. Returns `Place`.

### GET /v1/categories -> Category[]
### GET /v1/occasions -> Occasion[]

## Auth (proxy to Directus)

### POST /v1/auth/login  { email, password } -> { access_token, refresh_token, expires }
### POST /v1/auth/refresh { refresh_token }   -> { access_token, refresh_token, expires }
### POST /v1/auth/logout  { refresh_token }    -> 204
### POST /v1/auth/apple   { identityToken, fullName? } -> { access_token, refresh_token, expires }
  EXTENSION POINT: returns 501 until an Apple provider/flow exists in Directus.
  Shape is fixed so the app wires in once and never changes.

## Me (require Bearer; forwarded to Directus)

### GET /v1/me -> { id, email, first_name }
### GET /v1/me/taste-profile -> TasteProfile | null
### PUT /v1/me/taste-profile { onboarding } -> TasteProfile   (create-or-update, O2O per user)

## Assets

### GET /v1/assets/:id?width=&height=&quality=&fit=
Streams the image from Directus `/assets/:id` (transform query passed through).
Keeps the Directus/R2 bucket private - the app only ever hits the backend.

## Shapes (match app/src/lib/types.ts)

```ts
Category { id; name; slug; pin_icon; pin_color }
Tag      { id; name; slug }
Occasion { id; name; slug }
Review   { id; place; body; verdict?; pull_quote?; author?; images?; published_at?; status }
Place {
  id; title; slug; category: Category; area; geo: { lat; lng };
  address?; price_band?; hero_image?;         // hero_image = Directus file id (string)
  gallery?: string[]; opening_hours?; booking_url?; external_ids?; status;
  tags: Tag[]; occasions: Occasion[]; reviews: Review[];
}
TasteProfile { id; user; onboarding: { cuisines?; price_bands?; vibes?; occasions? }; updated_at? }
```

Directus expansion the backend must request for a full Place:
`fields=*,category.*,hero_image,tags.tags_id.*,occasions.occasions_id.*,reviews.*`
then flatten `tags[].tags_id` -> `tags[]`, `occasions[].occasions_id` -> `occasions[]`,
`gallery[].directus_files_id` -> `gallery[]` (file ids).
Ids from Directus are integers; serialize as-is (the app treats id as string|number).
