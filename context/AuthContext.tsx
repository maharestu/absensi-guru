"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Akun } from "@/types/schema";

interface AuthContextType {
  user: Akun | null;
  isAuthenticated: boolean;
  login: (userData: Akun) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Akun | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Pada implementasi nyata, di sini akan mengecek token / session ke server
    // Untuk saat ini kita gunakan localStorage simulasi
    const storedUser = localStorage.getItem("auth_user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error("Gagal memuat sesi user:", error);
      }
    }
    setIsLoading(false);
  }, []);

  const login = (userData: Akun) => {
    setUser(userData);
    localStorage.setItem("auth_user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("auth_user");
    // TODO: Arahkan kembali ke halaman login (e.g. window.location.href = '/')
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
