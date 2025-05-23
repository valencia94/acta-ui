import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';

import StatusChip from './StatusChip';

export type Project = { id: number; name: string; pm: string; status: string };
const columns: ColumnDef<Project>[] = [
  { accessorKey: 'id', header: 'ID' },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'pm', header: 'PM' },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ getValue }) => <StatusChip status={getValue<string>()} />,
  },
];

export default function ProjectTable({ data }: { data: Project[] }) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });
  return (
    <div className="rounded-2xl shadow-lg overflow-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-white sticky top-0">
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((h) => (
                <th key={h.id} className="px-6 py-3 text-left font-semibold">
                  {flexRender(h.column.columnDef.header, h.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id} className="hover:bg-ikusi-50">
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-6 py-4">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
