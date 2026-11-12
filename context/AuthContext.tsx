"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Akun } from "@/types/schema";
import { logoutAction, getCurrentUserAction } from "@/actions/auth";

interface AuthContextType {
  user: Akun | null;
  isAuthenticated: boolean;
  login: (userData: Omit<Akun, "password_hash">) => void;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "auth_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Akun | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // Sinkronisasikan sesi dengan server cookie saat komponen dimuat
  useEffect(() => {
    let isMounted = true;

    // Baca cached user dari localStorage secepatnya di client untuk mencegah flash spinner
    try {
      const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
      if (storedUser && isMounted) {
        const parsed = JSON.parse(storedUser);
        if (parsed && parsed.role) {
          setUser(parsed);
          setIsLoading(false);
        }
      }
    } catch {
      // Abaikan jika localStorage tidak dapat diakses
    }

    async function syncSession() {
      try {
        const serverUser = await getCurrentUserAction();
        if (isMounted) {
          if (serverUser) {
            setUser(serverUser as Akun);
            localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(serverUser));
          } else {
            setUser(null);
            localStorage.removeItem(AUTH_STORAGE_KEY);
          }
        }
      } catch (error) {
        console.error("Gagal sinkronisasi sesi dari server:", error);
        // Fallback aman dari localStorage jika terjadi kendala jaringan sesaat
        const storedUser = localStorage.getItem(AUTH_STORAGE_KEY);
        if (storedUser && isMounted) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {
            localStorage.removeItem(AUTH_STORAGE_KEY);
            setUser(null);
          }
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    syncSession();
    return () => {
      isMounted = false;
    };
  }, []);

  // Dipanggil setelah loginAction berhasil
  const login = (userData: Omit<Akun, "password_hash">) => {
    setUser(userData as Akun);
    setIsLoading(false);
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(userData));
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
    // Bersihkan semua cache absensi di sessionStorage agar tidak bocor ke user berikutnya
    sessionStorage.clear();
    try {
      await logoutAction();
    } catch (e) {
      console.error("Gagal menjalankan logout server:", e);
    }
    router.push("/login");
  };

  const value = {
    user,
    isAuthenticated: !!user,
    login,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth harus digunakan di dalam AuthProvider");
  }
  return context;
}
