import LoginForm from "../components/LoginForm";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto w-full max-w-full px-5 py-12">

        <div className="mb-16">
          <h1 className="text-[22px] font-bold text-slate-900">
            Masuk ke Absensi
          </h1>

          <p className="mt-1 text-[11px] leading-4 text-slate-500">
            Gunakan NIP dan password Anda untuk melakukan absensi.
          </p>
        </div>

        <LoginForm />

      </div>
    </main>
  );
}