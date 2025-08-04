// src/components/App/index.tsx
import { CssBaseline } from '@mui/material';
import { useCallback, useState } from 'react';

import { AppContainer } from '@/components/App/styles';
import Button from '@/components/Button';
import { Counter } from '@/components/Counter';
import { LoadingMessage } from '@/components/LoadingMessage';
import { counterDefaultValue } from '@/env.variables';

export function App() {
  const [counterValue, setCounterValue] = useState<number>(counterDefaultValue);
  const [loading, setLoading] = useState(false);

  const handleOnClick = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setCounterValue((v) => v + 1);
      setLoading(false);
    }, 500);
  }, []);

  return (
    <AppContainer id="app">
      <CssBaseline />

      {loading ? (
        <LoadingMessage message="Updating counter…" />
      ) : (
        <>
          <Counter value={counterValue} />
          <Button onClick={handleOnClick} className="mt-4">
            Increment
          </Button>
        </>
      )}
    </AppContainer>
  );
}
