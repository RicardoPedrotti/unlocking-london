// Authenticated Directus client for the bootstrap/seed scripts.
// Reads config from process.env; defaults match the local dev .env so
// `npm run setup` works out of the box. Override via env for other targets:
//   PUBLIC_URL=https://... ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run setup
import { createDirectus, rest, staticToken } from '@directus/sdk';

export const url = process.env.PUBLIC_URL || 'http://localhost:8055';
const email = process.env.ADMIN_EMAIL || 'admin@unlockinglondon.com';
const password = process.env.ADMIN_PASSWORD || 'admin-dev-pw';

export async function getClient() {
  // Manual /auth/login is version-proof vs SDK login() signature churn.
  const res = await fetch(`${url}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(`Login failed (${res.status}) at ${url}: ${await res.text()}`);
  }
  const { data } = await res.json();
  return createDirectus(url).with(staticToken(data.access_token)).with(rest());
}
