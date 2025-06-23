import { Database, Download, Search, Send } from 'lucide-react';
import { useState } from 'react';

import { ActaButton } from '../components/ActaButtons';
import type { ProjectSummary, TimelineEvent } from '../lib/api';
import {
  extractProjectData,
  getDownloadUrl,
  getSummary,
  getTimeline,
  sendApprovalEmail,
} from '../services/actaApi';
// import { toast } from 'sonner'; // Uncomment if you use sonner for toasts

export default function Dashboard() {
  const [projectId, setProjectId] = useState('');
  const [summary, setSummary] = useState<ProjectSummary | null>(null);
  const [timeline, setTimeline] = useState<TimelineEvent[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRetrieve() {
    setLoading(true);
    setError(null);
    setSummary(null);
    setTimeline(null);
    try {
      const { data: summaryData } = await getSummary(projectId);
      setSummary(summaryData as ProjectSummary);

      const { data: timelineData } = await getTimeline(projectId);
      setTimeline(timelineData as TimelineEvent[]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error fetching data');
    } finally {
      setLoading(false);
    }
  }

  async function download(format: 'pdf' | 'docx') {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getDownloadUrl(projectId, format);
      const url = data.url;
      window.open(url, '_blank');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Download failed');
    } finally {
      setLoading(false);
    }
  }

  async function handleExtractProjectData() {
    setLoading(true);
    setError(null);
    try {
      await extractProjectData(projectId);
      // Replace alert with toast.success if you use a toast library
      // toast.success('ProjectPlace data extracted!');
      alert('ProjectPlace data extracted!');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Extraction failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold text-ikusi-dark">Project Dashboard</h1>

      <div className="flex flex-wrap gap-4 items-end bg-white p-4 rounded-lg shadow">
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
        <ActaButton
          onClick={handleRetrieve}
          disabled={loading || !projectId}
          className="flex items-center gap-2"
        >
          <Search size={16} /> {loading ? 'Loading…' : 'Retrieve'}
        </ActaButton>
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
            <h2 className="text-xl font-semibold mb-2">
              {String(summary.project_name || summary.name)}
            </h2>
            <p className="text-slate-600">
              Project ID: {summary.project_id || projectId}
              <br />
              PM: {summary.pm || summary.project_manager || 'N/A'}
            </p>
          </div>

          {timeline && Array.isArray(timeline) && (
            <div className="rounded-lg border p-4 bg-slate-50 text-sm">
              <h3 className="font-semibold mb-2">Timeline</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr>
                      <th className="px-2 py-1 text-left">Hito</th>
                      <th className="px-2 py-1 text-left">Actividades</th>
                      <th className="px-2 py-1 text-left">Desarrollo</th>
                      <th className="px-2 py-1 text-left">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timeline.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center text-slate-400">
                          No timeline data available.
                        </td>
                      </tr>
                    ) : (
                      timeline.map((event, idx) => (
                        <tr key={idx}>
                          <td className="border px-2 py-1">{event.hito}</td>
                          <td className="border px-2 py-1">
                            {event.actividades}
                          </td>
                          <td className="border px-2 py-1">
                            {event.desarrollo}
                          </td>
                          <td className="border px-2 py-1">{event.fecha}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-4">
        <ActaButton
          onClick={() => download('pdf')}
          disabled={loading || !projectId}
          className="flex items-center gap-2"
        >
          <Download size={16} /> PDF
        </ActaButton>
        <ActaButton
          onClick={() => download('docx')}
          disabled={loading || !projectId}
          className="flex items-center gap-2"
        >
          <Download size={16} /> Word
        </ActaButton>
        <ActaButton
          onClick={() =>
            sendApprovalEmail({
              actaId: projectId,
              clientEmail: 'demo@ikusi.com',
            })
          }
          disabled={loading || !projectId}
          className="flex items-center gap-2"
        >
          <Send size={16} /> Generate Acta
        </ActaButton>
        <ActaButton
          onClick={handleExtractProjectData}
          disabled={loading || !projectId}
          className="flex items-center gap-2"
        >
          <Database size={16} /> Extract ProjectPlace Data
        </ActaButton>
      </div>
    </div>
  );
}
