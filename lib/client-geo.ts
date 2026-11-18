/**
 * CLIENT-SIDE GEOLOCATION & GPS STABILIZER UTILITY
 * 
 * Mengatasi masalah cold-start dan cache GPS pada perangkat mobile.
 * Menggunakan pemantauan sinyal berkelanjutan (watchPosition) dengan target akurasi,
 * memastikan browser tidak menyajikan koordinat basi (maximumAge: 0) dan
 * menunggu penguncian satelit (satellite lock) yang optimal sebelum verifikasi.
 */

export type AccuratePositionResult = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

export type AccuratePositionOptions = {
  desiredAccuracyMeter?: number; // Target akurasi ideal (default: 25 meter)
  maxWaitMs?: number; // Batas waktu tunggu penguncian sinyal (default: 3500 ms)
  onProgress?: (accuracyMeter: number) => void; // Callback feedback progres akurasi ke UI
};

/**
 * Mendapatkan posisi koordinat GPS terkini dengan stabilisasi akurasi hardware.
 */
export function getAccurateCurrentPosition(
  options: AccuratePositionOptions = {}
): Promise<AccuratePositionResult> {
  const {
    desiredAccuracyMeter = 25,
    maxWaitMs = 3500,
    onProgress,
  } = options;

  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      return reject(new Error("Geolokasi tidak didukung oleh browser Anda."));
    }

    let isDone = false;
    let bestPosition: GeolocationPosition | null = null;
    let watchId: number | null = null;
    let timerId: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }
      if (timerId !== null) {
        clearTimeout(timerId);
        timerId = null;
      }
    };

    const finishWith = (pos: GeolocationPosition) => {
      if (isDone) return;
      isDone = true;
      cleanup();
      resolve({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
        accuracy: pos.coords.accuracy,
      });
    };

    const finishWithError = (err: any) => {
      if (isDone) return;
      if (bestPosition) {
        finishWith(bestPosition);
        return;
      }
      isDone = true;
      cleanup();
      reject(err);
    };

    // Jendela waktu penguncian sinyal satelit (maksimal maxWaitMs)
    timerId = setTimeout(() => {
      if (bestPosition) {
        finishWith(bestPosition);
      } else {
        // Fallback panggil direct getCurrentPosition jika watchPosition belum sempat emit
        navigator.geolocation.getCurrentPosition(
          (pos) => finishWith(pos),
          (err) => finishWithError(err),
          { enableHighAccuracy: true, timeout: 4000, maximumAge: 0 }
        );
      }
    }, maxWaitMs);

    try {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          if (isDone) return;
          const currentAcc = pos.coords.accuracy;
          if (onProgress && typeof currentAcc === "number") {
            onProgress(Math.round(currentAcc));
          }

          if (!bestPosition || currentAcc < bestPosition.coords.accuracy) {
            bestPosition = pos;
          }

          // Jika sinyal satelit sudah presisi (<= desiredAccuracyMeter), segera selesaikan!
          if (currentAcc <= desiredAccuracyMeter) {
            finishWith(pos);
          }
        },
        (err) => {
          // Jika terjadi error sementara namun sudah ada sampel koordinat terbaik, gunakan itu
          if (bestPosition) {
            finishWith(bestPosition);
          }
        },
        {
          enableHighAccuracy: true,
          timeout: maxWaitMs + 2000,
          maximumAge: 0, // Wajib 0 agar tidak mengambil koordinat basi dari cache memori
        }
      );
    } catch (e) {
      finishWithError(e);
    }
  });
}
