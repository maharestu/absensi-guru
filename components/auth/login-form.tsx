"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { MOCK_USERS } from "@/lib/mock-data";

export default function LoginForm() {
  const [nip, setNip] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setHasError(false);

    try {
      // Simulasi delay jaringan
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Cari user di data mock
      const user = MOCK_USERS.find(
        (u) => u.username === nip && u.password_hash === password
      );

      if (user) {
        login(user);
        // Arahkan sesuai Role
        if (user.role === "GURU") {
          router.push("/guru");
        } else {
          router.push("/admin");
        }
      } else {
        setHasError(true);
      }
    } catch {
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header - Rata tengah sesuai Figma */}
      <header className="mb-8 text-center">
        <h1 className="text-[28px] font-bold tracking-tight text-slate-900">
          Selamat Datang
        </h1>
        <p className="mt-2 text-sm text-slate-500 leading-relaxed max-w-xs sm:max-w-sm mx-auto">
          {hasError
            ? "Periksa kembali data yang Anda masukkan."
            : "Gunakan username dan password untuk mengakses dashboard sekolah."}
        </p>
      </header>

      <form onSubmit={handleSubmit} className="w-full space-y-5">
        {/* Error Alert */}
        {hasError && (
          <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex-shrink-0 w-9 h-9 rounded-full bg-red-500 flex items-center justify-center">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 8V12M12 16H12.01"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <span className="text-sm font-semibold text-slate-800">
              Login gagal.
            </span>
          </div>
        )}

        {/* Username */}
        <div className="space-y-2">
          <label
            htmlFor="nip"
            className="block text-sm font-semibold text-slate-800"
          >
            Username
          </label>
          <input
            id="nip"
            name="nip"
            type="text"
            placeholder="Masukkan username"
            value={nip}
            onChange={(e) => {
              setNip(e.target.value);
              if (hasError) setHasError(false);
            }}
            required
            autoComplete="username"
            className={`w-full px-4 py-3.5 rounded-xl border bg-white text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all
              ${hasError ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100" : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"}
            `}
          />
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label
            htmlFor="password"
            className="block text-sm font-semibold text-slate-800"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Masukkan Password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (hasError) setHasError(false);
            }}
            required
            autoComplete="current-password"
            className={`w-full px-4 py-3.5 rounded-xl border bg-white text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all
              ${hasError ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100" : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"}
            `}
          />
        </div>

        {/* Tombol Masuk */}
        <div className="pt-3">
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold text-sm transition-all duration-150 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
          >
            {isLoading ? "Memproses..." : "Masuk"}
          </button>
        </div>
      </form>
    </div>
  );
}
