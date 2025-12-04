/**
 * File: geo.ts
 * @author: eventFlow Team
 * Deskripsi: Utility untuk perhitungan geolokasi, jarak, dan logika geofence pada event.
 * Dibuat: 2025-11-10
 * Terakhir Diubah: 2025-11-10
 * Versi: 1.0.0
 * Lisensi: MIT
 * Dependensi: -
*/

import { distance as turfDistance, booleanPointInPolygon } from '@turf/turf';

// Hitung jarak antara dua titik (meter)
export function calculateDistance(a: { latitude: number, longitude: number }, b: { latitude: number, longitude: number }): number {
  return turfDistance([a.longitude, a.latitude], [b.longitude, b.latitude], { units: 'meters' });
}

// Cek apakah posisi user dekat dengan titik tertentu (radius dalam meter)
export function isLocationNearPoint(pos: { latitude: number, longitude: number }, target: { latitude: number, longitude: number }, radius: number): boolean {
  return calculateDistance(pos, target) <= radius;
}

// Cari area virtual terdekat dari posisi user
export function getNearestVirtualArea(pos: { latitude: number, longitude: number }, areas: { id: string, name: string, area: number[][][] }[]): { id: string, name: string, distance: number } | null {
  let nearest = null;
  let minDist = Infinity;
  for (const va of areas) {
    // Ambil centroid area
    const coords = va.area[0];
    const centroid = coords.reduce((acc, cur) => [acc[0] + cur[0], acc[1] + cur[1]], [0, 0]);
    const len = coords.length;
    const centroidLat = centroid[1] / len;
    const centroidLng = centroid[0] / len;
    const dist = calculateDistance(pos, { latitude: centroidLat, longitude: centroidLng });
    if (dist < minDist) {
      minDist = dist;
      nearest = { id: va.id, name: va.name, distance: dist };
    }
  }
  return nearest;
}

// Konversi array koordinat ke GeoJSON Polygon
export function formatGeoJsonPolygon(coords: number[][]): object {
  return { type: 'Polygon', coordinates: [coords] };
}

// Cek apakah posisi user ada di dalam lingkaran (radius-based geofence)
export function isLocationInsideCircle(pos: { latitude: number, longitude: number }, center: { latitude: number, longitude: number }, radius: number): boolean {
  return calculateDistance(pos, center) <= radius;
}

// Mendapatkan nama/ID area virtual tempat user berada
export function getUserCurrentArea(pos: { latitude: number, longitude: number }, areas: { id: string, name: string, area: number[][][] }[]): { id: string, name: string } | null {
  for (const va of areas) {
    if (isLocationInsideGeofence(pos, va.area)) {
      return { id: va.id, name: va.name };
    }
  }
  return null;
}

// Cek apakah posisi (lat, lng) ada di dalam area geofence (polygon)
// area: array of [lng, lat] (GeoJSON Polygon)
// pos: { latitude, longitude }

export function isLocationInsideGeofence(pos: { latitude: number, longitude: number }, area: number[][][]): boolean {
  // area: [[[lng, lat], ...]] (GeoJSON Polygon)
  const point = [pos.longitude, pos.latitude];
  return booleanPointInPolygon(point, { type: 'Polygon', coordinates: area });
}