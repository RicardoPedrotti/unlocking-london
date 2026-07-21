import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
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
  const router = useRouter();
  const { c } = useTheme();
  const { data: places = [], isLoading } = usePlaces();

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
      contentContainerStyle={{ paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + 120 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.head}>
        <Text variant="overline" accent>
          Unlocking London
        </Text>
        <Text variant="display" style={{ marginTop: space.xs }}>
          Discover
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
          <ImageCard place={featured} height={480} onPress={() => router.push(`/place/${featured.id}`)} />
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
              <View key={p.id} style={{ width: 280 }}>
                <ImageCard place={p} height={360} onPress={() => router.push(`/place/${p.id}`)} />
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
