"use client";

import { useState } from "react";
import InputField from "./InputField";
import { mockUsers } from "../data/mockUsers";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Reset pesan sebelumnya
    setError("");
    setSuccess("");

    // Cari akun yang cocok dengan data dummy
    const user = mockUsers.find(
      (item) =>
        item.username === username.trim() &&
        item.password === password
    );

    // Jika akun tidak ditemukan
    if (!user) {
      setError("Login gagal.");
      return;
    }

    // Jika akun ditemukan
    setSuccess(`Login berhasil! Selamat datang, ${user.nama}.`);
  }

  return (
    <div className="w-full">
      {/* Header Login */}
      <div className="mb-10 md:mb-10">
        <h1 className="text-[22px] font-bold text-slate-900 md:text-2xl">
          Masuk ke Absensi
        </h1>

        <p className="mt-1 text-[11px] leading-4 text-slate-500 md:text-sm md:leading-5">
          {error
            ? "Periksa kembali data yang Anda masukkan."
            : "Gunakan NIP dan password Anda untuk melakukan absensi."}
        </p>
      </div>

      {/* Login Form */}
      <form onSubmit={handleLogin} className="w-full">
        {/* Alert Slot - Ruang tetap untuk pesan */}
        <div className="mb-7 h-[48px]">
          {error && (
            <div
              role="alert"
              className="
                flex
                h-full
                -translate-y-3
                animate-alert-pop
                items-center
                gap-3
                rounded-xl
                border
                border-slate-200
                bg-white
                px-3
                text-[11px]
                text-slate-900
                md:text-sm
              "
            >
              {/* Icon Warning */}
              <span
                className="
                  flex
                  h-6
                  w-6
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  bg-red-500
                  text-xs
                  font-bold
                  text-white
                "
              >
                !
              </span>

              <p>{error}</p>
            </div>
          )}
        </div>

        {/* Pesan Login Berhasil untuk Testing */}
        {success && (
          <div
            role="status"
            className="mb-6 rounded-[9px] border border-green-200 bg-green-50 px-3 py-3 text-[11px] text-green-700 md:text-sm"
          >
            {success}
          </div>
        )}

        {/* Input Fields */}
        <div className="space-y-5 md:space-y-6 -translate-y-6">
          <InputField
            label="NIP / Username"
            placeholder="Masukkan NIP / Username"
            value={username}
            onChange={(value) => {
              setUsername(value);
              setError("");
              setSuccess("");
            }}
          />

          <InputField
            label="Password"
            placeholder="Masukkan Password"
            type="password"
            value={password}
            onChange={(value) => {
              setPassword(value);
              setError("");
              setSuccess("");
            }}
          />
        </div>

        {/* Login Button */}
        <button
          type="submit"
          className="
            mt-10
            h-10
            w-full
            -translate-y-3
            rounded-[9px]
            bg-blue-600
            text-[11px]
            font-medium
            text-white
            transition
            hover:bg-blue-700
            active:scale-[0.99]

            md:mt-8
            md:h-11
            md:text-sm
          "
        >
          Masuk
        </button>
      </form>
    </div>
  );
}