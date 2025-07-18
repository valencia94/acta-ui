// src/components/LoadingMessage/index.tsx
import { Typography } from "@mui/material";
import clsx from "clsx";

export interface LoadingMessageProps {
  /** The message to display while loading */
  message?: string;
  /** Optional CSS classes (tailwind or MUI) */
  className?: string;
}

export function LoadingMessage({
  message = "Loading…",
  className = "",
}: LoadingMessageProps) {
  return (
    <Typography
      variant="body1"
      className={clsx("italic text-secondary", className)}
      id="loading-message"
    >
      {message}
    </Typography>
  );
}
