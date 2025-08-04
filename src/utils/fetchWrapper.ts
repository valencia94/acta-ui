// src/utils/fetchWrapper.ts
import { fetchAuthSession } from "aws-amplify/auth";
import { skipAuth } from "@/env.variables";
import { SignatureV4 } from "@smithy/signature-v4";
import { HttpRequest } from "@smithy/protocol-http";
import { Sha256 } from "@aws-crypto/sha256-js";
import { parseUrl } from "@smithy/url-parser";
import { FetchHttpHandler } from "@smithy/fetch-http-handler";

// 👇 Match API Gateway endpoints that require SigV4
const needsSigV4 = (url: string) =>
  url.includes("/projects-for-pm") ||
  url.includes("/send-approval-email") ||
  url.includes("/check-document") ||
  url.includes("/all-projects") ||
  url.includes("/download-acta") ||
  url.includes("/extract-project-place");

/**
 * Get Cognito JWT token or IAM credentials depending on endpoint
 */
export async function getAuthToken(): Promise<string | null> {
  if (skipAuth) {
    console.log("🔓 Skip auth mode: Using mock token");
    return "mock-auth-token-skip-mode";
  }

  try {
    console.log("🔐 Attempting to fetch auth session...");
    const session = await fetchAuthSession();

    const token = session.tokens?.idToken?.toString();
    if (token) {
      console.log("✅ Successfully extracted ID token");
      return token;
    } else {
      console.warn("⚠️ No ID token found in session");
      return null;
    }
  } catch (error) {
    console.error("❌ Failed to fetch authentication session:", error);
    return null;
  }
}

/**
 * Core fetcher that dynamically signs SigV4 requests or uses Cognito JWT
 */
export async function fetcher<T>(
  input: RequestInfo,
  init?: RequestInit
): Promise<T> {
  const url = typeof input === "string" ? input : input.url;
  const isSig = needsSigV4(url);

  let response;

  if (isSig) {
    // ✅ Use SigV4 signing
    console.log("🔐 Using SigV4 credentials for:", url);

    const session = await fetchAuthSession();
    const creds = session.credentials;

    const signer = new SignatureV4({
      service: "execute-api",
      region: import.meta.env.VITE_APP_REGION,
      credentials: {
        accessKeyId: creds.accessKeyId,
        secretAccessKey: creds.secretAccessKey,
        sessionToken: creds.sessionToken,
        expiration: creds.expiration,
      },
      sha256: Sha256,
    });

    const headerEntries = init?.headers
      ? init.headers instanceof Headers
        ? Object.fromEntries(init.headers.entries())
        : (init.headers as Record<string, string>)
      : {};

    const httpRequest = new HttpRequest({
      ...parseUrl(url),
      method: init?.method ?? "GET",
      headers: {
        ...headerEntries,
        "Content-Type": "application/json",
        host: new URL(url).host,
      },
      body: init?.body,
    });

    const signed = await signer.sign(httpRequest);

    const handler = new FetchHttpHandler();
    response = await handler.handle(signed as any);
    const raw = await response.response.text();

    try {
      return JSON.parse(raw) as T;
    } catch {
      throw new Error("Failed to parse JSON from SigV4 response");
    }
  } else {
    // ✅ Use Cognito JWT fallback
    const token = await getAuthToken();
    const headers = new Headers(init?.headers);

    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (!headers.has("Content-Type") && init?.method !== "GET") {
      headers.set("Content-Type", "application/json");
    }

    const enhancedInit: RequestInit = {
      ...init,
      headers,
      credentials: "include",
    };

    console.log(`🌐 Fetching: ${url}`, {
      method: enhancedInit.method || "GET",
      hasAuth: !!token,
      headers: Object.fromEntries(headers.entries()),
    });

    const res = await fetch(url, enhancedInit);

    if (!res.ok) {
      let errorMessage = `HTTP ${res.status}: ${res.statusText}`;
      try {
        const errorText = await res.text();
        if (errorText) errorMessage += ` - ${errorText}`;
      } catch {}

      if (res.status === 403)
        errorMessage += " (Authentication required or insufficient permissions)";
      if (res.status === 502)
        errorMessage += " (Lambda function error)";
      if (res.status === 404)
        errorMessage += " (Endpoint not found)";
      console.error("❌ Fetch error:", errorMessage);
      throw new Error(errorMessage);
    }

    try {
      const data = await res.json();
      console.log("✅ Response data:", data);
      return data as T;
    } catch (error) {
      console.error("❌ Failed to parse JSON response:", error);
      throw new Error("Invalid JSON response from server");
    }
  }
}

export function get<T>(url: string): Promise<T> {
  return fetcher<T>(url, {
    credentials: "include",
  });
}

export function post<T>(url: string, body?: unknown): Promise<T> {
  return fetcher<T>(url, {
    method: "POST",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}
