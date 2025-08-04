//src/components/AWSDataDashboard.tsx
import React, { useEffect, useState } from 'react';

import { getProjectsByPM } from '@/lib/api';

import { getAllProjects } from '../lib/awsDataService';

const TEST_PM_EMAIL = 'christian.valencia@ikusi.com';

export const AWSDataDashboard: React.FC = () => {
  const [adminProjects, setAdminProjects] = useState<any[]>([]);
  const [pmProjects, setPmProjects] = useState<any[]>([]);
  const [downloadResults, setDownloadResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function runTests() {
      setLoading(true);
      // 1. Admin projects
      const all = await getAllProjects();
      setAdminProjects(all);

      // 2. PM projects
      const pm = await getProjectsByPM(TEST_PM_EMAIL, false);
      setPmProjects(pm);

      // Mock downloads since downloadDocument is not available
      const downloads: string[] = [];

      // Note: downloadDocument function is not available, so we'll skip actual downloads
      if (pm.length >= 2) {
        for (let i = 0; i < 2; i++) {
          const projectId = String(pm[i].id);
          // Mock download result since downloadDocument is not implemented
          downloads.push(`Project ${projectId}: Download functionality not available`);
        }
      }

      setDownloadResults(downloads);
      setLoading(false);
    }
    runTests();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">AWS Data Dashboard Test Results</h2>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          <div className="mb-4">
            <strong>Admin dashboard:</strong> {adminProjects.length} projects loaded.
          </div>
          <div className="mb-4">
            <strong>PM dashboard ({TEST_PM_EMAIL}):</strong> {pmProjects.length} loans/projects
            loaded.
          </div>
          <div className="mb-4">
            <strong>Document Downloads:</strong>
            <ul>
              {downloadResults.map((result, idx) => (
                <li key={idx}>{result}</li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};
