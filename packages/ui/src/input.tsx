"use client";

import React from "react";

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  type?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export const Input = ({
  type = "text",
  placeholder,
  value,
  onChange,
  className = "",
  ...props
}: InputProps) => {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full bg-black text-white placeholder-neutral-500 border border-neutral-800 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 ${className}`}
      {...props}
    />
  );
};
