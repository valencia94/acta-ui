// src/types/global.d.ts
import type { api } from '@/lib/api'; // assumes default export or adapt to match your actual export
import type { getAuthToken } from '@/utils/fetchWrapper';

declare global {
  interface Window {
    __actaApi?: typeof api;
    getSummary?: (id: string) => Promise<unknown>;
    getTimeline?: (id: string) => Promise<unknown>;
    getDownloadUrl?: (projectId: string, format: 'pdf' | 'docx') => Promise<string>;
    sendApprovalEmail?: (actaId: string, clientEmail: string) => Promise<unknown>;
    fetchWrapper?: typeof fetch;
    getAuthToken?: typeof getAuthToken;
  }
}

export {};
