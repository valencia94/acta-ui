import { getCurrentUser } from '@aws-amplify/auth';
import { useEffect, useState } from 'react';
import { skipAuth } from '@/env.variables';

/** React hook – returns Cognito user (or mock admin in skip-auth mode) */
export function useAuth() {
  const [user, setUser]   = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        if (skipAuth) {
          // Local dev / e2e tests
          setUser({ email: 'admin@ikusi.com' });
          return;
        }

        const cognitoUser = await getCurrentUser();
        setUser({ email: cognitoUser?.signInDetails?.loginId ?? '' });
      } catch {
        // If Cognito call fails we remain unsigned-in unless skipAuth is true
        if (skipAuth) setUser({ email: 'admin@ikusi.com' });
        else          setUser(null);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return { user, loading };
}
