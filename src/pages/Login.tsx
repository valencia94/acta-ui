import { useNavigate } from 'react-router-dom';
export default function Login() {
  const nav = useNavigate();
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('jwt', 'fake-token');
    nav('/');
  };
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 font-sans">
      <img src="/ikusi-logo.png" className="w-32" />
      <h1 className="text-3xl font-semibold">Sign in to Acta Platform</h1>
      <form onSubmit={onSubmit} className="flex gap-2">
        <input placeholder="Email" className="border p-1" />
        <input placeholder="Password" type="password" className="border p-1" />
        <button className="bg-emerald-600 text-white px-3">Sign In</button>
      </form>
    </main>
  );
}
