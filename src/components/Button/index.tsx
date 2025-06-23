import { Button as ButtonMUI } from "@mui/material";

import { ButtonProps } from "./types";

export const Button = ({ onClick, children, className }: ButtonProps) => (
  <ButtonMUI className={className} variant="contained" onClick={onClick}>
    {children}
  </ButtonMUI>
);
