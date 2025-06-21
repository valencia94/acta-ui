import axios from 'axios';

import { apiBaseUrl } from '../env.variables';

const api = axios.create({
  baseURL: apiBaseUrl,
});

export { api };

export const getTimeline = (id: string) => api.get(`/timeline/${id}`);
export const getDownloadUrl = (id: string, fmt: 'pdf' | 'docx') =>
  api.get(`/download-acta/${id}`, { params: { format: fmt } });
export const getSummary = (id: string) => api.get(`/project-summary/${id}`);
export const sendApprovalEmail = (payload: {
  actaId: string;
  clientEmail: string;
}) => api.post('/send-approval-email', payload);
export const extractProjectData = (id: string) =>
  api.post(`/extract-project-place/${id}`);
