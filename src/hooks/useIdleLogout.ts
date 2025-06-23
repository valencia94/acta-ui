import { signOut } from 'aws-amplify/auth';
import { useIdleTimer } from 'react-idle-timer';

export function useIdleLogout(minutes = 30) {
  useIdleTimer({
    timeout: minutes * 60 * 1000,
    onIdle: () => signOut(),
    debounce: 500,
    events: ['mousemove', 'keydown', 'scroll', 'touchstart'],
  });
}
