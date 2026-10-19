// app/verify/[code]/page.tsx
// Página pública (sem login) para onde aponta o QR Code do certificado. Consulta
// sempre o registo actual no backend; o middleware deixa /verify aberto.

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { API_URL } from '@/lib/api';
import { Skeleton } from '@/components/ui/Skeleton';
import { VerifyResultCard } from '@/components/certificates/VerifyResultCard';
import type { VerifyCardResult } from '@/components/certificates/types';

export default function VerifyCertificatePage() {
  const { code } = useParams<{ code: string }>();
  const [result, setResult] = useState<VerifyCardResult | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/certificates/verify/${encodeURIComponent(code)}`)
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 404) return setResult({ notFound: true });
        if (!res.ok) return setFailed(true);
        setResult((await res.json()) as VerifyCardResult);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [code]);

  return (
    <main className="mx-auto max-w-xl px-4 py-12">
      <p className="mb-6 text-sm font-medium uppercase tracking-wide text-ink-muted">
        Verificação de certificado
      </p>
      {failed ? (
        <p className="text-sm text-danger">
          Não foi possível verificar agora. Tente novamente dentro de instantes.
        </p>
      ) : result ? (
        <VerifyResultCard result={result} />
      ) : (
        <Skeleton
          rows={1}
          itemClassName="h-64 w-full rounded-card bg-surface-sunken"
        />
      )}
    </main>
  );
}
