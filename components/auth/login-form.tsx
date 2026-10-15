"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { loginAction } from "@/actions/auth";
import { Akun } from "@/types/schema";

export default function LoginForm() {
  const [nip, setNip] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setHasError(false);

    try {
      // Query ke Supabase via Server Action (dan otomatis set HttpOnly Session Cookie)
      const result = await loginAction(nip, password);

      if (result.success) {
        login(result.user as Akun);
        
        const nextParam = searchParams.get("next");
        if (nextParam && nextParam.startsWith("/")) {
          router.push(nextParam);
          return;
        }

        // Arahkan sesuai role (lowercase sesuai DB schema)
        if (result.user.role === "guru") {
          router.push("/guru");
        } else if (result.user.role === "kepala_sekolah") {
          router.push("/kepsek");
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
            Username / NIP/NUPTK
          </label>
          <input
            id="nip"
            name="nip"
            type="text"
            placeholder="Masukkan username atau NIP/NUPTK"
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
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Masukkan Password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (hasError) setHasError(false);
              }}
              required
              autoComplete="current-password"
              className={`w-full pl-4 pr-11 py-3.5 rounded-xl border bg-white text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all
                ${hasError ? "border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100" : "border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"}
              `}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:text-slate-600 transition-colors p-1"
              aria-label={showPassword ? "Sembunyikan password" : "Lihat password"}
              tabIndex={-1}
            >
              {showPassword ? (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <line x1="1" y1="1" x2="23" y2="23" />
                </svg>
              ) : (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          </div>
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
