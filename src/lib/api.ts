const BASE = import.meta.env.VITE_API_BASE_URL;

export async function sendApprovalEmail(projectId: string, recipient: string) {
  const res = await fetch(`${BASE}/sendapprovalemail`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project_id: projectId, recipient })
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}
