import { ActivityIndicator, Pressable, StyleSheet, type PressableProps } from 'react-native';
import { radius, space, useTheme } from '../theme';
import { Text } from './Text';

/**
 * Primary (filled accent) + secondary (outline) buttons.
 * Comfortable 52pt touch target, tactile press feedback (opacity + scale).
 */
export function Button({
  title,
  variant = 'primary',
  loading,
  disabled,
  style,
  ...rest
}: PressableProps & {
  title: string;
  variant?: 'primary' | 'secondary';
  loading?: boolean;
}) {
  const { c } = useTheme();
  const isPrimary = variant === 'primary';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: isPrimary ? c.accent : 'transparent',
          borderColor: c.accent,
          borderWidth: isPrimary ? 0 : StyleSheet.hairlineWidth,
          opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style as object,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? c.onAccent : c.accent} />
      ) : (
        <Text
          variant="label"
          style={{ color: isPrimary ? c.onAccent : c.accent, fontSize: 15 }}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
  },
});
