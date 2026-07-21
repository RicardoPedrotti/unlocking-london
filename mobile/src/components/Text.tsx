import { Text as RNText, type TextProps } from 'react-native';
import { type as typeScale, useTheme } from '../theme';

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
  const color = accent ? c.accent : onDark ? '#F2EBDF' : muted ? c.inkMuted : c.ink;
  return <RNText style={[typeScale[variant], { color }, style]} {...rest} />;
}
