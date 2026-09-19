type InputFieldProps = {
  label: string;
  placeholder: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
};

export default function InputField({
  label,
  placeholder,
  type = "text",
  value,
  onChange,
}: InputFieldProps) {
  return (
    <div>
      <label className="mb-2 block text-[10px] font-semibold text-slate-800 md:text-xs">
        {label}
      </label>

      <input
        type={type}
        placeholder={placeholder}
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        className="
          h-13
          w-full
          rounded-[9px]
          border
          border-slate-200
          bg-white
          px-3
          text-[11px]
          outline-none
          focus:border-blue-500
          focus:ring-1
          focus:ring-blue-500
          md:text-sm
        "
      />
    </div>
  );
}