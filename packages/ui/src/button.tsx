"use client";

import React, { ReactNode } from "react";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "primary" | "secondary";
  loading?: boolean;
  className?: string;
}

export const Button = ({
  children,
  variant = "primary",
  loading = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) => {
  const baseStyles = "inline-flex items-center justify-center font-semibold tracking-wide transition-all duration-150 ease-out focus:outline-none disabled:cursor-not-allowed rounded-xl text-sm px-5 py-2.5 shadow-sm";
  
  const variants = {
    primary: "bg-white text-black hover:bg-neutral-100 active:scale-[0.98] disabled:bg-neutral-900 disabled:text-neutral-500 disabled:border disabled:border-neutral-800 disabled:active:scale-100",
    secondary: "bg-[#0f0f0f] text-neutral-200 hover:text-white hover:bg-neutral-900 border border-neutral-800 hover:border-neutral-700 active:scale-[0.98] disabled:bg-[#090909] disabled:text-neutral-600 disabled:border-neutral-900/80 disabled:active:scale-100",
  };

  return (
    <button
      disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          {}
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
};
