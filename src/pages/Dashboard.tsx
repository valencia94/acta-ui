import { useState } from 'react';
import { IkusiLogo } from "./IkusiLogo";

export default function Dashboard() {
  const [rows] = useState([
    {
      id: '10001',
      name: 'BANCOLOMBIA – SD-WAN EXT',
      pm: 'C. Valencia',
      status: 'READY',
    },
    {
      id: '10002',
      name: 'SAP Migration',
      pm: 'J. Smith',
      status: 'IN PROGRESS',
    },
  ]);

  return (
    <main className="min-h-screen flex flex-col font-sans">
      <header className="bg-ikusi-700 text-white flex items-center px-6 h-12">
        <IkusiLogo  alt="Ikusi Logo" className="h-6 mr-3" / />
        <h1 className="text-lg font-semibold">Acta Platform</h1>
      </header>

      <section className="p-8 max-w-5xl mx-auto w-full">
        <h2 className="text-3xl font-bold mb-6">Project Summary</h2>

        <table className="w-full border-collapse">
          <thead className="bg-slate-100">
            <tr className="text-left">
              <th className="py-2 px-3">ID</th>
              <th className="py-2 px-3">Name</th>
              <th className="py-2 px-3">PM</th>
              <th className="py-2 px-3">Status</th>
            </tr>
          </thead>

          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b last:border-none">
                <td className="py-2 px-3">{r.id}</td>
                <td className="py-2 px-3">{r.name}</td>
                <td className="py-2 px-3">{r.pm}</td>
                <td className="py-2 px-3">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
