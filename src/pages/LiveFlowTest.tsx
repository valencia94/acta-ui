import { fetchAuthSession, signIn, signOut } from 'aws-amplify/auth';
import { useCallback, useMemo, useRef, useState } from 'react';

import Header from '@/components/Header';
import {
  checkDocumentInS3,
  generateActaDocument,
  getDownloadLink,
  previewPdfBackend,
  sendApprovalEmail,
} from '@/lib/api';

function nowIso() {
  return new Date().toLocaleString();
}

export default function LiveFlowTest(): JSX.Element {
  const [email, setEmail] = useState<string>(import.meta.env.VITE_USER_EMAIL || '');
  const [password, setPassword] = useState<string>(import.meta.env.VITE_USER_PW || '');
  const [projectId, setProjectId] = useState<string>('');
  const [recipient, setRecipient] = useState<string>(import.meta.env.VITE_USER_EMAIL || '');
  const [authStatus, setAuthStatus] = useState<string>('Not authenticated');
  const [busy, setBusy] = useState<boolean>(false);
  const logRef = useRef<HTMLDivElement | null>(null);

  const append = useCallback((msg: string) => {
    const el = logRef.current;
    if (!el) return;
    const line = document.createElement('div');
    line.textContent = `[${nowIso()}] ${msg}`;
    el.appendChild(line);
    el.scrollTop = el.scrollHeight;
  }, []);

  // Helper could be used if we auto-check on mount; keeping minimal for manual testing

  const handleSignIn = useCallback(async () => {
    setBusy(true);
    append('Signing in via Cognito...');
    try {
      const res = await signIn({ username: email, password });
      append(`Sign-in challenge: ${res.nextStep?.signInStep || 'done'}`);
      const session = await fetchAuthSession({ forceRefresh: true });
      const id = (session?.credentials as any)?.identityId;
      append(`Authenticated. Identity ID: ${id || 'unknown'}`);
      setAuthStatus('Authenticated');
      // Stash token for app compatibility
      const token = session.tokens?.idToken?.toString();
      if (token) localStorage.setItem('ikusi.jwt', token);
      window.dispatchEvent(new CustomEvent('auth-success'));
    } catch (e: any) {
      append(`Sign-in failed: ${e?.message || String(e)}`);
      setAuthStatus('Auth failed');
    } finally {
      setBusy(false);
    }
  }, [append, email, password]);

  const handleSignOut = useCallback(async () => {
    setBusy(true);
    try {
      await signOut();
      localStorage.removeItem('ikusi.jwt');
      setAuthStatus('Signed out');
      append('Signed out.');
    } catch (e: any) {
      append(`Sign-out error: ${e?.message || String(e)}`);
    } finally {
      setBusy(false);
    }
  }, [append]);

  const doGenerate = useCallback(async () => {
    if (!projectId) return append('Provide a projectId.');
    setBusy(true);
    append(`Generating ACTA for ${projectId}...`);
    try {
      const res = await generateActaDocument(projectId);
      append(`Generate response: ${JSON.stringify(res)}`);
    } catch (e: any) {
      append(`Generate failed: ${e?.message || String(e)}`);
    } finally {
      setBusy(false);
    }
  }, [append, projectId]);

  const doCheckPdf = useCallback(async () => {
    if (!projectId) return append('Provide a projectId.');
    setBusy(true);
    append(`Checking document availability (pdf) for ${projectId}...`);
    try {
      const res = await checkDocumentInS3(projectId, 'pdf');
      append(`Check result: ${JSON.stringify(res)}`);
    } catch (e: any) {
      append(`Check failed: ${e?.message || String(e)}`);
    } finally {
      setBusy(false);
    }
  }, [append, projectId]);

  const doPreview = useCallback(async () => {
    if (!projectId) return append('Provide a projectId.');
    setBusy(true);
    append(`Requesting preview URL for ${projectId}...`);
    try {
      const url = await previewPdfBackend(projectId);
      append(`Preview URL: ${url}`);
      window.open(url, '_blank');
    } catch (e: any) {
      append(`Preview failed: ${e?.message || String(e)}`);
    } finally {
      setBusy(false);
    }
  }, [append, projectId]);

  const doDownload = useCallback(async (format: 'pdf' | 'docx') => {
    if (!projectId) return append('Provide a projectId.');
    setBusy(true);
    append(`Requesting ${format.toUpperCase()} download URL for ${projectId}...`);
    try {
      const url = await getDownloadLink(projectId, format);
      append(`${format.toUpperCase()} URL: ${url}`);
      window.open(url, '_blank');
    } catch (e: any) {
      append(`Download failed: ${e?.message || String(e)}`);
    } finally {
      setBusy(false);
    }
  }, [append, projectId]);

  const doSendApproval = useCallback(async () => {
    if (!projectId) return append('Provide a projectId.');
    if (!recipient) return append('Provide a recipient email.');
    setBusy(true);
    append(`Sending approval email for ${projectId} to ${recipient}...`);
    try {
      const res = await sendApprovalEmail(projectId, recipient);
      append(`Send approval response: ${JSON.stringify(res)}`);
    } catch (e: any) {
      append(`Send approval failed: ${e?.message || String(e)}`);
    } finally {
      setBusy(false);
    }
  }, [append, projectId, recipient]);

  const authBadge = useMemo(() => {
    const color = authStatus.includes('Auth') && !authStatus.includes('failed') ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700';
    return <span className={`px-2 py-1 rounded text-xs font-semibold ${color}`}>{authStatus}</span>;
  }, [authStatus]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <Header />
      <div className="max-w-5xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Live Flow Test</h1>
        <p className="text-gray-600 mb-4">Sign in and validate the full ACTA flow end-to-end.</p>
        <div className="mb-4">{authBadge}</div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow p-4 space-y-3">
            <h2 className="font-semibold text-gray-800">Authentication</h2>
            <label className="block text-sm text-gray-600">Email</label>
            <input className="w-full border rounded px-3 py-2" value={email} onChange={(e) => setEmail(e.target.value)} />
            <label className="block text-sm text-gray-600">Password</label>
            <input className="w-full border rounded px-3 py-2" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            <div className="flex gap-2">
              <button disabled={busy} onClick={() => void handleSignIn()} className="px-3 py-2 rounded bg-emerald-600 text-white disabled:opacity-50">Sign In</button>
              <button disabled={busy} onClick={() => void handleSignOut()} className="px-3 py-2 rounded bg-gray-600 text-white disabled:opacity-50">Sign Out</button>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-4 space-y-3">
            <h2 className="font-semibold text-gray-800">Test Inputs</h2>
            <label className="block text-sm text-gray-600">Project ID</label>
            <input className="w-full border rounded px-3 py-2" placeholder="1000000055914011" value={projectId} onChange={(e) => setProjectId(e.target.value)} />
            <label className="block text-sm text-gray-600">Recipient Email</label>
            <input className="w-full border rounded px-3 py-2" value={recipient} onChange={(e) => setRecipient(e.target.value)} />
            <div className="flex flex-wrap gap-2 pt-1">
              <button disabled={busy} onClick={() => void doGenerate()} className="px-3 py-2 rounded bg-indigo-600 text-white disabled:opacity-50">Generate</button>
              <button disabled={busy} onClick={() => void doCheckPdf()} className="px-3 py-2 rounded bg-sky-600 text-white disabled:opacity-50">Check PDF</button>
              <button disabled={busy} onClick={() => void doPreview()} className="px-3 py-2 rounded bg-amber-600 text-white disabled:opacity-50">Preview PDF</button>
              <button disabled={busy} onClick={() => void doDownload('pdf')} className="px-3 py-2 rounded bg-green-600 text-white disabled:opacity-50">Download PDF</button>
              <button disabled={busy} onClick={() => void doDownload('docx')} className="px-3 py-2 rounded bg-teal-600 text-white disabled:opacity-50">Download DOCX</button>
              <button disabled={busy} onClick={() => void doSendApproval()} className="px-3 py-2 rounded bg-fuchsia-600 text-white disabled:opacity-50">Send Approval</button>
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold text-gray-800 mb-2">Results</h2>
          <div ref={logRef} className="h-64 overflow-auto border rounded p-3 text-sm font-mono text-gray-800 bg-gray-50" />
        </div>
      </div>
    </div>
  );
}
