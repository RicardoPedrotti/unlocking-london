import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ImageCard } from '../../src/components/ImageCard';
import { SectionHeader } from '../../src/components/SectionHeader';
import { Text } from '../../src/components/Text';
import { usePlaces } from '../../src/lib/queries';
import type { Place } from '../../src/lib/types';
import { screenMargin, space, useTheme } from '../../src/theme';

/**
 * Discover: the editorial surface. Browse by story, not geography.
 * Hero "Featured this week" + an occasion rail. Complements the map.
 */
const RAIL_OCCASION = 'take-your-parents';

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const router = useRouter();
  const { c } = useTheme();
  const { data: places = [], isLoading } = usePlaces();

  // Relative sizing so cards scale across iPhone SE -> Pro Max.
  const heroH = Math.round(height * 0.58);
  const railCardW = Math.round(width * 0.72); // leaves the next card peeking
  const railCardH = Math.round(height * 0.44);

  const featured = places[0];
  const rail = useMemo(
    () =>
      places.filter((p) =>
        (p.occasions ?? []).some((o) => o.slug === RAIL_OCCASION),
      ),
    [places],
  );
  const railTitle =
    rail[0]?.occasions?.find((o) => o.slug === RAIL_OCCASION)?.name ?? 'Take your parents';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.paper }}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 120 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.head}>
        <Text
          variant="signature"
          accent
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{ fontSize: 60, lineHeight: 60, marginTop: space.xs }}
        >
          Unlocking London
        </Text>
      </View>

      {isLoading ? (
        <Text variant="body" muted style={styles.pad}>
          Gathering our latest picks…
        </Text>
      ) : null}

      {featured ? (
        <View style={styles.pad}>
          <SectionHeader kicker="Featured this week" title="Our pick" />
          <ImageCard place={featured} height={heroH} onPress={() => router.push(`/place/${featured.id}`)} />
        </View>
      ) : null}

      {rail.length ? (
        <View style={{ marginTop: space.xxl }}>
          <View style={styles.pad}>
            <SectionHeader kicker="For the occasion" title={railTitle} />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: screenMargin, gap: space.lg }}
          >
            {rail.map((p: Place) => (
              <View key={p.id} style={{ width: railCardW }}>
                <ImageCard place={p} height={railCardH} onPress={() => router.push(`/place/${p.id}`)} />
              </View>
            ))}
          </ScrollView>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: screenMargin, marginBottom: space.xl },
  pad: { paddingHorizontal: screenMargin },
});
