import { getCurrentUser } from '@/api-amplify';
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
        if (current && current.email) {
          setUser({ email: current.email });
        } else {
          setUser(null);
        }
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
