import React, { useState, useEffect } from "react";
import { Clock, Calendar } from "lucide-react";

function formatTanggalIndo(date: Date): string {
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatJamIndo(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function ClockBadges() {
  const [timeString, setTimeString] = useState<string>("06:30");
  const [dateString, setDateString] = useState<string>("17 September 2026");

  useEffect(() => {
    const updateRealtime = () => {
      const now = new Date();
      setTimeString(formatJamIndo(now));
      setDateString(formatTanggalIndo(now));
    };

    updateRealtime();
    const interval = setInterval(updateRealtime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-3">
      <div className="bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 shadow-2xs flex items-center gap-2.5">
        <Clock className="w-[18px] h-[18px] text-slate-700 stroke-[2.2px]" />
        <span className="text-sm font-semibold text-slate-700">{timeString}</span>
      </div>
      <div className="bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 shadow-2xs flex items-center gap-2.5">
        <Calendar className="w-[18px] h-[18px] text-slate-700 stroke-[2.2px]" />
        <span className="text-sm font-semibold text-slate-700">{dateString}</span>
      </div>
    </div>
  );
}
