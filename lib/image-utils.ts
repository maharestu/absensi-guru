/**
 * Utility client-side untuk memanipulasi gambar sebelum diunggah.
 */

/**
 * Mengonversi file gambar (JPG, PNG) menjadi Blob berformat WebP
 * untuk menghemat ruang penyimpanan.
 *
 * @param file File gambar yang dipilih oleh user
 * @param quality Kualitas kompresi (0.0 sampai 1.0)
 * @returns Promise<Blob> yang merupakan hasil konversi WebP
 */
export function convertToWebp(file: File, quality: number = 0.75): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        
        if (!ctx) {
          reject(new Error("Gagal mendapatkan context canvas"));
          return;
        }

        ctx.drawImage(img, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Gagal mengonversi ke WebP"));
            }
          },
          "image/webp",
          quality
        );
      };
      
      // Setelah img.onload dan img.onerror di-set, masukkan URL
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}
