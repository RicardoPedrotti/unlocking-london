import { Pressable, StyleSheet } from 'react-native';
import { radius, space, useTheme } from '../theme';
import { Text } from './Text';

/** Tag / occasion / filter chip. `selected` fills with accent. */
export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
}) {
  const { c } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.chip,
        {
          backgroundColor: selected ? c.accent : c.card,
          borderColor: selected ? c.accent : c.divider,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <Text variant="label" style={{ color: selected ? c.onAccent : c.inkSoft }}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: space.md,
    height: 34,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
