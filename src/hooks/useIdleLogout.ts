import { signOut } from 'aws-amplify/auth';
import { useIdleTimer } from 'react-idle-timer';

import { skipAuth } from '@/env.variables';

export function useIdleLogout(minutes = 30): void {
  const handleIdle = async () => {
    try {
      // Clear local storage
      localStorage.clear();

      // Sign out from AWS if not in skip auth mode
      if (!skipAuth) {
        await signOut({ global: true });
      }

      // Force page refresh to login
      window.location.replace('/login');
    } catch (error) {
      console.error('Idle logout error:', error);
      // Even if signOut fails, force navigation
      localStorage.clear();
      window.location.replace('/login');
    }
  };

  useIdleTimer({
    timeout: minutes * 60 * 1000,
    onIdle: () => void handleIdle(),
    debounce: 500,
    events: ['mousemove', 'keydown', 'scroll', 'touchstart'],
  });
}
