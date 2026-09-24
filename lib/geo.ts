/**
 * GEOLOCATION & HAVERSINE FORMULA UTILITY (Placeholder Backend Helper)
 * 
 * Modul ini disiapkan untuk menghitung jarak akurat (dalam meter) antara 
 * titik lokasi GPS perangkat guru dan koordinat lokasi sekolah.
 * 
 * Referensi implementasi full-stack: https://github.com/naenmad/absensi-guru
 */

/**
 * Menghitung jarak antara 2 titik koordinat (Latitude, Longitude) menggunakan rumus Haversine.
 * @returns Jarak dalam meter
 */
export function calculateDistanceMeter(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Radius bumi dalam meter
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Memeriksa apakah lokasi guru berada di dalam radius geofence sekolah.
 */
export function isWithinGeofence(
  userLat: number,
  userLng: number,
  schoolLat: number,
  schoolLng: number,
  radiusMeter: number
): boolean {
  const distance = calculateDistanceMeter(userLat, userLng, schoolLat, schoolLng);
  return distance <= radiusMeter;
}
