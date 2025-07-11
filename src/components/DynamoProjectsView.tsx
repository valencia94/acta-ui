// src/components/DynamoProjectsView.tsx
import { useEffect, useState } from 'react';
import { getProjectsByPM } from '@/lib/api';
import { getCurrentUser } from '@/lib/api-amplify';
import ProjectTable, { Project } from './ProjectTable';

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
  isAdminMode = false 
}: DynamoProjectsViewProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cognitoUser, setCognitoUser] = useState<any>(null);

  // Get Cognito user info on mount
  useEffect(() => {
    async function fetchCognitoUser() {
      try {
        const user = await getCurrentUser();
        setCognitoUser(user);
        console.log('🔐 Cognito user loaded:', user);
      } catch (error) {
        console.warn('⚠️ Could not load Cognito user:', error);
      }
    }
    fetchCognitoUser();
  }, []);

  useEffect(() => {
    async function fetchProjects() {
      if (!userEmail) return;
      
      setLoading(true);
      setError(null);
      
      try {
        console.log('📋 Fetching projects with Cognito authentication...');
        console.log('👤 User email:', userEmail);
        console.log('🔐 Cognito user:', cognitoUser);
        console.log('🛡️ Admin mode:', isAdmin);
        
        const projectSummaries = await getProjectsByPM(userEmail, isAdmin);
        console.log('✅ Projects loaded:', projectSummaries);
        
        // Transform ProjectSummary to Project interface for the table
        const projects: Project[] = projectSummaries.map((summary, index) => ({
          id: parseInt(summary.project_id) || (index + 1), // Convert to number
          name: summary.project_name,
          pm: summary.pm || summary.project_manager || 'Unknown',
          status: 'Active', // Default status since ProjectSummary doesn't have status
        }));
        
        setProjects(projects);
        console.log('📊 Projects transformed for table:', projects);
      } catch (err) {
        console.error('❌ Failed to load projects:', err);
        setError('Failed to load projects. Please check your authentication.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchProjects();
  }, [userEmail, isAdmin, cognitoUser]);

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mr-3"></div>
          <span className="text-gray-600">Loading projects with Cognito authentication...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-red-200">
        <div className="text-red-500 text-center">
          <p className="font-medium">{error}</p>
          <p className="text-sm mt-2">
            Authentication status: {cognitoUser ? '✅ Authenticated' : '❌ Not authenticated'}
          </p>
          {cognitoUser && (
            <p className="text-sm mt-1 text-gray-600">
              Signed in as: {cognitoUser.email}
            </p>
          )}
        </div>
      </div>
    );
  }

  if (!projects.length) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
        <div className="text-center text-gray-500">
          <p>No projects found.</p>
          <p className="text-sm mt-2">
            User: {userEmail} | Cognito: {cognitoUser?.email || 'Not loaded'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {isAdminMode ? 'All Projects (Admin)' : 'Your Projects'}
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
            {projects.length} project{projects.length !== 1 ? 's' : ''} found
          </div>
        </div>
      </div>
      
      <div className="p-6">
        <ProjectTable 
          data={projects}
        />
      </div>
    </div>
  );
}
