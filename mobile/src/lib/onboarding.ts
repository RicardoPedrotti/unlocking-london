import * as SecureStore from 'expo-secure-store';
import { useEffect, useState } from 'react';

const KEY = 'ul_onboarded';

export async function setOnboarded() {
  await SecureStore.setItemAsync(KEY, '1');
}

/** null = still loading, then boolean. Drives the first-launch onboarding gate. */
export function useOnboarded() {
  const [done, setDone] = useState<boolean | null>(null);
  useEffect(() => {
    SecureStore.getItemAsync(KEY).then((v) => setDone(v === '1'));
  }, []);
  return done;
}
