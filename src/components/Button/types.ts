// src/components/Button/types.ts
import { ReactNode } from "react";

export interface ButtonProps {
  onClick?: () => void;
  /** Tailwind / MUI classes forwarded from callers */
  className?: string;
  /** Inner JSX that the button will render */
  children?: ReactNode;
}
