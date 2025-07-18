// src/components/Button/types.ts
import { ReactNode } from "react";

/** Props for our wrapper around MUI's Button */
export interface ButtonProps {
  /** Click handler */
  onClick: () => void;
  /** Button contents (icon + label) */
  children: ReactNode;
  /** Tailwind or custom classes */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
  /** Button color */
  color?:
    | "primary"
    | "secondary"
    | "error"
    | "info"
    | "success"
    | "warning"
    | "inherit";
  /** Button variant */
  variant?: "text" | "outlined" | "contained";
  /** Button type */
  type?: "button" | "submit" | "reset";
}
