#!/usr/bin/env bash
# ------------------------------------------------------------
# Bootstrap “Upscaled” Acta UI
# ------------------------------------------------------------
set -euo pipefail

echo -e "\n🟢  1) Install / upgrade design-system deps …"
pnpm add -D tailwindcss@latest postcss@latest autoprefixer@latest \
           @tailwindcss/typography@latest                       \
           clsx@latest                                          \
           framer-motion@latest                                 \
           @tanstack/react-table@latest                         \
           lucide-react@latest                                  \
           @shadcn/ui@latest

pnpm add -D @fontsource/inter@latest

# -------------------------------------------------------------------
echo -e "\n🟢  2) Initialise Tailwind (only first run) …"
if [ ! -f tailwind.config.js ]; then
  npx tailwindcss init -p
fi

# -------------------------------------------------------------------
echo -e "\n🟢  3) Inject Ikusi palette into tailwind.config.js …"
# ── cross-platform sed (BSD on macOS vs GNU on Linux)
SED="sed -i"
if [[ "$(uname)" == "Darwin" ]]; then SED="sed -i ''"; fi

# backup on first run
[[ -f tailwind.config.js.bak ]] || cp tailwind.config.js tailwind.config.js.bak

if ! grep -q "ikusi: {" tailwind.config.js; then
  $SED '/theme:/{n; s/.*/&,\
    extend: {\
      colors: {\
        ikusi: {\
          50:\"#e4f7ef\",100:\"#b8e9d4\",200:\"#8bdbba\",300:\"#5dcca0\",\
          400:\"#38c18c\",500:\"#19b77a\",600:\"#00a26f\",700:\"#00855d\",\
          800:\"#006846\",900:\"#00472d\"\
        }\
      }\
    },/; }' tailwind.config.js
  echo "    ➜  Ikusi palette injected"
else
  echo "    ➜  Palette already present, skipped"
fi

# -------------------------------------------------------------------
echo -e "\n🟢  4) Global stylesheet + Inter font …"
mkdir -p src
if [ ! -f src/index.css ]; then
cat > src/index.css <<'CSS'
@import "@fontsource/inter/variable-full.css";
@tailwind base;
@tailwind components;
@tailwind utilities;

/* --- brand gradient surface --- */
body{
  @apply font-[Inter] bg-gradient-to-b from-ikusi-700 via-ikusi-600 to-ikusi-500 text-gray-900;
}
CSS
  echo "    ➜  src/index.css created"
else
  echo "    ➜  src/index.css exists, left unchanged"
fi

# -------------------------------------------------------------------
echo -e "\n🟢  5) Initialise shadcn config (idempotent) …"
/usr/bin/env npx shadcn-ui@latest init -y || true

mkdir -p src/components/{ui,_generated}

# -------------------------------------------------------------------
echo -e "\n🟢  6) Scaffold layout, status chip & data-table …"

# --- Layout Shell
cat > src/components/Layout.tsx <<'TSX'
import { Menu, LayoutDashboard } from "lucide-react";
import { motion } from "framer-motion";
import { ReactNode } from "react";
export default function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-gradient-to-b from-ikusi-700 via-ikusi-600 to-ikusi-500">
      {/* ── sidebar */}
      <aside className="w-20 xl:w-56 bg-white/10 backdrop-blur-sm text-white p-4 flex flex-col gap-6">
        <Menu className="h-6 w-6 mx-auto" />
        <div className="mt-8 flex flex-col gap-4">
          <LayoutDashboard className="mx-auto h-6 w-6" />
        </div>
      </aside>

      {/* ── main surface */}
      <main className="flex-1 p-6 md:p-10">
        <motion.header
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <img src="/ikusi-logo.png" className="h-10 drop-shadow" />
        </motion.header>
        <section className="mt-8">{children}</section>
      </main>
    </div>
  );
}
TSX

# --- Status badge
cat > src/components/StatusChip.tsx <<'TSX'
import clsx from "clsx";
export default function StatusChip({ status }: { status: string }) {
  const map: Record<string, string> = {
    READY: "bg-green-100 text-green-700",
    "IN PROGRESS": "bg-amber-100 text-amber-700 animate-pulse",
    BLOCKED: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={clsx(
        "px-3 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1",
        map[status] ?? "bg-gray-100 text-gray-700"
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}
TSX

# --- DataTable
cat > src/components/ProjectTable.tsx <<'TSX'
import { ColumnDef, flexRender, getCoreRowModel, useReactTable } from "@tanstack/react-table";
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

export default function ProjectTable({ data }: { data: Project[] }) {
  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() });
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
TSX

# --- Replace App.tsx
cat > src/App.tsx <<'TSX'
import Shell from "@/components/Layout";
import ProjectTable, { Project } from "@/components/ProjectTable";

export default function App() {
  const data: Project[] = [
    { id: 10001, name: "BANCOLOMBIA – SD-WAN EXT", pm: "C. Valencia", status: "READY" },
    { id: 10002, name: "SAP Migration", pm: "J. Smith", status: "IN PROGRESS" },
  ];
  return (
    <Shell>
      <h1 className="text-4xl font-bold tracking-tight text-white">Project Summary</h1>
      <div className="mt-6">
        <ProjectTable data={data} />
      </div>
    </Shell>
  );
}
TSX

# -------------------------------------------------------------------
echo -e "\n✅  Upscale bootstrap complete!"
echo    "👉  Commit the generated files and enjoy the polished UI."
echo -e "🚀  Starting dev server (ctrl-c to stop) …\n"

pnpm dev

