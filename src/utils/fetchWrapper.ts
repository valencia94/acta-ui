import { fetchAuthSession } from "aws-amplify/auth";

export async function getAuthToken(): Promise<string> {
  const { tokens } = await fetchAuthSession();
  const token = tokens?.idToken?.toString();
  if (!token) throw new Error("Authentication failed: No ID token available. Please log in again.");
  return token;
}

export async function fetcher(url: string, init: RequestInit = {}): Promise<Response> {
  const token = await getAuthToken();
  const headers = new Headers(init.headers || {});
  headers.set("Authorization", `Bearer ${token}`);
  if (
    !headers.has("Content-Type") &&
    init.body &&
    typeof init.body === "object" &&
    !(init.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(url, { mode: "cors", credentials: "omit", ...init, headers });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const maxBodyLength = 100;
    const sanitizedBody = body.length > maxBodyLength
      ? body.slice(0, maxBodyLength) + "...[truncated]"
      : body;
    throw new Error(`HTTP ${res.status}: ${res.statusText}\n${sanitizedBody}`);
  }
  return res;
}

export async function get<T>(url: string): Promise<T> {
  const res = await fetcher(url);
  return res.json();
}

export async function post<T>(url: string, body?: unknown): Promise<T> {
  const init: RequestInit = {
    method: "POST",
    body:
      body && typeof body === "object" && !(body instanceof FormData)
        ? JSON.stringify(body)
        : (body as BodyInit | undefined),
  };
  const res = await fetcher(url, init);
  return res.json();
}
