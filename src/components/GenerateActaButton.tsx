import { useState } from 'react';
import { toast } from 'sonner';

import { sendApprovalEmail } from '../lib/api';

interface Props {
  actaId: string;
  clientEmail: string;
}

export function GenerateActaButton({ actaId, clientEmail }: Props) {
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    try {
      setBusy(true);
      await sendApprovalEmail(actaId, clientEmail);
      toast.success('Acta sent for approval');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error sending Acta';
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button className="btn btn-primary" disabled={busy} onClick={handleClick}>
      {busy ? 'Sending…' : 'Generate Acta'}
    </button>
  );
}
