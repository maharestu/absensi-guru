import React from "react";

export default function GuruLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-100 flex justify-center items-start sm:items-center py-0 sm:py-8">
      {/* Mobile Wrapper */}
      <div className="w-full max-w-md bg-white min-h-screen sm:min-h-[800px] sm:max-h-[850px] relative shadow-2xl sm:rounded-3xl overflow-hidden flex flex-col">
        {children}
      </div>
    </div>
  );
}
