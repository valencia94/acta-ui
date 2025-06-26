// @ts-expect-error Auth type not yet exported
import { Auth } from '@aws-amplify/auth';
import { useEffect, useState } from 'react';

export function useAuth() {
  const [user, setUser] = useState<{ email: string } | null>(null);
  useEffect(() => {
    Auth.currentAuthenticatedUser()
      .then((u) =>
        setUser({
          email: (u as { attributes: { email: string } }).attributes.email,
        })
      )
      .catch(() => setUser(null));
  }, []);
  return { user };
}
