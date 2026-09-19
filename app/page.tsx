import LoginForm from "../components/LoginForm";

export default function LoginPage() {
  return (
    <main
      className="
        min-h-screen
        bg-[#F4F8FD]
        md:flex
        md:items-center
        md:justify-center
        md:px-6
        md:py-10
      "
    >
      <div
        className="
          mx-auto
          w-full
          max-w-full
          px-5
          py-12

          md:mx-0
          md:max-w-[440px]
          md:rounded-2xl
          md:border
          md:border-slate-100
          md:bg-white
          md:px-10
          md:py-10
          md:shadow-sm
        "
      >
        <LoginForm />
      </div>
    </main>
  );
}