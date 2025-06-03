import { Download } from 'lucide-react';
import { useState } from 'react';

import { getSummary, getTimeline, getDownloadUrl } from '../lib/api';
import { GenerateActaButton } from '../components/GenerateActaButton';

export default function Dashboard() {
  const [projectId, setProjectId] = useState('');
  const [summary, setSummary] = useState<null | any>(null);
  const [timeline, setTimeline] = useState<null | any[]>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchSummary() {
    setLoading(true);
    setError(null);
    setSummary(null);
    setTimeline(null);
    try {
      // Fetch project summary
      const summaryData = await getSummary(projectId);
      setSummary(summaryData);

      // Optionally fetch timeline as well, remove if not needed
      const timelineData = await getTimeline(projectId);
      setTimeline(timelineData);
    } catch (err: any) {
      setError(err.message || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  }

  async function download(format: 'pdf' | 'docx') {
    setLoading(true);
    setError(null);
    try {
      const url = await getDownloadUrl(projectId, format);
      window.open(url, '_blank');
    } catch (err: any) {
      setError(err.message || 'Download failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-3xl font-bold">Project Dashboard</h1>

      <div className="flex gap-4 items-end">
        <div>
          <label className="block text-sm font-medium mb-1">Project #</label>
          <input
            value={projectId}
            onChange={(e) => setProjectId(e.target.value)}
            placeholder="1000000061690051"
            className="input w-64"
            disabled={loading}
          />
        </div>
        <button onClick={fetchSummary} className="btn" disabled={loading || !projectId}>
          {loading ? 'Loading…' : 'Retrieve'}
        </button>
      </div>

      {error && (
        <div className="text-red-500">
          <strong>Error:</strong> {error}
        </div>
      )}

      {!summary && !loading && (
        <p className="text-slate-500 italic">
          Enter a project number to load its latest Acta.
        </p>
      )}

      {summary && (
        <div className="space-y-4">
          <div className="rounded-lg border p-6 bg-white shadow-sm">
            <h2 className="text-xl font-semibold mb-2">{summary.project_name || summary.name}</h2>
            <p className="text-slate-600">
              Project ID: {summary.project_id || projectId}
              <br />
              PM: {summary.pm || summary.project_manager || 'N/A'}
            </p>
          </div>

          {/* Optional Timeline Display */}
          {timeline && Array.isArray(timeline) && (
            <div className="rounded-lg border p-4 bg-slate-50 text-sm">
              <h3 className="font-semibold mb-2">Timeline</h3>
              <ul className="list-disc list-inside space-y-1">
                {timeline.length === 0 && (
                  <li>No timeline data available.</li>
                )}
                {timeline.map((event, idx) => (
                  <li key={idx}>
                    <strong>{event.hito || event.milestone || 'Event'}:</strong> {event.actividad || event.activity || ''}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={() => download('pdf')}
              className="btn flex items-center gap-2"
              disabled={loading}
            >
              <Download size={16} /> PDF
            </button>
            <button
              onClick={() => download('docx')}
              className="btn flex items-center gap-2"
              disabled={loading}
            >
              <Download size={16} /> Word
            </button>
            <GenerateActaButton
              projectId={projectId}
              recipient="demo@ikusi.com"
            />
          </div>
        </div>
      )}
    </div>
  );
}
