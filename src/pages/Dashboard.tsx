// src/pages/Dashboard.tsx
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { extractProjectPlaceData, getDownloadUrl, sendApprovalEmail } from '@/lib/api';
import ActaButtons from '@/components/ActaButtons';
import ProjectTable, { Project } from '@/components/ProjectTable';
import { useAuth } from '@/hooks/useAuth';
import Shell from '@/components/Shell';
import { RefreshCw } from 'lucide-react';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [projectId, setProjectId] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user?.email) loadProjects();
  }, [user]);

  async function loadProjects() {
    setLoadingProjects(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/projects-by-pm?pm_email=${encodeURIComponent(
          user!.email
        )}`
      );
      if (!res.ok) throw new Error(await res.text());
      setProjects((await res.json()) as Project[]);
    } catch {
      toast.error('Could not load your projects');
    } finally {
      setLoadingProjects(false);
    }
  }

  async function handleGenerate() {
    setActionLoading(true);
    try {
      await extractProjectPlaceData(projectId);
      toast.success('Acta generated');
      loadProjects();
    } catch {
      toast.error('Failed to generate Acta');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleSendForApproval() {
    setActionLoading(true);
    try {
      await sendApprovalEmail(projectId, user!.email);
      toast.success('Approval email sent');
    } catch {
      toast.error('Failed to send approval email');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDownload(fmt: 'pdf' | 'docx') {
    setActionLoading(true);
    try {
      const url = await getDownloadUrl(projectId, fmt);
      toast.success(`Download ready: ${fmt.toUpperCase()}`);
      window.open(url, '_blank');
    } catch {
      toast.error('Download failed');
    } finally {
      setActionLoading(false);
    }
  }

  if (authLoading) return null;

  return (
    <Shell>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-white">
            Welcome, {user?.email}
          </h1>
          <button
            onClick={loadProjects}
            disabled={loadingProjects}
            className="text-white hover:text-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
          >
            <RefreshCw
              className={`h-6 w-6 ${loadingProjects ? 'animate-spin' : ''}`}
            />
          </button>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-md">
          <h2 className="text-xl font-semibold text-primary mb-4">Acta Actions</h2>
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <label
                htmlFor="projectId"
                className="block text-sm font-medium text-secondary"
              >
                Project ID
              </label>
              <input
                id="projectId"
                type="text"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="e.g. 1000000064013473"
                className="mt-1 w-full rounded-md border border-secondary px-3 py-2 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <ActaButtons
              onGenerate={handleGenerate}
              onSendForApproval={handleSendForApproval}
              onDownloadWord={() => handleDownload('docx')}
              onDownloadPdf={() => handleDownload('pdf')}
              disabled={!projectId || actionLoading}
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-primary">Your Projects</h2>
            {loadingProjects && (
              <span className="text-sm text-secondary">Loading…</span>
            )}
          </div>
          <ProjectTable data={projects} />
        </div>
      </div>
    </Shell>
  );
}
