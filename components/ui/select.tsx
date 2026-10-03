import * as React from "react";

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = "", hasError, children, ...props }, ref) => {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={`
            flex h-12 w-full appearance-none rounded-xl border bg-white px-4 py-3 pr-10 text-sm text-slate-900
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
        >
          {children}
        </select>
        {/* Dropdown Icon */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
          <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>
    );
  }
);

Select.displayName = "Select";

export default Select;
