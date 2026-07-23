import { Text as RNText, type TextProps } from 'react-native';
import { colors, type as typeScale, useTheme } from '../theme';

type Variant = keyof typeof typeScale;

/** Themed text. `variant` pulls from the type scale; `muted`/`accent` set colour. */
export function Text({
  variant = 'body',
  muted,
  accent,
  onDark,
  style,
  ...rest
}: TextProps & { variant?: Variant; muted?: boolean; accent?: boolean; onDark?: boolean }) {
  const { c } = useTheme();
  // onDark = text over photography; always bone, so reuse the dark-scheme ink token.
  const color = accent ? c.accent : onDark ? colors.dark.ink : muted ? c.inkMuted : c.ink;
  return <RNText style={[typeScale[variant], { color }, style]} {...rest} />;
}
