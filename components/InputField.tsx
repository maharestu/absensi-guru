type InputFieldProps = {
  label: string;
  placeholder: string;
  type?: string;
};

export default function InputField({
  label,
  placeholder,
  type = "text",
}: InputFieldProps) {
  return (
    <div>
      <label className="block mb-2 text-[10px] font-semibold text-slate-800">
        {label}
      </label>

      <input
        type={type}
        placeholder={placeholder}
        className="
          w-full
          h-10
          rounded-[9px]
          border border-slate-200
          bg-white
          px-3
          text-[11px]
          outline-none
          focus:border-blue-500
          focus:ring-1
          focus:ring-blue-500
        "
      />
    </div>
  );
}