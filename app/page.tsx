import LoginForm from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#EEF2F7] flex flex-col justify-start px-6 pt-14 pb-8">
      <div className="w-full max-w-sm mx-auto">
        <LoginForm />
      </div>
    </main>
  );
}