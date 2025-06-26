// src/components/Button.tsx 
import { Button as MUIButton } from '@mui/material';
import { ReactNode, ButtonHTMLAttributes } from 'react';

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

export default function Button({
  onClick,
  children,
  className,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <MUIButton
      onClick={onClick}
      className={className}
      disabled={disabled}
      variant="contained"
      {...rest}
    >
      {children}
    </MUIButton>
  );
}
