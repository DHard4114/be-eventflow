"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateDistance = calculateDistance;
exports.isLocationNearPoint = isLocationNearPoint;
exports.getNearestVirtualArea = getNearestVirtualArea;
exports.formatGeoJsonPolygon = formatGeoJsonPolygon;
exports.isLocationInsideCircle = isLocationInsideCircle;
exports.getUserCurrentArea = getUserCurrentArea;
exports.isLocationInsideGeofence = isLocationInsideGeofence;
const turf_1 = require("@turf/turf");
// Hitung jarak antara dua titik (meter)
function calculateDistance(a, b) {
    return (0, turf_1.distance)([a.longitude, a.latitude], [b.longitude, b.latitude], { units: 'meters' });
}
// Cek apakah posisi user dekat dengan titik tertentu (radius dalam meter)
function isLocationNearPoint(pos, target, radius) {
    return calculateDistance(pos, target) <= radius;
}
// Cari area virtual terdekat dari posisi user
function getNearestVirtualArea(pos, areas) {
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
function formatGeoJsonPolygon(coords) {
    return { type: 'Polygon', coordinates: [coords] };
}
// Cek apakah posisi user ada di dalam lingkaran (radius-based geofence)
function isLocationInsideCircle(pos, center, radius) {
    return calculateDistance(pos, center) <= radius;
}
// Mendapatkan nama/ID area virtual tempat user berada
function getUserCurrentArea(pos, areas) {
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
function isLocationInsideGeofence(pos, area) {
    // area: [[[lng, lat], ...]] (GeoJSON Polygon)
    const point = [pos.longitude, pos.latitude];
    return (0, turf_1.booleanPointInPolygon)(point, { type: 'Polygon', coordinates: area });
}
