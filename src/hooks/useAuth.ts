import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/api-amplify";
import { skipAuth } from "@/env.variables";

export function useAuth() {
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        if (skipAuth) {
          setUser({ email: "admin@ikusi.com" });
          return;
        }
        const current = await getCurrentUser();
        setUser({ email: String(current?.email || "") });
      } catch {
        if (skipAuth) setUser({ email: "admin@ikusi.com" });
        else setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return { user, loading };
}
