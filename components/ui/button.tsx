import * as React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline";
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      fullWidth = true,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 active:scale-[0.99] select-none cursor-pointer";

    const variantStyles = {
      primary:
        "bg-blue-600 text-white hover:bg-blue-700 shadow-sm focus-visible:ring-blue-600 active:bg-blue-800",
      secondary:
        "bg-slate-100 text-slate-800 hover:bg-slate-200 focus-visible:ring-slate-400",
      outline:
        "border border-slate-200 bg-white text-slate-800 hover:bg-slate-50 focus-visible:ring-slate-300",
    };

    const sizeStyles = "h-12 px-5 py-3 rounded-xl text-base";
    const widthStyles = fullWidth ? "w-full" : "";

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles} ${widthStyles} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
