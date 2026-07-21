import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { LONDON } from '../map/MapView';

// Rough Greater London bounds; outside these we centre on central London.
const IN_LONDON = (lat: number, lng: number) =>
  lat > 51.28 && lat < 51.70 && lng > -0.52 && lng < 0.33;

/**
 * Request location IN CONTEXT (call this from the map, not on launch).
 * Denied / undetermined / outside London -> central London. Never blocks.
 */
export function useUserLocation() {
  const [coords, setCoords] = useState(LONDON);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return; // stays on London default
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const { latitude, longitude } = pos.coords;
        if (alive && IN_LONDON(latitude, longitude)) setCoords({ lat: latitude, lng: longitude });
      } catch {
        // swallow -> London default
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return coords;
}
