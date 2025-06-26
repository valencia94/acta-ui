// src/components/Button/types.ts
import { ReactNode, ButtonHTMLAttributes } from 'react';

/** Props for our wrapper around MUI’s Button */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Click handler */
  onClick: () => void;
  /** Button contents (icon + label) */
  children: ReactNode;
  /** Tailwind or custom classes */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
}
