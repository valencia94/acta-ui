import { Button as ButtonMUI } from "@mui/material";
import { ReactNode } from "react";
import { ButtonProps } from "./types";

export const Button = ({ onClick, children, className }: ButtonProps) => (
  <ButtonMUI className={className} variant="contained" onClick={onClick}>
    {children}
  </ButtonMUI>
);
