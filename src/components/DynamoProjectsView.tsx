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
      <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-200 text-center text-gray-500">
        <p>No projects found.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {isAdminMode ? "All Projects (Admin)" : "Your Projects"}
            </h3>
            <p className="text-sm text-gray-500">
              {cognitoUser ? (
                <>✅ Authenticated as {cognitoUser.email}</>
              ) : (
                <>⚠️ Authentication status unknown</>
              )}
            </p>
          </div>
          <div className="text-sm text-gray-500">
            {projects.length} project{projects.length !== 1 ? "s" : ""} found
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
