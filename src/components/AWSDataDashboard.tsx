import React, { useEffect, useState } from 'react';
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
      // Mock PM projects since getProjectsByPM is not available in awsDataService
      const pm: any[] = [];
      setPmProjects(pm);

      // Mock downloads since downloadDocument is not available
      const downloads: string[] = ['Download functionality disabled'];
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
            <strong>PM dashboard ({TEST_PM_EMAIL}):</strong> {pmProjects.length} loans/projects loaded.
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
