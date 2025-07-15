// src/types/global.d.ts
import type { api, sendApprovalEmail, getSummary, getTimeline, generateActaDocument } from '@/lib/api';

declare global {
  interface Window {
    __actaApi?: typeof api;
    getSummary?: typeof getSummary;
    getTimeline?: typeof getTimeline;
    sendApprovalEmail?: typeof sendApprovalEmail;
    generateActaDocument?: typeof generateActaDocument;
    fetchWrapper?: typeof fetch;
    getAuthToken?: () => Promise<string>;
  }
}

export {};
