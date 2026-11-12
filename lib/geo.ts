/**
 * GEOLOCATION & HAVERSINE FORMULA UTILITY (Placeholder Backend Helper)
 * 
 * Modul ini disiapkan untuk menghitung jarak akurat (dalam meter) antara 
 * titik lokasi GPS perangkat guru dan koordinat lokasi sekolah/kelas.
 * 
 * Referensi implementasi full-stack: https://github.com/naenmad/absensi-guru
 */

/**
 * Batas toleransi maksimal akurasi GPS perangkat (dalam meter).
 * Mencegah manipulasi/spoofing dengan nilai akurasi GPS yang tidak wajar,
 * sekaligus mengompensasi deviasi sinyal GPS wajar di dalam ruangan/gedung.
 */
export const MAX_GPS_ACCURACY_TOLERANCE_METER = 25;

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
 * Menghitung radius efektif dengan memperhitungkan toleransi ketidakakuratan GPS perangkat.
 * @param baseRadiusMeter Radius dasar geofence (dari database kelas atau sekolah)
 * @param accuracyMeter Tingkat ketidakakuratan GPS perangkat dalam meter (position.coords.accuracy)
 * @param maxToleranceMeter Batas atas kompensasi akurasi GPS (default: 25 meter)
 */
export function getEffectiveRadius(
  baseRadiusMeter: number,
  accuracyMeter?: number | null,
  maxToleranceMeter: number = MAX_GPS_ACCURACY_TOLERANCE_METER
): number {
  const base = Number(baseRadiusMeter) || 10;
  if (accuracyMeter == null || isNaN(accuracyMeter) || accuracyMeter <= 0) {
    return base;
  }
  const tolerance = Math.min(accuracyMeter, maxToleranceMeter);
  return base + tolerance;
}

/**
 * Memeriksa apakah lokasi guru berada di dalam radius geofence sekolah/kelas,
 * dengan mempertimbangkan akurasi GPS perangkat jika tersedia.
 */
export function isWithinGeofence(
  userLat: number,
  userLng: number,
  schoolLat: number,
  schoolLng: number,
  radiusMeter: number,
  accuracyMeter?: number | null
): boolean {
  const distance = calculateDistanceMeter(userLat, userLng, schoolLat, schoolLng);
  const effectiveRadius = getEffectiveRadius(radiusMeter, accuracyMeter);
  return distance <= effectiveRadius;
}
