// src/components/DynamoProjectsView.tsx
import { useEffect, useState } from "react";
import { getProjectsByPM, PMProject } from "@/lib/api";
import { getCurrentUser } from "@/lib/api-amplify";
import ProjectTable, { Project } from "./ProjectTable";
import { ProjectTableSkeleton } from "./LoadingSkeleton";
import ErrorCallout from "./ErrorCallout";

interface DynamoProjectsViewProps {
  userEmail: string;
  isAdmin?: boolean;
  onProjectSelect?: (projectId: string) => void;
  selectedProjectId?: string;
  isAdminMode?: boolean;
}

export default function DynamoProjectsView({
  userEmail,
  isAdmin = false,
  onProjectSelect,
  selectedProjectId,
  isAdminMode = false,
}: DynamoProjectsViewProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cognitoUser, setCognitoUser] = useState<any>(null);
  const [retryLoading, setRetryLoading] = useState(false);

  // Get Cognito user info on mount
  useEffect(() => {
    async function fetchCognitoUser() {
      try {
        const user = await getCurrentUser();
        setCognitoUser(user);
        console.log("🔐 Cognito user loaded:", user);
      } catch (error) {
        console.warn("⚠️ Could not load Cognito user:", error);
      }
    }
    fetchCognitoUser();
  }, []);

  const loadProjects = async (isRetry = false) => {
    if (!userEmail) return;

    if (isRetry) {
      setRetryLoading(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      console.log("📋 Fetching projects with Cognito authentication...");
      console.log("👤 User email:", userEmail);
      console.log("🔐 Cognito user:", cognitoUser);
      console.log("🛡️ Admin mode:", isAdmin);

      const projectSummaries = await getProjectsByPM(userEmail, isAdmin);
      console.log("✅ Projects loaded:", projectSummaries);

      const projects: Project[] = projectSummaries.map(
        (summary: PMProject, index: number) => ({
          id: parseInt(summary.id) || index + 1,
          name: summary.name || `Project ${summary.id}`,
          pm: summary.pm || "Unknown",
          status: summary.status || "Active",
        }),
      );

      setProjects(projects);
    } catch (err) {
      console.error("❌ Failed to load projects:", err);
      const errorMessage =
        err instanceof Error
          ? err.message
          : "Failed to load projects. Please check your authentication.";
      setError(errorMessage);
    } finally {
      setLoading(false);
      setRetryLoading(false);
    }
  };

  const handleRetry = () => {
    loadProjects(true);
  };

  useEffect(() => {
    loadProjects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEmail, isAdmin, cognitoUser]);

  if (loading || retryLoading) {
    return <ProjectTableSkeleton rows={3} />;
  }

  if (error) {
    return (
      <ErrorCallout
        title="Failed to load projects"
        message={error}
        onRetry={handleRetry}
        retryLoading={retryLoading}
        className="mx-auto max-w-2xl"
      />
    );
  }

  if (!projects.length) {
    return (
      <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-lg p-8 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-white/80 font-medium">No projects found.</p>
          <p className="text-white/60 text-sm">Projects will appear here once they're assigned to you.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
      <div className="p-6 border-b border-white/10 bg-gradient-to-r from-white/5 to-transparent">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-white">
              {isAdminMode ? "All Projects (Admin)" : "Your Projects"}
            </h3>
            <p className="text-sm text-white/70 mt-1">
              {cognitoUser ? (
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  Authenticated as {cognitoUser.email}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
                  Authentication status unknown
                </span>
              )}
            </p>
          </div>
          <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-full px-3 py-1">
            <div className="text-sm text-white/90 font-medium">
              {projects.length} project{projects.length !== 1 ? "s" : ""} found
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <ProjectTable
          data={projects}
          onProjectSelect={onProjectSelect}
          selectedProjectId={selectedProjectId}
        />
      </div>
    </div>
  );
}
