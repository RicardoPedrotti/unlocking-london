import type { ExpoConfig } from 'expo/config';

/**
 * Expo config for Unlocking London.
 * iOS-only, iOS 26 target, custom dev build (Liquid Glass needs on-device render).
 */
const config: ExpoConfig = {
  name: 'Unlocking London',
  slug: 'unlocking-london',
  owner: 'rpedrotti',
  scheme: 'unlockinglondon',
  version: '0.2.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic', // honour light/dark
  icon: './assets/icon.png',
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.unlockinglondon.app',
    usesAppleSignIn: true,
    deploymentTarget: '18.0', // expo-maps needs 18+; Liquid Glass activates on 26
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'Unlocking London uses your location to plot our curated places around you.',
      // RCTStatusBarManager (expo-status-bar's <StatusBar style="auto" />) throws
      // an NSException at runtime unless this is NO - the crash blocked the map screen.
      UIViewControllerBasedStatusBarAppearance: false,
    },
  },
  plugins: [
    'expo-router',
    'expo-status-bar',
    'expo-image',
    'expo-secure-store',
    'expo-apple-authentication',
    'expo-font',
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'Unlocking London uses your location to plot our curated places around you.',
      },
    ],
    [
      'expo-maps',
      {
        // Apple Maps provider — no API key needed on iOS.
      },
    ],
    [
      'expo-splash-screen',
      { backgroundColor: '#F6F1E9', dark: { backgroundColor: '#171310' }, resizeMode: 'contain' },
    ],
  ],
  experiments: { typedRoutes: true },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000',
    eas: { projectId: '86ecaf7b-7577-4fed-8864-14f9337bd227' },
  },
};

export default config;
