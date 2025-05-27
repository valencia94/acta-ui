import { Download } from 'lucide-react';
import { useState } from 'react';

import { GenerateActaButton } from '../components/GenerateActaButton';

export default function Dashboard() {
  const [projectId, setProjectId] = useState('');
  const [summary, setSummary] = useState<null | { name: string; pm: string }>(
    null
  );

  function fetchSummary() {
    // ⚡️ TODO call API Gateway → Lambda
    setSummary({ name: 'SD-WAN Filiales', pm: 'Juan Pérez' });
  }

  function download(format: 'pdf' | 'docx') {
    // 📄 TODO presigned URL
    alert(`Downloading ${format.toUpperCase()} (mock)`);
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
          />
        </div>
        <button onClick={fetchSummary} className="btn">
          Retrieve
        </button>
      </div>

      {!summary && (
        <p className="text-slate-500 italic">
          Enter a project number to load its latest Acta.
        </p>
      )}

      {summary && (
        <div className="space-y-4">
          <div className="rounded-lg border p-6 bg-white shadow-sm">
            <h2 className="text-xl font-semibold mb-2">{summary.name}</h2>
            <p className="text-slate-600">PM • {summary.pm}</p>
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => download('pdf')}
              className="btn flex items-center gap-2"
            >
              <Download size={16} /> PDF
            </button>
            <button
              onClick={() => download('docx')}
              className="btn flex items-center gap-2"
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
