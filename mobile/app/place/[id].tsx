import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { Chip } from '../../src/components/Chip';
import { Glass } from '../../src/components/Glass';
import { Text } from '../../src/components/Text';
import { assetUrl } from '../../src/lib/api';
import { usePlace } from '../../src/lib/queries';
import { radius, screenMargin, space, useTheme } from '../../src/theme';

const HERO_H = 460;

export default function PlaceDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { c } = useTheme();
  const { data: place, isLoading } = usePlace(id);

  if (isLoading || !place) {
    return (
      <View style={[styles.fill, { backgroundColor: c.paper, justifyContent: 'center' }]}>
        <Text variant="body" muted style={{ textAlign: 'center' }}>
          {isLoading ? 'Loading…' : 'Place not found'}
        </Text>
      </View>
    );
  }

  const category = typeof place.category === 'object' ? place.category?.name : undefined;
  const review = (place.reviews ?? []).find((r) => r.status === 'published') ?? place.reviews?.[0];

  return (
    <View style={[styles.fill, { backgroundColor: c.paper }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
        {/* Full-bleed hero */}
        <View style={{ height: HERO_H }}>
          <Image
            source={{ uri: assetUrl(place.hero_image, { width: 1400 }) }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={300}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.25)', 'transparent', c.paper]}
            locations={[0, 0.4, 1]}
            style={StyleSheet.absoluteFill}
          />
        </View>

        <View style={styles.body}>
          {category ? (
            <Text variant="overline" accent>
              {[category, place.area].filter(Boolean).join(' · ')}
            </Text>
          ) : null}
          <Text variant="display" style={{ marginTop: space.sm }}>
            {place.title}
          </Text>
          <Text variant="label" muted style={{ marginTop: space.sm }}>
            {[place.price_band, place.address].filter(Boolean).join('  ·  ')}
          </Text>

          {review?.pull_quote ? (
            <View style={[styles.quote, { borderLeftColor: c.accent }]}>
              <Text variant="pullQuote">“{review.pull_quote}”</Text>
              {review.author ? (
                <Text variant="caption" muted style={{ marginTop: space.sm }}>
                  — {review.author}
                </Text>
              ) : null}
            </View>
          ) : null}

          {review?.verdict ? (
            <Text variant="bodyLg" style={{ marginTop: space.lg }}>
              {review.verdict}
            </Text>
          ) : null}
          {review?.body ? (
            <Text variant="body" muted style={{ marginTop: space.md }}>
              {review.body}
            </Text>
          ) : null}

          {/* Tags + occasions */}
          {(place.tags?.length || place.occasions?.length) ? (
            <View style={styles.chips}>
              {place.occasions?.map((o) => <Chip key={`o-${o.id}`} label={o.name} />)}
              {place.tags?.map((t) => <Chip key={`t-${t.id}`} label={t.name} />)}
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Back control (glass) */}
      <Glass style={[styles.back, { top: insets.top + space.sm }]} radius={radius.pill}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Back" style={styles.backHit}>
          <SymbolView name="chevron.left" size={18} tintColor={c.ink} />
        </Pressable>
      </Glass>

      {/* Book action */}
      {place.booking_url ? (
        <View style={[styles.cta, { bottom: insets.bottom + space.md }]}>
          <Button title="Book" onPress={() => Linking.openURL(place.booking_url!)} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  body: { paddingHorizontal: screenMargin, marginTop: -space.xxl },
  quote: {
    marginTop: space.xl,
    paddingLeft: space.lg,
    borderLeftWidth: 3,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm, marginTop: space.xl },
  back: { position: 'absolute', left: screenMargin, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  backHit: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  cta: { position: 'absolute', left: screenMargin, right: screenMargin },
});
