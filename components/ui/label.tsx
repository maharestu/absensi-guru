import * as React from "react";

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className = "", children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={`block text-sm font-semibold text-slate-800 tracking-tight ${className}`}
        {...props}
      >
        {children}
      </label>
    );
  }
);

Label.displayName = "Label";

export default Label;
