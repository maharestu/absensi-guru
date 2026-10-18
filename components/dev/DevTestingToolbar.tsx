"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getDevTestingConfigClient,
  setDevTestingConfigClient,
  DevTestingConfig,
} from "@/lib/testing-mode";
import { resetPresensiGuruHariIniAction } from "@/actions/testing";

export default function DevTestingToolbar() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<DevTestingConfig>({
    isActive: false,
    simDay: "senin",
    bypassGps: true,
    bypassTime: true,
    bypassPrereq: true,
  });
  const [isResetting, setIsResetting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setConfig(getDevTestingConfigClient());
  }, []);

  const handleToggleActive = (val: boolean) => {
    const updated = { ...config, isActive: val };
    setConfig(updated);
    setDevTestingConfigClient(updated);
    router.refresh();
  };

  const handleChangeField = (field: keyof DevTestingConfig, value: any) => {
    const updated = { ...config, [field]: value };
    setConfig(updated);
    setDevTestingConfigClient(updated);
  };

  const handleApplyAndReload = () => {
    setDevTestingConfigClient(config);
    setIsOpen(false);
    window.location.reload();
  };

  const handleResetPresensiHariIni = async () => {
    if (!confirm("Reset semua catatan absensi kehadiran & mengajar Anda untuk hari ini agar bisa tes ulang dari nol?")) {
      return;
    }

    setIsResetting(true);
    setMessage(null);
    try {
      // Bersihkan sessionStorage di browser
      sessionStorage.removeItem("absensi_completed");
      sessionStorage.removeItem("absensi_status");
      sessionStorage.removeItem("absensi_time");
      sessionStorage.removeItem("absensi_date");
      sessionStorage.removeItem("absensi_guru_id");
      sessionStorage.removeItem("absensi_captured_photo");
      sessionStorage.removeItem("absensi_photo_status");
      sessionStorage.removeItem("absensi_lat");
      sessionStorage.removeItem("absensi_lng");

      const res = await resetPresensiGuruHariIniAction();
      if (res.success) {
        setMessage("Berhasil direset! Memuat ulang...");
        setTimeout(() => {
          window.location.reload();
        }, 800);
      } else {
        setMessage("Gagal reset: " + res.error);
      }
    } catch (err: any) {
      setMessage("Error: " + err.message);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9999] font-sans">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-full shadow-lg border text-xs font-bold transition-all transform active:scale-95 cursor-pointer backdrop-blur-md ${
            config.isActive
              ? "bg-amber-500 text-white border-amber-600 shadow-amber-500/30 ring-2 ring-amber-400"
              : "bg-slate-900/90 hover:bg-slate-900 text-white border-slate-700/80 shadow-slate-900/40"
          }`}
          title="Buka Panel Mode Pengujian"
        >
          <span className="text-sm">🛠️</span>
          <span>{config.isActive ? `Mode Testing (${config.simDay.toUpperCase()})` : "Mode Testing"}</span>
          <span
            className={`w-2 h-2 rounded-full ${
              config.isActive ? "bg-emerald-300 animate-pulse" : "bg-slate-400"
            }`}
          />
        </button>
      )}

      {/* Expanded Modal / Card */}
      {isOpen && (
        <div className="w-[340px] bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-2xl p-4 text-slate-800 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-base">🛠️</span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Panel Mode Testing
              </h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-1 text-sm rounded-lg hover:bg-slate-100 transition-colors"
            >
              ✕
            </button>
          </div>

          <div className="py-3 space-y-3 text-xs">
            {/* Toggle Utama */}
            <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
              <div>
                <span className="font-bold text-slate-900 block">Status Pengujian</span>
                <span className="text-[10px] text-slate-500">
                  {config.isActive ? "Mode Testing Aktif" : "Mode Normal (Waktu Asli)"}
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.isActive}
                  onChange={(e) => handleToggleActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {config.isActive && (
              <div className="space-y-2.5 pt-1">
                {/* Simulasi Hari */}
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-600 block">
                    Simulasi Hari Mengajar:
                  </label>
                  <select
                    value={config.simDay}
                    onChange={(e) => handleChangeField("simDay", e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="senin">Senin</option>
                    <option value="selasa">Selasa</option>
                    <option value="rabu">Rabu</option>
                    <option value="kamis">Kamis</option>
                    <option value="jumat">Jumat</option>
                  </select>
                </div>

                {/* Checkbox Options */}
                <div className="space-y-2 bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/50">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={config.bypassTime}
                      onChange={(e) => handleChangeField("bypassTime", e.target.checked)}
                      className="rounded text-blue-600 w-3.5 h-3.5"
                    />
                    <span className="text-[11px] text-slate-700">
                      Bypass Batas Jam Mengajar
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={config.bypassGps}
                      onChange={(e) => handleChangeField("bypassGps", e.target.checked)}
                      className="rounded text-blue-600 w-3.5 h-3.5"
                    />
                    <span className="text-[11px] text-slate-700">
                      Bypass Validasi Lokasi (GPS)
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={config.bypassPrereq}
                      onChange={(e) => handleChangeField("bypassPrereq", e.target.checked)}
                      className="rounded text-blue-600 w-3.5 h-3.5"
                    />
                    <span className="text-[11px] text-slate-700">
                      Bypass Syarat Absen Kehadiran
                    </span>
                  </label>
                </div>

                {/* Reset Presensi Hari Ini */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleResetPresensiHariIni}
                    disabled={isResetting}
                    className="w-full py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <span>🗑️</span>
                    <span>{isResetting ? "Mereset Data..." : "Reset Absensi Saya Hari Ini"}</span>
                  </button>
                </div>

                {message && (
                  <p className="text-[11px] text-center font-medium text-blue-600 bg-blue-50 py-1 rounded-lg">
                    {message}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 flex gap-2">
            <button
              onClick={handleApplyAndReload}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Terapkan & Reload
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
