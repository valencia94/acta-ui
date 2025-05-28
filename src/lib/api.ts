// src/pages/ProjectOverview.tsx
import { useLoaderData } from 'react-router-dom';
import { Download } from 'lucide-react';
import { getDownloadUrl } from '@/lib/api';

export async function loader({ params }) {
  const [summary, timeline] = await Promise.all([
    getSummary(params.id),
    getTimeline(params.id),
  ]);
  return { summary, timeline };
}

export default function ProjectOverview() {
  const { summary, timeline } = useLoaderData() as LoaderData;

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">{summary.project_name}</h1>
      <p className="text-slate-600">PM • {summary.pm}</p>

      <section className="space-y-2">
        <h2 className="font-semibold">Timeline</h2>
        <ul className="border rounded divide-y">
          {timeline.map((row) => (
            <li key={row.orden} className="p-2 flex gap-4">
              <span className="w-1/3">{row.hito}</span>
              <span className="w-1/3">{row.actividad}</span>
              <span className="flex-1">{row.desarrollo}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex gap-4">
        {(['pdf', 'docx'] as const).map((fmt) => (
          <button
            key={fmt}
            className="btn flex items-center gap-2"
            onClick={async () =>
              window.open(await getDownloadUrl(summary.project_id, fmt))
            }
          >
            <Download size={16} /> {fmt.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}
