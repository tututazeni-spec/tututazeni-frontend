'use client';

// Pedido de recuperação de senha. A resposta do backend é sempre genérica (anti-enumeração),
// por isso a confirmação também o é: nunca dizemos se o email existe.

import { useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { reportError } from '@/lib/errorReporting';
import { AlertCard } from '@/components/ui/AlertCard';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

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
      setError(
        'Não foi possível enviar o pedido. Tente novamente dentro de instantes.',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
      <div className="w-full max-w-md rounded-panel bg-surface p-8 shadow-lg">
        <h1 className="mb-1 text-xl font-bold text-brand">Esqueci a senha</h1>
        <p className="mb-6 text-sm text-gray-600">
          Indique o seu email. Se existir uma conta, enviamos um link para
          definir uma nova senha.
        </p>

        {sent ? (
          <AlertCard
            variant="success"
            title="Pedido enviado"
            message="Se o email existir, receberá em breve as instruções. O link é válido por 30 minutos."
          />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              autoComplete="email"
              placeholder="o.seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full"
              required
            />
            {error && (
              <AlertCard
                variant="danger"
                title="Pedido não enviado"
                message={error}
              />
            )}
            <Button type="submit" loading={loading} className="w-full">
              {loading ? 'A enviar…' : 'Enviar link'}
            </Button>
          </form>
        )}

        <a
          href="/login"
          className="mt-4 block text-center text-sm text-brand underline"
        >
          Voltar ao login
        </a>
      </div>
    </main>
  );
}
