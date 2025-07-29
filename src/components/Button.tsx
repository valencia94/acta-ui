// src/components/Button.tsx
import { Button as MUIButton } from "@mui/material";
import { ReactNode } from "react";

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

export default function Button({
  onClick,
  children,
  className,
  disabled,
  color = "primary",
  variant = "contained",
  type = "button",
}: ButtonProps) {
  return (
    <MUIButton
      onClick={onClick}
      className={className}
      disabled={disabled}
      variant={variant}
      color={color}
      type={type}
      sx={{
        textTransform: "none", // Prevent uppercase transformation
        borderRadius: "8px", // Rounded corners
        padding: "8px 16px", // Better padding
        fontSize: "14px", // Good font size
        fontWeight: 500, // Medium weight
        boxShadow:
          variant === "contained" ? "0 2px 4px rgba(0,0,0,0.1)" : "none",
        "&:hover": {
          boxShadow:
            variant === "contained" ? "0 4px 8px rgba(0,0,0,0.15)" : "none",
        },
        "&:disabled": {
          opacity: 0.6,
        },
      }}
    >
      {children}
    </MUIButton>
  );
}
