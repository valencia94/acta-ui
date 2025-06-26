cat > src/pages/Dashboard.tsx <<'EOF'
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  listProjects,
  extractProjectData,
  getDownloadUrl,
  sendApprovalEmail,
} from "@/services/actaApi";
import toast from "react-hot-toast";

export default function Dashboard() {
  const [projects, setProjects] = useState<ProjectMeta[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setProjects(await listProjects());
      } catch {
        toast.error("API unreachable – check backend health");
      }
    })();
  }, []);

  const handleGenerate = async () => {
    if (!activeId) return;
    setBusy(true);
    try {
      await extractProjectData(activeId);
      toast.success("Acta generated ✓");
    } catch {
      toast.error("Generation failed – see logs");
    } finally {
      setBusy(false);
    }
  };

  const handleDownload = async () => {
    if (!activeId) return;
    window.open(await getDownloadUrl(activeId), "_blank");
  };

  const handleSend = async () => {
    if (!activeId) return;
    setBusy(true);
    try {
      await sendApprovalEmail(activeId);
      toast.success("Approval email queued ✓");
    } catch {
      toast.error("Email failed – retry later");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <header className="rounded-2xl bg-gradient-to-r from-[#1b6738] to-[#4ac795] p-8 text-white">
        <h1 className="text-3xl font-semibold">Project dashboard</h1>
        <p className="opacity-80">Select a project to generate or send an Acta</p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => (
          <Card
            key={p.id}
            onClick={() => setActiveId(p.id)}
            className={`cursor-pointer ${
              activeId === p.id ? "ring-2 ring-[#4ac795]" : ""
            }`}
          >
            <CardContent className="p-4">
              <h2 className="font-medium">{p.name}</h2>
              <p className="text-sm opacity-70">{p.description}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="flex flex-wrap gap-3">
        <Button disabled={!activeId || busy} onClick={handleGenerate}>
          Generate Acta
        </Button>
        <Button
          variant="secondary"
          disabled={!activeId || busy}
          onClick={handleDownload}
        >
          Download
        </Button>
        <Button
          variant="outline"
          disabled={!activeId || busy}
          onClick={handleSend}
        >
          Send for approval
        </Button>
      </div>
    </div>
  );
}
EOF
