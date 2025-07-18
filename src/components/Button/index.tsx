// src/components/Button/index.tsx
import { Button as MUIButton } from "@mui/material";

import { ButtonProps } from "./types";

export function Button({
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
    >
      {children}
    </MUIButton>
  );
}

export default Button;
