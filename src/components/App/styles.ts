// src/components/App/styles.ts
import { Box, styled } from '@mui/material';

export const AppContainer = styled(Box)(({ theme }) => ({
  userSelect: 'none',
  padding: theme.spacing(4),
  maxWidth: 600,
  margin: '0 auto',
  backgroundColor: theme.palette.background.default,
}));
