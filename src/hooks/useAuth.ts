import { getCurrentUser } from '@aws-amplify/auth';
import { useEffect, useState } from 'react';
import { skipAuth } from '@/env.variables';

export function useAuth() {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        
        // In skip auth mode, provide a mock admin user for testing
        if (skipAuth) {
          console.log('🔓 Skip auth mode: Using mock admin user');
          setUser({
            email: 'admin@ikusi.com', // This will trigger admin access
          });
          return;
        }

        const currentUser = await getCurrentUser();
        setUser({
          email: currentUser.signInDetails?.loginId || '',
        });
      } catch (error) {
        // In skip auth mode, still provide mock user even if getCurrentUser fails
        if (skipAuth) {
          console.log('🔓 Skip auth mode: Using mock admin user (fallback)');
          setUser({
            email: 'admin@ikusi.com',
          });
        } else {
          setUser(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  return { user, loading };
}
