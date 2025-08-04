import { fetchAuthSession } from 'aws-amplify/auth';
import { useEffect, useState } from 'react';

import { skipAuth } from '@/env.variables';
import { getCurrentUser } from '@/lib/api-amplify';

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

        const session = await fetchAuthSession();
        const current = await getCurrentUser();
        const email = String(current?.email || session.tokens?.idToken?.payload?.email || '');
        setUser({ email });
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
