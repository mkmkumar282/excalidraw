"use client";

import React, { ReactNode } from "react";

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  children: ReactNode;
  className?: string;
}

export const Label = ({ children, className = "", ...props }: LabelProps) => {
  return (
    <label
      className={`block text-xs font-semibold text-neutral-400 mb-1.5 uppercase tracking-wider select-none ${className}`}
      {...props}
    >
      {children}
    </label>
  );
};
