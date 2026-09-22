import LoginForm from "@/components/auth/login-form";

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#EEF2F7] flex flex-col justify-start sm:justify-center px-6 pt-14 sm:pt-8 pb-8">
      <div className="w-full max-w-sm sm:max-w-md mx-auto sm:bg-white sm:p-10 sm:rounded-[32px] sm:shadow-sm sm:border sm:border-slate-200">
        <LoginForm />
      </div>
    </main>
  );
}
