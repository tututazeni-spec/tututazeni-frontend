'use client';

// Pedido de recuperação de senha. A resposta do backend é sempre genérica (anti-enumeração),
// por isso a confirmação também o é: nunca dizemos se o email existe.

import { useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { reportError } from '@/lib/errorReporting';
import { AlertCard } from '@/components/ui/AlertCard';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await apiClient.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      reportError(err, { source: 'ForgotPasswordPage.handleSubmit' });
      setError('Não foi possível enviar o pedido. Tente novamente dentro de instantes.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <h1 className="mb-1 text-xl font-bold text-[#0F1F3D]">Esqueci a senha</h1>
        <p className="mb-6 text-sm text-gray-600">
          Indique o seu email. Se existir uma conta, enviamos um link para definir uma nova senha.
        </p>

        {sent ? (
          <AlertCard
            variant="success"
            title="Pedido enviado"
            message="Se o email existir, receberá em breve as instruções. O link é válido por 30 minutos."
          />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              autoComplete="email"
              placeholder="o.seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#0F1F3D] focus:outline-none"
              required
            />
            {error && <AlertCard variant="danger" title="Pedido não enviado" message={error} />}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-[#0F1F3D] py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {loading ? 'A enviar…' : 'Enviar link'}
            </button>
          </form>
        )}

        <a href="/login" className="mt-4 block text-center text-sm text-[#0F1F3D] underline">
          Voltar ao login
        </a>
      </div>
    </main>
  );
}
