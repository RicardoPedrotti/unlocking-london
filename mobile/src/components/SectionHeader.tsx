import { View } from 'react-native';
import { space } from '../theme';
import { Text } from './Text';

/** Editorial section header: overline kicker + serif title. */
export function SectionHeader({ kicker, title }: { kicker?: string; title: string }) {
  return (
    <View style={{ marginBottom: space.lg }}>
      {kicker ? (
        <Text variant="overline" accent style={{ marginBottom: space.xs }}>
          {kicker}
        </Text>
      ) : null}
      <Text variant="headline">{title}</Text>
    </View>
  );
}
