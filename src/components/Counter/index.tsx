// src/components/Counter/index.tsx
import { Typography } from '@mui/material';

import { CounterProps } from './types';

export function Counter({
  value,
  id = 'counter',
  className = '',
}: CounterProps) {
  return (
    <Typography
      variant="h3"
      id={id}
      className={className}
      color="textPrimary" // uses your theme’s primary text color
    >
      Counter: {value}
    </Typography>
  );
}
