// src/components/ProjectTable.tsx
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";

import StatusChip from "./StatusChip";

export type Project = { id: number; name: string; pm: string; status: string };

const columns: ColumnDef<Project>[] = [
  { accessorKey: "id", header: "ID" },
  { accessorKey: "name", header: "Name" },
  { accessorKey: "pm", header: "PM" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ getValue }) => <StatusChip status={getValue<string>()} />,
  },
];

interface ProjectTableProps {
  data: Project[];
  onProjectSelect?: (projectId: string) => void;
  selectedProjectId?: string;
}

export default function ProjectTable({
  data,
  onProjectSelect,
  selectedProjectId,
}: ProjectTableProps) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleRowClick = (project: Project) => {
    if (onProjectSelect) {
      onProjectSelect(project.id.toString());
    }
  };

  return (
    <div className="rounded-2xl overflow-hidden backdrop-blur-md bg-white/5 border border-white/10 shadow-xl">
      <table className="min-w-full text-sm">
        <thead className="backdrop-blur-md bg-white/10 border-b border-white/10 sticky top-0">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => (
                <th
                  key={h.id}
                  className={`px-4 sm:px-6 py-4 text-left font-bold text-white/90 tracking-wide ${
                    h.column.id === "id"
                      ? "hidden sm:table-cell"
                      : h.column.id === "pm"
                        ? "hidden md:table-cell"
                        : ""
                  }`}
                >
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-white/5">
          {table.getRowModel().rows.map((row) => {
            const project = row.original;
            const isSelected = selectedProjectId === project.id.toString();

            return (
              <tr
                key={row.id}
                onClick={() => handleRowClick(project)}
                className={`
                  transition-all duration-300 cursor-pointer group relative
                  ${
                    isSelected
                      ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-l-4 border-blue-400"
                      : "hover:bg-white/10"
                  }
                `}
              >
                {/* Selection Glow Effect */}
                {isSelected && (
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-lg"></div>
                )}
                
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={`relative px-4 sm:px-6 py-4 font-medium transition-colors duration-300 ${
                      isSelected ? "text-white" : "text-white/80 group-hover:text-white"
                    } ${
                      cell.column.id === "id"
                        ? "hidden sm:table-cell"
                        : cell.column.id === "pm"
                          ? "hidden md:table-cell"
                          : ""
                    }`}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
