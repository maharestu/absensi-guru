import React from "react";

interface FullScreenLoaderProps {
  message?: string;
  bgClass?: string;
}

export default function FullScreenLoader({
  message,
  bgClass = "bg-[#EEF2F7]",
}: FullScreenLoaderProps) {
  return (
    <div
      role="status"
      aria-label="Memuat halaman"
      className={`w-full min-h-screen min-h-[100dvh] ${bgClass} flex flex-col items-center justify-center animate-page-enter`}
    >
      <div className="w-9 h-9 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      {message && (
        <p className="mt-3 text-xs font-medium text-slate-500 animate-pulse">
          {message}
        </p>
      )}
    </div>
  );
}
