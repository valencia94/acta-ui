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

        // Check if we have a token in localStorage first
        const token = localStorage.getItem('ikusi.jwt');
        if (!token) {
          console.log('🔍 useAuth: No token in localStorage');
          setUser(null);
          return;
        }

        console.log('🔍 useAuth: Token found, getting current user...');
        const currentUser = await getCurrentUser();
        console.log('🔍 useAuth: Current user:', currentUser);
        
        setUser({
          email: currentUser.signInDetails?.loginId || currentUser.username || '',
        });
      } catch (error) {
        console.error('🔍 useAuth: Error getting current user:', error);
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

    // Listen for authentication state changes
    const handleAuthChange = () => {
      console.log('🔍 useAuth: Auth state changed, re-fetching user...');
      fetchUser();
    };

    // Listen for storage changes (logout)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'ikusi.jwt') {
        console.log('🔍 useAuth: JWT token changed in localStorage');
        fetchUser();
      }
    };

    window.addEventListener('auth-success', handleAuthChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('auth-success', handleAuthChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return { user, loading };
}
