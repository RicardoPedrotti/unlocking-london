import { getTokens, putTasteProfile } from './api';
import type { TasteProfile } from './types';

/**
 * Persist onboarding answers to the signed-in user's taste profile via the BFF
 * (create-or-update, O2O). No-op if not signed in - answers stay client-side
 * until the user links an account. Personalisation off these answers is later.
 */
export async function saveTasteProfile(onboarding: Record<string, string[]>) {
  if (!(await getTokens())) return; // not signed in -> skip silently
  await putTasteProfile(onboarding as TasteProfile['onboarding']);
}
