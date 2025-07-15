import { getCurrentUser } from '@aws-amplify/auth';
import { useEffect, useState } from 'react';
import { skipAuth } from '@/env.variables';

export function useAuth() {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        if (skipAuth) {
          setUser({ email: 'admin@ikusi.com' });
          return;
        }
        const current = await getCurrentUser();
        setUser({ email: current.signInDetails?.loginId || '' });
      } catch {
        if (skipAuth) setUser({ email: 'admin@ikusi.com' });
        else setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { user, loading };
}
