import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/lib/auth';
import { useOnboarded } from '../src/lib/onboarding';
import { useEditorialFonts } from '../src/theme/fonts';

/** First-launch gate: send new users to onboarding before the map. */
function OnboardingGate() {
  const done = useOnboarded();
  const router = useRouter();
  useEffect(() => {
    if (done === false) router.replace('/onboarding');
  }, [done, router]);
  return null;
}

SplashScreen.preventAutoHideAsync().catch(() => undefined);

const queryClient = new QueryClient();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useEditorialFonts();

  useEffect(() => {
    if (fontsLoaded || fontError) SplashScreen.hideAsync().catch(() => undefined);
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <StatusBar style="auto" />
            <OnboardingGate />
            <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'transparent' } }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="onboarding" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
              <Stack.Screen name="auth" options={{ presentation: 'modal' }} />
              <Stack.Screen
                name="place/[id]"
                options={{ presentation: 'card', animation: 'slide_from_bottom' }}
              />
            </Stack>
          </AuthProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
