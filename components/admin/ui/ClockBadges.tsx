import React from "react";
import { Clock, Calendar } from "lucide-react";
import { useRealtimeClock } from "@/hooks/use-realtime-clock";

export function ClockBadges() {
  const { timeString, dateString } = useRealtimeClock();

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
