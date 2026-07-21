import { isLiquidGlassAvailable, GlassView } from 'expo-glass-effect';
import { AccessibilityInfo, StyleSheet, View, type ViewProps } from 'react-native';
import { useEffect, useState } from 'react';
import { radius as R, useTheme } from '../theme';

/**
 * Liquid Glass surface with graceful fallback.
 * - iOS 26 + glass API available + transparency on → real GlassView.
 * - Otherwise → tinted solid "paper" panel (Reduce Transparency safe).
 * Glass is a light accent for nav/controls over photography, never a theme.
 */
export function Glass({
  style,
  radius = R.xl,
  children,
  ...rest
}: ViewProps & { radius?: number }) {
  const { c } = useTheme();
  const [reduceTransparency, setReduce] = useState(false);

  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceTransparencyEnabled?.().then((v) => alive && setReduce(!!v));
    const sub = AccessibilityInfo.addEventListener?.('reduceTransparencyChanged', setReduce);
    return () => {
      alive = false;
      sub?.remove?.();
    };
  }, []);

  const useGlass = isLiquidGlassAvailable() && !reduceTransparency;

  if (useGlass) {
    return (
      <GlassView style={[{ borderRadius: radius }, style]} glassEffectStyle="regular" {...rest}>
        {children}
      </GlassView>
    );
  }
  return (
    <View
      style={[styles.fallback, { backgroundColor: c.glassTint, borderRadius: radius, borderColor: c.divider }, style]}
      {...rest}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: { borderWidth: StyleSheet.hairlineWidth },
});
