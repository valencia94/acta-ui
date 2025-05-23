import Shell from '@/components/Layout';
import ProjectTable, { Project } from '@/components/ProjectTable';

export default function App() {
  const data: Project[] = [
    {
      id: 10001,
      name: 'BANCOLOMBIA – SD-WAN EXT',
      pm: 'C. Valencia',
      status: 'READY',
    },
    { id: 10002, name: 'SAP Migration', pm: 'J. Smith', status: 'IN PROGRESS' },
  ];
  return (
    <Shell>
      <h1 className="text-4xl font-bold tracking-tight text-white">
        Project Summary
      </h1>
      <div className="mt-6">
        <ProjectTable data={data} />
      </div>
    </Shell>
  );
}
