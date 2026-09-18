import InputField from "./InputField";

export default function LoginForm() {
  return (
    <form className="w-full">
      <div className="space-y-5">
        <InputField
          label="NIP / Username"
          placeholder="Masukkan NIP / Username"
        />

        <InputField
          label="Password"
          placeholder="Masukkan Password"
          type="password"
        />
      </div>

      <button
        type="submit"
        className="
          mt-10
          h-10
          w-full
          rounded-[9px]
          bg-blue-600
          text-[11px]
          font-medium
          text-white
          transition
          hover:bg-blue-700
          active:scale-[0.99]
        "
      >
        Masuk
      </button>
    </form>
  );
}