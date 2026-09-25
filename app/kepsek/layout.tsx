"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import KepsekSidebar from "@/components/kepsek/KepsekSidebar";

export default function KepsekLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else if (user?.role === "GURU") {
        router.push("/guru");
      } else if (user?.role === "ADMIN") {
        router.push("/admin");
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading || !isAuthenticated || user?.role === "GURU" || user?.role === "ADMIN") {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex">
      {/* Sidebar Navigation */}
      <KepsekSidebar />

      {/* Main Content Area */}
      <main className="flex-1 px-5 py-6 md:px-8 md:py-8 overflow-y-auto min-h-screen">
        <div className="w-full">{children}</div>
      </main>
    </div>
  );
}
