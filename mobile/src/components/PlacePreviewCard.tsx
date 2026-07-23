import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { assetUrl } from '../lib/api';
import type { Place } from '../lib/types';
import { Glass } from './Glass';
import { radius, space } from '../theme';
import { Text } from './Text';

/**
 * Glass preview card that rises when a map pin is tapped: hero thumb, serif
 * name, area, address and price. Tapping it opens the full Place detail.
 */
export function PlacePreviewCard({
  place,
  onOpen,
}: {
  place: Place;
  onOpen: () => void;
}) {
  const category = typeof place.category === 'object' ? place.category?.name : undefined;
  return (
    <Animated.View entering={FadeInDown.springify().damping(40)} exiting={FadeOutDown}>
      <Glass style={styles.wrap} radius={radius.xl}>
        <Pressable onPress={onOpen} style={styles.row}>
          <Image
            source={{ uri: assetUrl(place.hero_image, { width: 200, height: 200 }) }}
            style={styles.thumb}
            contentFit="cover"
            transition={200}
          />
          <View style={styles.body}>
            <Text variant="overline" muted numberOfLines={1}>
              {[category, place.area].filter(Boolean).join(' · ')}
            </Text>
            <Text variant="headline" numberOfLines={1} style={{ marginVertical: 2 }}>
              {place.title}
            </Text>
            {place.address ? (
              <Text variant="caption" muted numberOfLines={1}>
                {place.address}
              </Text>
            ) : null}
            {place.price_band ? (
              <Text variant="label" muted style={{ marginTop: 2 }}>
                {place.price_band}
              </Text>
            ) : null}
          </View>
        </Pressable>
      </Glass>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: space.sm, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center' },
  thumb: { width: 76, height: 76, borderRadius: radius.lg, marginRight: space.md },
  body: { flex: 1, paddingRight: space.sm },
});
