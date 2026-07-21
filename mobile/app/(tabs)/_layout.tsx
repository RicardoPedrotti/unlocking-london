import { NativeTabs } from 'expo-router/unstable-native-tabs';

/**
 * Liquid Glass floating tab bar via expo-router native tabs (system glass).
 * Map + Discover now; deferred tabs (Passport, Plans, etc.) slot in as more
 * <NativeTabs.Trigger> entries later.
 */
export default function TabsLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf="map.fill" />
        <NativeTabs.Trigger.Label>Map</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="discover">
        <NativeTabs.Trigger.Icon sf="sparkles" />
        <NativeTabs.Trigger.Label>Discover</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
