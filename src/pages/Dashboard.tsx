// src/pages/Dashboard.tsx
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { extractProjectPlaceData, getDownloadUrl, sendApprovalEmail } from '@/lib/api';
import ActaButtons from '@/components/ActaButtons';
import ProjectTable, { Project } from '@/components/ProjectTable';
import { useAuth } from '@/hooks/useAuth';
import Shell from '@/layout';
import logoSrc from '@assets/ikusi-logo.png';
import { RefreshCw } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();  
  const [projectId, setProjectId] = useState<string>('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch all projects for this PM
  const fetchProjects = async () => {
    if (!user?.email) return;
    setLoadingProjects(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/projects-by-pm?pm_email=${encodeURIComponent(user.email)}`
      );
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as Project[];
      setProjects(data);
    } catch (err) {
      console.error(err);
      toast.error('Could not load your projects');
    } finally {
      setLoadingProjects(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user]);

  // Generate Acta
  const handleGenerate = async () => {
    setActionLoading(true);
    try {
      await extractProjectPlaceData(projectId);
      toast.success('Acta generated');
      fetchProjects();
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate Acta');
    } finally {
      setActionLoading(false);
    }
  };

  // Send approval email
  const handleSendForApproval = async () => {
    setActionLoading(true);
    try {
      await sendApprovalEmail(projectId, user?.email ?? '');
      toast.success('Approval email sent');
    } catch (err) {
      console.error(err);
      toast.error('Failed to send approval email');
    } finally {
      setActionLoading(false);
    }
  };

  // Download .pdf or .docx
  const handleDownload = async (fmt: 'pdf' | 'docx') => {
    setActionLoading(true);
    try {
      const url = await getDownloadUrl(projectId, fmt);
      toast.success(`Download ready: ${fmt.toUpperCase()}`);
      window.open(url, '_blank');
    } catch (err) {
      console.error(err);
      toast.error('Download failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Shell>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src={logoSrc} alt="Ikusi logo" className="h-10 w-auto" />
            <h1 className="text-2xl font-semibold text-white">
              Welcome, {user?.email}
            </h1>
          </div>
          <button
            onClick={fetchProjects}
            disabled={loadingProjects}
            className="text-white hover:text-accent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent"
          >
            <RefreshCw className={`h-6 w-6 ${loadingProjects ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Acta Controls */}
        <div className="bg-white p-6 rounded-2xl shadow-md">
          <h2 className="text-xl font-semibold text-primary mb-4">Acta Actions</h2>
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <label htmlFor="projectId" className="block text-sm font-medium text-secondary">
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

        {/* Projects Table */}
        <div className="bg-white p-6 rounded-2xl shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-primary">Your Projects</h2>
            {loadingProjects && <span className="text-sm text-secondary">Loading…</span>}
          </div>
          <ProjectTable data={projects} />
        </div>
      </div>
    </Shell>
  );
}
