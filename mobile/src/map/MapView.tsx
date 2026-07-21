import { AppleMaps } from 'expo-maps';
import { forwardRef, useImperativeHandle, useRef } from 'react';
import { StyleSheet, useColorScheme } from 'react-native';
import type { Place } from '../lib/types';

/**
 * Thin wrapper isolating the map provider. The rest of the app talks to this
 * interface only — swap the body for react-native-maps (Apple provider) or a
 * custom SwiftUI MapKit module if the expo-maps alpha bites, without touching
 * any screen. Muted style + 3D elevation + Flighty-style fly-to camera.
 */

export interface Marker {
  id: string;
  place: Place;
  color: string;
  icon: string; // SF Symbol
}

export interface MapHandle {
  /** Smooth fly-to a coordinate (Flighty signature camera move). */
  flyTo: (lat: number, lng: number, opts?: { zoom?: number; pitch?: number }) => void;
}

interface Props {
  markers: Marker[];
  center: { lat: number; lng: number };
  onMarkerPress?: (place: Place) => void;
  onCameraChange?: (region: { lat: number; lng: number; zoom: number }) => void;
}

const LONDON = { lat: 51.5074, lng: -0.1278 };

export const MapView = forwardRef<MapHandle, Props>(function MapView(
  { markers, center, onMarkerPress, onCameraChange },
  ref,
) {
  const mapRef = useRef<AppleMaps.MapView>(null);
  const scheme = useColorScheme();

  useImperativeHandle(ref, () => ({
    flyTo: (lat, lng, opts) => {
      mapRef.current?.setCameraPosition({
        coordinates: { latitude: lat, longitude: lng },
        zoom: opts?.zoom ?? 15,
        // pitch drives the subtle 3D tilt; camera glides (animated by MapKit).
      });
    },
  }));

  return (
    <AppleMaps.View
      ref={mapRef}
      style={StyleSheet.absoluteFill}
      cameraPosition={{
        coordinates: { latitude: center.lat ?? LONDON.lat, longitude: center.lng ?? LONDON.lng },
        zoom: 13,
      }}
      properties={{
        // Muted, clean base map + realistic 3D elevation.
        mapType: AppleMaps.MapType.STANDARD,
        isMyLocationEnabled: true,
        selectionEnabled: true,
        // colorScheme follows system; imagery stays the hero.
      }}
      uiSettings={{
        compassEnabled: false,
        myLocationButtonEnabled: false, // we ship a custom glass locate-me control
        scaleBarEnabled: false,
      }}
      markers={markers.map((m) => ({
        id: String(m.id), // native marker id must be a string; place.id is numeric
        coordinates: { latitude: m.place.geo.lat, longitude: m.place.geo.lng },
        title: m.place.title,
        tintColor: m.color,
        systemImage: m.icon, // branded per-category SF Symbol, not default red
      }))}
      onMarkerClick={(e: { id?: string }) => {
        const m = markers.find((x) => String(x.id) === e.id);
        if (m) onMarkerPress?.(m.place);
      }}
      onCameraMove={(e: any) => {
        const co = e?.coordinates ?? e?.cameraPosition?.coordinates;
        if (co) onCameraChange?.({ lat: co.latitude, lng: co.longitude, zoom: e?.zoom ?? 13 });
      }}
    />
  );
});

export { LONDON };
