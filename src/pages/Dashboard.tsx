import { LayoutDashboard } from 'lucide-react';
import { useState } from 'react';

import {
  extractProjectData,
  getDownloadUrl,
  sendApprovalEmail,
} from '@/services/actaApi';

import ActaButtons from '../components/ActaButtons';

export default function Dashboard() {
  const [projectId, setProjectId] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    try {
      setSubmitting(true);
      await extractProjectData(projectId);
    } catch {
      setError('Failed to extract project data');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendForApproval = async () => {
    try {
      setSubmitting(true);
      await sendApprovalEmail({ actaId: projectId, clientEmail: '' });
    } catch {
      setError('Failed to send approval email');
    } finally {
      setSubmitting(false);
    }
  };

  const downloadFile = async (fmt: 'pdf' | 'docx') => {
    try {
      setSubmitting(true);
      const res = await getDownloadUrl(projectId, fmt);
      window.location.href = res.data;
    } catch {
      setError('Download failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (error)
    return <div className="py-16 text-center text-red-600">{error}</div>;

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-20 flex-col items-center gap-6 bg-gradient-to-b from-emerald-800 to-emerald-600 p-4 text-white md:flex md:w-56">
        <LayoutDashboard className="h-6 w-6" />
      </aside>

      <main className="flex-1 bg-white px-6 py-12">
        <div className="mx-auto max-w-4xl space-y-8">
          <h1 className="text-3xl font-semibold text-emerald-700">
            Project Dashboard
          </h1>
          <p className="text-gray-500">Project ID: {projectId}</p>
          <div className="mt-2">
            <label
              htmlFor="projectId"
              className="block text-sm text-gray-600 mb-1"
            >
              Enter a Project ID
            </label>
            <input
              id="projectId"
              type="text"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="e.g. 1000000064013473"
              className="w-full max-w-sm rounded border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <ActaButtons
            onGenerate={handleGenerate}
            onSendForApproval={handleSendForApproval}
            onDownloadWord={() => downloadFile('docx')}
            onDownloadPdf={() => downloadFile('pdf')}
          />

          {submitting && <p className="text-sm text-gray-400">Processing…</p>}
        </div>
      </main>
    </div>
  );
}
