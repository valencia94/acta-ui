// src/pages/Dashboard.tsx
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { extractProjectData, getDownloadUrl, sendApprovalEmail } from '@/services/actaApi';
import ActaButtons from '@/components/ActaButtons';
import ProjectTable, { Project } from '@/components/ProjectTable';
import { useAuth } from '@/hooks/useAuth'; // example hook to get current user

export default function Dashboard() {
  const { user } = useAuth();                  // { email: string, ... }
  const [projectId, setProjectId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ← NEW: state for all PM’s projects
  const [projects, setProjects] = useState<Project[]>([]);

  // ← NEW: fetch project list once on mount
  useEffect(() => {
    if (!user?.email) return;

    fetch(`${import.meta.env.VITE_API_BASE_URL}/projects-by-pm?pm_email=${user.email}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(await r.text());
        return r.json() as Promise<Project[]>;
      })
      .then((list) => setProjects(list))
      .catch((err) => {
        console.error('Failed to load projects:', err);
        toast.error('Could not load your projects');
      });
  }, [user]);

  // … your existing handlers (handleGenerate, handleSendForApproval, downloadFile)

  if (error)
    return <div className="py-16 text-center text-red-600">{error}</div>;

  return (
    <div className="flex min-h-screen">
      {/* … sidebar … */}

      <main className="flex-1 bg-white px-6 py-12">
        <div className="mx-auto max-w-4xl space-y-8">
          <h1 className="text-3xl font-semibold text-primary">Project Dashboard</h1>

          {/* ID input + buttons */}
          <div className="mt-2">
            {/* … projectId input … */}
          </div>
          <ActaButtons
            onGenerate={handleGenerate}
            onSendForApproval={handleSendForApproval}
            onDownloadWord={() => downloadFile('docx')}
            onDownloadPdf={() => downloadFile('pdf')}
            disabled={!projectId}
          />
          {submitting && <p className="text-sm text-gray-400">Processing…</p>}

          {/* ← NEW: render the table here */}
          <div className="mt-12">
            <h2 className="text-2xl font-semibold text-primary mb-4">
              Your Projects
            </h2>
            <ProjectTable data={projects} />
          </div>
        </div>
      </main>
    </div>
  );
}
