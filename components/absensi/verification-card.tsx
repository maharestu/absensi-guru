import React from "react";

interface VerificationRowProps {
  label: string;
  value: string;
  /** Apakah baris ini baris terakhir (tidak tampilkan divider bawah) */
  isLast?: boolean;
}

/**
 * Baris data tunggal di dalam kartu verifikasi.
 * Menampilkan label kecil abu + value bold di bawahnya,
 * dengan garis pemisah di antara baris (kecuali baris terakhir).
 */
function VerificationRow({ label, value, isLast = false }: VerificationRowProps) {
  return (
    <div className={`py-4 ${!isLast ? "border-b border-slate-100" : ""}`}>
      <p className="text-xs font-medium text-slate-400 mb-1">{label}</p>
      <p className="text-base font-bold text-slate-900">{value}</p>
    </div>
  );
}

interface VerificationCardProps {
  rows: Array<{ label: string; value: string }>;
}

/**
 * Kartu verifikasi reusable:
 * - White card rounded dengan shadow ringan
 * - Berisi baris-baris data (label + value) yang dipisah oleh divider
 * - Gunakan prop `rows` untuk mengisi data secara dinamis
 */
export default function VerificationCard({ rows }: VerificationCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5">
      {rows.map((row, index) => (
        <VerificationRow
          key={row.label}
          label={row.label}
          value={row.value}
          isLast={index === rows.length - 1}
        />
      ))}
    </div>
  );
}
