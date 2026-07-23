import { SymbolView } from 'expo-symbols';
import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chip } from '../../src/components/Chip';
import { Glass } from '../../src/components/Glass';
import { PlacePreviewCard } from '../../src/components/PlacePreviewCard';
import { useUserLocation } from '../../src/lib/location';
import { useCategories, usePlaces } from '../../src/lib/queries';
import type { Category, Place } from '../../src/lib/types';
import { MapView, type MapHandle, type Marker } from '../../src/map/MapView';
import { colors, radius, space } from '../../src/theme';

/**
 * The heart of Unlocking London: a beautiful Apple map plotting every curated
 * place around you. Branded pins per category, floating glass filters +
 * locate-me, and a glass preview card that rises on tap.
 */
export default function MapScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const mapRef = useRef<MapHandle>(null);
  const userCoords = useUserLocation();

  const { data: places = [] } = usePlaces();
  const { data: categories = [] } = useCategories();
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [selected, setSelected] = useState<Place | null>(null);

  // Drop both our card and MapKit's native pin highlight.
  const clearSelection = () => {
    setSelected(null);
    mapRef.current?.deselect();
  };

  const catById = useMemo(() => {
    const m = new Map<string, Category>();
    (categories as Category[]).forEach((c) => m.set(c.id, c));
    return m;
  }, [categories]);

  // ponytail: filter by category only. Viewport/zoom clustering is YAGNI at
  // 6-8 seeded places; add onCameraChange-driven clustering when the dataset
  // grows past a few hundred pins.
  const markers: Marker[] = useMemo(() => {
    return places
      .filter((p) => {
        if (!p.geo) return false;
        const catId = typeof p.category === 'object' ? p.category.id : p.category;
        return !activeCat || catId === activeCat;
      })
      .map((p) => {
        const cat = typeof p.category === 'object' ? p.category : catById.get(p.category as string);
        return {
          id: p.id,
          place: p,
          color: cat?.pin_color ?? colors.light.accent,
          icon: cat?.pin_icon ?? 'mappin',
        };
      });
  }, [places, activeCat, catById]);

  return (
    <View style={styles.fill}>
      <MapView
        ref={mapRef}
        markers={markers}
        center={userCoords}
        onMarkerPress={(place) => {
          if (selected?.id === place.id) {
            clearSelection(); // re-tap the active pin toggles the card off
            return;
          }
          setSelected(place);
          mapRef.current?.flyTo(place.geo.lat, place.geo.lng, { zoom: 16, pitch: 55 });
        }}
        onMapPress={clearSelection}
      />

      {/* Floating glass category filters */}
      <View style={[styles.filters, { top: insets.top + space.sm }]} pointerEvents="box-none">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          <Chip label="All" selected={!activeCat} onPress={() => setActiveCat(null)} />
          {(categories as Category[]).map((c) => (
            <Chip
              key={c.id}
              label={c.name}
              selected={activeCat === c.id}
              onPress={() => setActiveCat(activeCat === c.id ? null : c.id)}
            />
          ))}
        </ScrollView>
      </View>

      {/* Locate-me floating glass control. Hidden while a preview card is up
          so the two don't stack on the same bottom offset. */}
      {selected ? null : (
        <Glass style={[styles.locate, { bottom: insets.bottom + 96 }]} radius={radius.pill}>
          <Pressable
            accessibilityLabel="Centre on my location"
            onPress={() => mapRef.current?.flyTo(userCoords.lat, userCoords.lng, { zoom: 14 })}
            style={styles.locateHit}
          >
            <SymbolView name="location.fill" size={20} tintColor={colors.light.accent} />
          </Pressable>
        </Glass>
      )}

      {/* Bottom-docked glass preview. Dismiss by tapping the map or re-tapping
          the pin (both route through clearSelection). */}
      {selected ? (
        <View style={[styles.preview, { bottom: insets.bottom + 56 }]} pointerEvents="box-none">
          <PlacePreviewCard place={selected} onOpen={() => router.push(`/place/${selected.id}`)} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  filters: { position: 'absolute', left: 0, right: 0 },
  filterRow: { paddingHorizontal: space.lg, gap: space.sm },
  locate: {
    position: 'absolute',
    right: space.lg,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locateHit: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  preview: { position: 'absolute', left: space.lg, right: space.lg },
});
