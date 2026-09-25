import React from "react";

/**
 * LAYOUT UTAMA AREA GURU (MOBILE CONTAINER)
 * 
 * Membungkus seluruh tampilan fitur guru dalam kontainer mobile-first
 * yang bersih, terpusat, dan responsif.
 */
export default function GuruLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white flex justify-center items-center py-0 sm:py-6 px-0 sm:px-4">
      {/* Mobile Wrapper Container */}
      <div className="w-full max-w-md bg-[#EEF2F7] min-h-screen sm:min-h-[844px] sm:max-h-[92vh] relative shadow-2xl sm:rounded-[36px] overflow-y-auto overflow-x-hidden flex flex-col">
        {children}
      </div>
    </div>
  );
}
