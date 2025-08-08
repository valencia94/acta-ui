import { fetchAuthSession } from "aws-amplify/auth";

export async function getAuthToken(): Promise<string> {
  const { tokens } = await fetchAuthSession();
  const token = tokens?.idToken?.toString();
  if (!token) throw new Error("No ID token");
  return token;
}

export async function fetcher<T = any>(url: string, init: RequestInit = {}): Promise<T> {
  const token = await getAuthToken();
  const headers = new Headers(init.headers || {});
  headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && init.body && typeof init.body !== "string") {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(url, {
    mode: "cors",
    credentials: "omit",
    ...init,
    headers,
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }
  const contentType = res.headers.get("Content-Type") || "";
  if (contentType.includes("application/json")) {
    return (await res.json()) as T;
  }
  return (await res.text()) as unknown as T;
}
