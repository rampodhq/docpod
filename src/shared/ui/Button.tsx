"use client";

import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";
import clsx from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", ...props }, ref) => {
    const base =
      "px-4 py-2 rounded-md text-sm font-medium transition-colors";

    const variants = {
      primary: "bg-black text-white hover:bg-gray-800",
      secondary: "bg-gray-100 text-black hover:bg-gray-200",
      danger: "bg-red-600 text-white hover:bg-red-700",
    };

    return (
      <button
        ref={ref}
        className={clsx(base, variants[variant], className)}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
