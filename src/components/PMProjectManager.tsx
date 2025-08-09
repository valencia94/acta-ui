// src/components/PMProjectManager.tsx
import { Clock, FileText, RefreshCw, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';

import { generateSummariesForPM } from '@/api';
import { getAllProjects, getProjectsByPM, PMProject } from '@/lib/api';

import Button from './Button';
import ProjectCard from './ProjectCard';

interface PMProjectManagerProps {
  pmEmail?: string;
  onProjectSelect?: (projectId: string) => void;
  selectedProjectId?: string;
  isAdminMode?: boolean;
  isAdminView?: boolean;
}

type SummariesResponse =
  | PMProject[] // some backends return an array directly
  | { success: PMProject[]; failed?: PMProject[] }; // others return an object

export default function PMProjectManager({
  pmEmail,
  onProjectSelect,
  selectedProjectId,
  isAdminMode = false,
  isAdminView = false,
}: PMProjectManagerProps) {
  const [projects, setProjects] = useState<PMProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [bulkGenerating, setBulkGenerating] = useState(false);

  useEffect(() => {
    const shouldLoadAll = isAdminView || isAdminMode;
    if (shouldLoadAll) {
      loadAllProjects();
    } else if (pmEmail) {
      loadPMProjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pmEmail, isAdminView, isAdminMode]);

  async function loadPMProjects() {
    if (!pmEmail) return;
    setLoading(true);
    try {
      const projectSummaries = await getProjectsByPM(pmEmail, false);
      const pmProjects: PMProject[] = projectSummaries.map((summary: any) => ({
        id: String(summary.id ?? summary.project_id ?? 'unknown'),
        name: String(summary.name ?? summary.project_name ?? 'Unknown Project'),
        pm: String(summary.pm ?? summary.project_manager ?? pmEmail),
        status: String(summary.status ?? summary.project_status ?? 'active'),
      }));
      setProjects(pmProjects);

      if (pmProjects.length > 0) {
        toast.success(
          `Found ${pmProjects.length} projects${isAdminMode ? ' (admin access)' : ' assigned to you'}`
        );
      } else {
        const message = isAdminMode
          ? 'No projects found in the system. Backend may not be configured yet.'
          : 'No projects found for your email. You can still enter Project IDs manually.';
        toast(message, { icon: isAdminMode ? '⚠️' : '💡', duration: 5000 });
      }
    } catch (error) {
      console.error('Error loading PM projects:', error);
      const message = isAdminMode
        ? 'Could not load projects. Backend endpoints may not be implemented yet.'
        : 'Could not load your assigned projects. You can still enter Project IDs manually.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  async function loadAllProjects() {
    setLoading(true);
    try {
      const allProjects = await getAllProjects();
      const transformed: PMProject[] = allProjects.map((p: any) => ({
        id: String(p.id ?? p.project_id ?? 'unknown'),
        name: String(p.name ?? p.project_name ?? 'Unknown Project'),
        pm: String(p.pm ?? p.project_manager ?? 'unknown@example.com'),
        status: String(p.status ?? p.project_status ?? 'active'),
      }));
      setProjects(transformed);
      const adminLabel = isAdminView ? '(admin dashboard)' : '(admin access)';
      toast.success(`Loaded ${transformed.length} projects ${adminLabel}`);
    } catch (error) {
      console.error('Error loading all projects:', error);
      toast.error('Could not load projects. Backend endpoints may not be implemented yet.');
    } finally {
      setLoading(false);
    }
  }

  async function handleBulkGenerate() {
    if (!pmEmail) {
      toast.error('Email address required for bulk generation');
      return;
    }
    if (projects.length === 0) {
      toast.error(
        'No projects available for bulk generation. Please load projects first or use manual entry.',
        { duration: 6000 }
      );
      return;
    }

    setBulkGenerating(true);
    try {
      toast('Starting bulk Acta generation for all your projects... This may take several minutes.', {
        icon: '⚡',
        duration: 6000,
      });

      const res: SummariesResponse = await generateSummariesForPM(pmEmail);
      const successArr = Array.isArray(res) ? res : (res.success ?? []);
      const failedArr = Array.isArray(res) ? [] : (res.failed ?? []);

      const successCount = successArr.length;
      const failureCount = failedArr.length;

      if (successCount > 0) {
        toast.success(
          `🎉 Bulk generation complete! Successfully processed ${successCount} projects.` +
            (failureCount ? ` ${failureCount} failed.` : ''),
          { duration: 8000 }
        );
      } else {
        toast.error('❌ No projects found for bulk generation.', { duration: 10000 });
      }

      if (isAdminView || isAdminMode) {
        loadAllProjects();
      } else {
        loadPMProjects();
      }
    } catch (error) {
      console.error('Bulk generation error:', error);
      toast.error(
        'Bulk generation failed. Backend API may not be available. You can still generate Actas individually using manual entry.',
        { duration: 8000 }
      );
    } finally {
      setBulkGenerating(false);
    }
  }

  const getProjectStatusIcon = (_project: PMProject) => (
    <Clock className="h-4 w-4 text-blue-500" />
  );

  function ensureArray<T>(value: T[] | undefined | null): T[] {
    return Array.isArray(value) ? value : [];
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-blue-500" />
          <h2 className="text-xl font-bold text-gray-800">
            {isAdminView ? 'All Projects' : 'Your Projects'}
          </h2>
          {projects.length > 0 && (
            <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2 py-1 rounded-full">
              {projects.length} projects
            </span>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            onClick={isAdminView ? loadAllProjects : loadPMProjects}
            disabled={loading}
            className="flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-xl"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {projects.length > 0 && (
            <Button
              onClick={handleBulkGenerate}
              disabled={bulkGenerating || loading}
              className="flex items-center gap-2 bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-xl"
            >
              <FileText className={`h-4 w-4 ${bulkGenerating ? 'animate-pulse' : ''}`} />
              {bulkGenerating ? 'Generating All...' : 'Generate All Actas'}
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-3 text-gray-500">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Loading your projects...</span>
          </div>
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-8">
          <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-700 mb-2">No Projects Found</h3>
          <p className="text-gray-500 mb-4">
            No projects found for <strong>{pmEmail}</strong> in the DynamoDB table.
          </p>
          <p className="text-sm text-gray-400">
            You can still enter Project IDs manually in the section above.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {ensureArray(projects).map((project) => (
            <ProjectCard
              key={String(project.id)}
              className={`
                p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                hover:shadow-md hover:scale-[1.01]
                ${
                  selectedProjectId === project.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }
              `}
              onClick={() => onProjectSelect?.(project.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-800">
                      {project.name || `Project ${project.id}`}
                    </span>
                    <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      ID: {project.id}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    {getProjectStatusIcon(project)}
                    <span className="text-gray-600">{project.status || 'Active'}</span>
                  </div>

                  <div className="text-xs text-gray-400 mt-1">PM: {project.pm}</div>
                </div>

                {selectedProjectId === project.id && (
                  <div className="ml-4">
                    <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                      Selected
                    </div>
                  </div>
                )}
              </div>
            </ProjectCard>
          ))}
        </div>
      )}

      {projects.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 rounded-xl">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-blue-500 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-800 mb-1">Quick Actions</h4>
              <ul className="text-sm text-blue-600 space-y-1">
                <li>• Click any project to select it for individual actions</li>
                <li>• Use "Generate All Actas" to create documents for all projects</li>
                <li>• Individual project actions will appear in the section above</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
