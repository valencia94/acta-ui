// src/components/AuthDebugger.tsx
import { fetchAuthSession, getCurrentUser } from '@aws-amplify/auth';
import { useEffect, useState } from 'react';

export default function AuthDebugger() {
  const [authStatus, setAuthStatus] = useState<any>(null);
  const [session, setSession] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Check if user is authenticated
      const user = await getCurrentUser();
      setAuthStatus(user);
      
      // Get session details
      const sessionData = await fetchAuthSession();
      setSession(sessionData);
      
      console.log('Auth Status:', user);
      console.log('Session:', sessionData);
    } catch (err: any) {
      setError(err.message);
      console.log('Not authenticated:', err.message);
    }
  };

  if (window.location.pathname !== '/login') {
    return null; // Only show on login page
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-4 rounded-lg text-xs max-w-sm">
      <h3 className="font-bold mb-2">🔍 Auth Debug Info</h3>
      <div className="space-y-2">
        <div>
          <strong>Status:</strong> {authStatus ? 'Authenticated' : 'Not authenticated'}
        </div>
        <div>
          <strong>User:</strong> {authStatus ? authStatus.username || 'No username' : 'None'}
        </div>
        <div>
          <strong>Session:</strong> {session ? 'Valid' : 'None'}
        </div>
        <div>
          <strong>Token:</strong> {session?.tokens?.idToken ? 'Present' : 'Missing'}
        </div>
        {error && (
          <div className="text-red-300">
            <strong>Error:</strong> {error}
          </div>
        )}
        <button 
          onClick={checkAuthStatus}
          className="bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded text-xs"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}
