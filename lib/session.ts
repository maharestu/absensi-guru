import { cookies } from "next/headers";
import { RoleAkun } from "@/types/schema";

export const SESSION_COOKIE_NAME = "auth_session";
export const SESSION_DURATION_MS = 30 * 60 * 1000; // 30 menit

export interface SessionPayload {
  id: string; // ID akun
  username: string;
  nama: string;
  role: RoleAkun;
  guru_id?: string | null;
  nip?: string | null;
  expiresAt: number; // Unix timestamp in ms
}

function getSecretKeyRaw(): string {
  const secret = process.env.SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) {
    throw new Error(
      "SESSION_SECRET atau SUPABASE_SERVICE_ROLE_KEY harus disetel dalam environment variable!"
    );
  }
  return secret;
}

/**
 * Mendapatkan CryptoKey untuk HMAC-SHA256 (Web Crypto API kompatibel dengan Node & Edge)
 */
async function getCryptoKey(): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(getSecretKeyRaw()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function base64UrlEncode(data: Uint8Array): string {
  let str = "";
  for (let i = 0; i < data.length; i++) {
    str += String.fromCharCode(data[i]);
  }
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(str: string): Uint8Array {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) {
    str += "=";
  }
  const binary = atob(str);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Menandatangani payload menjadi signed token
 */
export async function signSessionToken(payload: SessionPayload): Promise<string> {
  const encoder = new TextEncoder();
  const payloadString = JSON.stringify(payload);
  const payloadBase64 = base64UrlEncode(encoder.encode(payloadString));

  const key = await getCryptoKey();
  const signatureBuffer = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payloadBase64)
  );
  const signatureBase64 = base64UrlEncode(new Uint8Array(signatureBuffer));

  return `${payloadBase64}.${signatureBase64}`;
}

/**
 * Memverifikasi signed token dan mengembalikan payload jika valid
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  if (!token || !token.includes(".")) return null;

  try {
    const [payloadBase64, signatureBase64] = token.split(".");
    if (!payloadBase64 || !signatureBase64) return null;

    const encoder = new TextEncoder();
    const key = await getCryptoKey();
    const signatureBytes = base64UrlDecode(signatureBase64);

    const isValid = await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes as unknown as BufferSource,
      encoder.encode(payloadBase64)
    );

    if (!isValid) return null;

    const decodedPayloadBytes = base64UrlDecode(payloadBase64);
    const decoder = new TextDecoder();
    const payload: SessionPayload = JSON.parse(decoder.decode(decodedPayloadBytes));

    // Cek kadaluarsa (1 hari)
    if (Date.now() > payload.expiresAt) {
      return null;
    }

    return payload;
  } catch (err) {
    console.error("Gagal memverifikasi token sesi:", err);
    return null;
  }
}

/**
 * Membuat sesi dan menyetel cookie HttpOnly (Dipanggil dari Server Action)
 */
export async function createSession(userData: {
  id: string;
  username: string;
  nama: string;
  role: RoleAkun;
  guru_id?: string | null;
  nip?: string | null;
}): Promise<SessionPayload> {
  const expiresAt = Date.now() + SESSION_DURATION_MS;
  const payload: SessionPayload = {
    id: userData.id,
    username: userData.username,
    nama: userData.nama,
    role: userData.role,
    guru_id: userData.guru_id ?? null,
    nip: userData.nip ?? null,
    expiresAt,
  };

  const token = await signSessionToken(payload);
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(expiresAt),
  });

  return payload;
}

/**
 * Mengambil sesi saat ini dari cookie (Dipanggil dari Server Action / Server Component)
 */
export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

/**
 * Menghapus sesi saat logout (Dipanggil dari Server Action)
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Guard Helper: Memastikan pengguna terautentikasi dan memiliki role tertentu
 */
export async function requireAuth(allowedRoles?: RoleAkun[]): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    throw new Error("Sesi Anda telah berakhir. Silakan login kembali.");
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
    throw new Error("Akses ditolak: Anda tidak memiliki izin untuk tindakan ini.");
  }

  return session;
}

/**
 * Guard Helper khusus untuk aksi Admin
 */
export async function requireAdmin(): Promise<SessionPayload> {
  return requireAuth(["admin"]);
}
