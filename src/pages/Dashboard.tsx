import { useState } from "react";

export default function Dashboard() {
  const [projects] = useState([
    { id: "P-001", name: "Sample Project", status: "Ready" }
  ]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-semibold mb-4">Projects</h1>
      <table className="min-w-full border text-sm">
        <thead className="bg-slate-100">
          <tr><th>ID</th><th>Name</th><th>Action</th></tr>
        </thead>
        <tbody>
          {projects.map(p => (
            <tr key={p.id} className="border-t">
              <td className="px-2">{p.id}</td>
              <td>{p.name}</td>
              <td>
                <button
                  className="bg-emerald-600 text-white px-3 py-1 rounded"
                  onClick={() => alert(`Generate Acta for ${p.id}`)}
                >
                  Generate Acta
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
