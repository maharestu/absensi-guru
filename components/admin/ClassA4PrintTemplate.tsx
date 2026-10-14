import React, { useState, useEffect } from "react";
import QRCode from "qrcode";
import { Kelas } from "@/types/schema";

interface ClassA4PrintTemplateProps {
  classData: Kelas;
}

export function ClassA4PrintTemplate({ classData }: ClassA4PrintTemplateProps) {
  const [qrSvg, setQrSvg] = useState<string>("");
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (typeof window !== "undefined" ? window.location.origin : "");
  const cleanBaseUrl = baseUrl.replace(/\/$/, "");
  const qrUrl = `${cleanBaseUrl}/absen-qr/${classData.kode_qr || classData.id}`;
  
  useEffect(() => {
    let isMounted = true;
    QRCode.toString(qrUrl, {
      type: "svg",
      margin: 1,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    })
      .then((svg) => {
        if (isMounted) setQrSvg(svg);
      })
      .catch((err) => {
        console.error("Gagal generate QR Code:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [qrUrl]);

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const startYear = currentMonth >= 6 ? currentYear : currentYear - 1;
  const academicYear = `${startYear}/${startYear + 1}`;

  return (
    <div className="w-[210mm] h-[296mm] bg-white text-black p-10 flex flex-col relative box-border mx-auto border border-slate-200 print:border-none shadow-sm print:shadow-none overflow-hidden print:w-[210mm] print:h-[296mm] print:overflow-hidden page-break-inside-avoid print:break-after-page">
      {/* Outer border for the A4 paper content */}
      <div className="absolute inset-2 border border-slate-800 pointer-events-none rounded-sm"></div>
      <div className="absolute inset-3 border border-slate-800 pointer-events-none rounded-sm"></div>

      <div className="relative z-10 flex flex-col h-full px-8 py-8">
        {/* Kop Surat */}
        <div className="flex items-center justify-between border-b-[3px] border-slate-800 pb-6 mb-8 w-full px-4">
          <div className="flex-shrink-0">
            <img src="/Logo.png" alt="Logo" className="w-[100px] h-[100px] object-contain" />
          </div>
          <div className="text-center flex-1 px-6">
            <h4 className="text-sm font-bold text-slate-700 tracking-wider">PEMERINTAH KABUPATEN KARAWANG</h4>
            <h2 className="text-2xl font-black text-slate-900 tracking-widest mt-1">SMP NEGERI 8 KARAWANG BARAT</h2>
            <p className="text-xs text-slate-600 mt-2">Jl. Karangpawitan, Karawang Barat, Jawa Barat - TA {academicYear}</p>
          </div>
          <div className="w-[100px] flex-shrink-0"></div> {/* Spacer to keep the text perfectly centered */}
        </div>

        {/* Content */}
        <div className="flex flex-col items-center flex-1">
          <div className="px-6 py-2 rounded-full border border-slate-300 bg-slate-50 text-xs font-bold text-slate-600 tracking-widest mb-6 text-center">
            PAPAN IDENTITAS & PRESENSI KBM DIGITAL
          </div>
          
          <h1 className="text-[40px] font-black text-slate-900 uppercase tracking-wider text-center">
            {classData.nama_kelas}
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-2 text-center">
            Tahun Ajaran {academicYear}
          </p>

          <div className="mt-12 p-4 border-[3px] border-slate-200 rounded-3xl bg-white shadow-sm flex items-center justify-center w-72 h-72">
             {qrSvg ? (
               <div
                 className="w-64 h-64 [&>svg]:w-full [&>svg]:h-full [&>svg]:block"
                 dangerouslySetInnerHTML={{ __html: qrSvg }}
               />
             ) : (
               <div className="w-64 h-64 flex items-center justify-center text-slate-400 text-xs font-medium">
                 Menyiapkan QR Code...
               </div>
             )}
          </div>

          <div className="mt-6 px-6 py-2 rounded-xl border border-slate-200 bg-slate-50 text-sm font-bold text-slate-700 font-mono tracking-wider">
             QR-RUANG-{(classData.kode_qr || classData.id).toString().slice(0,8).toUpperCase()}
          </div>

          {/* Instructions */}
          <div className="mt-auto pt-10 w-full">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-sm text-slate-700">
               <h5 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 16v-4"></path><path d="M12 8h.01"></path></svg>
                  Petunjuk Presensi Guru Pengajar:
               </h5>
               <ol className="list-decimal list-inside space-y-2 text-slate-600 font-medium ml-1">
                  <li>Buka aplikasi kamera bawaan ponsel Anda, atau gunakan menu <strong className="text-slate-800">Absensi Mengajar</strong> di dalam aplikasi guru.</li>
                  <li>Arahkan kamera untuk memindai QR Code di atas. Pastikan Anda sudah memberi izin akses lokasi (GPS).</li>
                  <li>Sistem akan otomatis mencocokkan jadwal dan memverifikasi kehadiran mengajar Anda.</li>
               </ol>
            </div>
          </div>

          <div className="w-full flex justify-end mt-12 mb-4"></div>
        </div>
      </div>
    </div>
  );
}
