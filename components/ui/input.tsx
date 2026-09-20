import * as React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", type = "text", hasError, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={`
          flex h-12 w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900
          placeholder:text-slate-400 placeholder:text-sm
          outline-none transition duration-150 ease-in-out
          ${
            hasError
              ? "border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20"
              : "border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20"
          }
          disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-60
          ${className}
        `}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

export default Input;
