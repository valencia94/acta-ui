const BASE = import.meta.env.VITE_API_BASE_URL;

export async function sendApprovalEmail(
  projectId: string,
  recipient: string
) {
  const response = await fetch(`${BASE}/sendapprovalemail`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ project_id: projectId, recipient }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API ${response.status}: ${text}`);
  }

  return response.json() as Promise<{ message: string; token: string }>;
}
