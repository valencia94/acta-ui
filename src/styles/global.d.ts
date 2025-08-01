// src/types/global.d.ts
import type { api } from "@/lib/api";
import type { getAuthToken } from "@/utils/fetchWrapper";
import type { ActaApi } from "@/types/api";

declare global {
  interface Window {
    __actaApi?: ActaApi;
    awsmobile?: any;
    getSummary?: (id: string) => Promise<unknown>;
    getTimeline?: (id: string) => Promise<unknown>;
    getDownloadUrl?: (
      projectId: string,
      format: "pdf" | "docx",
    ) => Promise<string>;
    sendApprovalEmail?: (
      actaId: string,
      clientEmail: string,
    ) => Promise<unknown>;
    fetchWrapper?: typeof fetch;
    getAuthToken?: typeof getAuthToken;
  }
}

export {};
