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
    <div className="rounded-2xl shadow-lg overflow-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-white sticky top-0">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => (
                <th
                  key={h.id}
                  className={`px-4 sm:px-6 py-3 text-left font-semibold text-gray-900 ${
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
        <tbody className="bg-white divide-y divide-gray-200">
          {table.getRowModel().rows.map((row) => {
            const project = row.original;
            const isSelected = selectedProjectId === project.id.toString();

            return (
              <tr
                key={row.id}
                onClick={() => handleRowClick(project)}
                className={`
                  project-card transition-colors duration-200 cursor-pointer
                  ${
                    isSelected
                      ? "bg-blue-50 hover:bg-blue-100 border-l-4 border-blue-500"
                      : "hover:bg-gray-50"
                  }
                `}
              >
                {row.getVisibleCells().map((cell) => (
                  <td
                    key={cell.id}
                    className={`px-4 sm:px-6 py-4 ${isSelected ? "text-blue-900" : "text-gray-900"} ${
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
