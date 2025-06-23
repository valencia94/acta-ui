import { useIdleTimer } from 'react-idle-timer';
import { signOut } from 'aws-amplify/auth';

export function useIdleLogout(minutes = 30) {
  useIdleTimer({
    timeout: minutes * 60 * 1000,
    onIdle: () => signOut(),
    debounce: 500,
    events: ['mousemove', 'keydown', 'scroll', 'touchstart'],
  });
}
