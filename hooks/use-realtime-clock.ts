"use client";

import { useState, useEffect } from "react";
import { formatJamIndo, formatTanggalIndo } from "@/lib/format";

/**
 * Custom hook untuk menampilkan jam dan tanggal real-time.
 * Update setiap detik. Menggantikan pola useState + useEffect + setInterval
 * yang sebelumnya diduplikat di beberapa komponen.
 *
 * @returns { timeString, dateString, now }
 */
export function useRealtimeClock() {
  const [now, setNow] = useState<Date | null>(null);
  const [timeString, setTimeString] = useState<string>("06:30");
  const [dateString, setDateString] = useState<string>("17 September 2026");

  useEffect(() => {
    const updateRealtime = () => {
      const currentDate = new Date();
      setNow(currentDate);
      setTimeString(formatJamIndo(currentDate));
      setDateString(formatTanggalIndo(currentDate));
    };

    updateRealtime();
    const interval = setInterval(updateRealtime, 1000);
    return () => clearInterval(interval);
  }, []);

  return { timeString, dateString, now };
}
