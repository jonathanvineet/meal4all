import * as Location from 'expo-location';

import type { Coords } from './types';

/** Asks for permission and returns the device's position plus a readable address, or null if denied/unavailable. */
export async function currentPlace(): Promise<{ coords: Coords; address?: string } | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;
    const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    let address: string | undefined;
    try {
      const [p] = await Location.reverseGeocodeAsync({ latitude: coords.lat, longitude: coords.lng });
      if (p) address = [p.name, p.street, p.district ?? p.subregion, p.city].filter(Boolean).join(', ');
    } catch {
      // Reverse geocoding isn't available everywhere (e.g. web); coords alone are still useful.
    }
    return { coords, address };
  } catch {
    return null;
  }
}
