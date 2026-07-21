import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';
import { assetUrl } from '../lib/api';
import type { Place } from '../lib/types';
import { radius, space, useTheme } from '../theme';
import { Text } from './Text';

/**
 * Full-bleed editorial place card: hero photo, gradient scrim, serif name.
 * Photography is the hero; the scrim only exists so text stays legible.
 */
export function ImageCard({
  place,
  onPress,
  height = 420,
}: {
  place: Place;
  onPress?: () => void;
  height?: number;
}) {
  const { c } = useTheme();
  const category = typeof place.category === 'object' ? place.category?.name : undefined;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.96 : 1 }]}>
      <View style={[styles.card, { height, borderRadius: radius.xl, backgroundColor: c.card }]}>
        <Image
          source={{ uri: assetUrl(place.hero_image, { width: 1200 }) }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={300}
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.05)', c.scrim]}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.meta}>
          {category ? (
            <Text variant="overline" onDark style={{ opacity: 0.85, marginBottom: space.xs }}>
              {category} · {place.area}
            </Text>
          ) : null}
          <Text variant="title" onDark numberOfLines={2}>
            {place.title}
          </Text>
          {place.price_band ? (
            <Text variant="label" onDark style={{ opacity: 0.85, marginTop: space.xs }}>
              {place.price_band}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { overflow: 'hidden', justifyContent: 'flex-end' },
  meta: { padding: space.xl },
});
