import * as React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = "",
      variant = "primary",
      size = "default",
      fullWidth = true,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-60 active:scale-[0.98] select-none cursor-pointer";

    const variantStyles = {
      primary:
        "bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200 focus-visible:ring-blue-600 active:bg-blue-800",
      secondary:
        "bg-slate-100 text-slate-800 hover:bg-slate-200 focus-visible:ring-slate-400",
      outline:
        "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus-visible:ring-slate-300",
      danger:
        "bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-200 focus-visible:ring-red-600",
      ghost:
        "hover:bg-slate-100 text-slate-700 focus-visible:ring-slate-300",
    };

    const sizeStyles = {
      default: "h-[54px] px-5 py-3 rounded-2xl text-base",
      sm: "h-10 px-4 py-2 rounded-xl text-sm",
      lg: "h-14 px-6 py-4 rounded-2xl text-lg",
      icon: "h-10 w-10 rounded-xl p-0",
    };

    const hasExplicitWidth = /\bw-(auto|full|\d+|\[[^\]]+\])/.test(className) || className.includes("w-");
    const widthStyles = fullWidth && !hasExplicitWidth ? "w-full" : "";

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={`${baseStyles} ${variantStyles[variant] ?? ""} ${sizeStyles[size] ?? ""} ${widthStyles} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;

