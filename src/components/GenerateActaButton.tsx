import { useState } from "react";
import { sendApprovalEmail } from "../lib/api";
import { toast } from "sonner";

interface Props { projectId: string; recipient: string; }

export function GenerateActaButton({ projectId, recipient }: Props) {
  const [busy, setBusy] = useState(false);
  async function handle() {
    try {
      setBusy(true);
      await sendApprovalEmail(projectId, recipient);
      toast.success("Acta sent for approval");
    } catch (e: any) {
      toast.error(e.message || "Error sending Acta");
    } finally { setBusy(false); }
  }
  return (
    <button className="btn btn-primary" disabled={busy} onClick={handle}>
      {busy ? "Sending…" : "Generate Acta"}
    </button>
  );
}
