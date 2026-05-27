'use client';

import { useState, FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError('Credenciales inválidas');
      setLoading(false);
    } else {
      router.push('/');
    }
  };

  return (
    <main className="min-h-screen bg-[#F8F9FA] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm w-full max-w-sm">
        <h1 className="text-2xl font-black italic tracking-tighter text-[#151619] mb-1">
          FIN<span className="text-[#12C2A2]">APP</span>
        </h1>
        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-8">
          Iniciar Sesión
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-[#FFF2F2] text-[#E53030] px-4 py-3 rounded-xl text-xs font-bold">
              {error}
            </div>
          )}

          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-2xl border border-zinc-200 text-sm font-bold bg-zinc-50 focus:outline-none focus:border-[#12C2A2] transition-colors"
              placeholder="tu@email.com"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1 block">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-2xl border border-zinc-200 text-sm font-bold bg-zinc-50 focus:outline-none focus:border-[#12C2A2] transition-colors"
              placeholder="--------"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#151619] text-white py-3 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-zinc-200 active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  );
}
