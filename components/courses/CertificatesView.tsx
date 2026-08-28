// components/courses/CertificatesView.tsx
// Vista "Certificados": verificação por código + lista de
// certificados obtidos. Extraído de app/(platform)/courses/page.tsx.
// Migrado para a fundação de design: caixa de verificação passa a
// Card + Input + Button, estado vazio a EmptyState, cartão de
// certificado passa a Card com cabeçalho em gradiente (mesmo padrão
// de components/content-library/HomeTab.tsx).

'use client';

import { useState } from 'react';
import { Download } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Skeleton } from './shared';
import type { Certificate, CertificateVerifyResult } from './types';

export function CertificatesView() {
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyResult, setVerifyResult] =
    useState<CertificateVerifyResult | null>(null);

  const { data = [], isLoading: loading } = useApiQuery<Certificate[]>(
    queryKeys.courses.myCertificates(),
    '/courses/my/certificates',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  // Verificação on-demand de um código → mutação (acção pontual, não cacheada).
  const verifyMut = useApiMutation(
    (code: string) =>
      apiClient.get<CertificateVerifyResult>(
        `/courses/certificates/verify/${code}`,
      ),
    {
      onSuccess: (r) => setVerifyResult(r),
      onError: (e) => setVerifyResult({ error: e.message }),
      // Já mostra o erro inline (verifyResult.error) — evita duplicar num toast global.
      meta: { silent: true },
    },
  );
  const verify = () => {
    if (verifyCode.trim()) verifyMut.mutate(verifyCode.trim());
  };

  if (loading) return <Skeleton rows={3} />;

  return (
    <div className="space-y-6">
      {/* Verificar certificado */}
      <Card className="p-4">
        <div className="text-xs font-medium text-ink-muted uppercase tracking-wide mb-3">
          Verificar certificado
        </div>
        <div className="flex gap-3">
          <Input
            type="text"
            placeholder="Código do certificado (ex: CERT-1-42-1234567890)"
            value={verifyCode}
            onChange={(e) => setVerifyCode(e.target.value)}
            className="flex-1"
          />
          <Button onClick={verify}>Verificar</Button>
        </div>
        {verifyResult && (
          <div
            className={`mt-3 p-3 rounded-control text-sm ${verifyResult.error ? 'bg-danger-subtle text-danger-ink' : verifyResult.valid ? 'bg-success-subtle text-success-ink' : 'bg-warning-subtle text-warning-ink'}`}
          >
            {verifyResult.error
              ? `❌ ${verifyResult.error}`
              : verifyResult.valid
                ? `✅ Certificado válido — ${verifyResult.user?.fullName} — ${verifyResult.course?.title}`
                : `⚠ Certificado expirado`}
          </div>
        )}
      </Card>

      {/* Meus certificados */}
      {data.length === 0 ? (
        <EmptyState
          title="Sem certificados ainda"
          description="Conclua um curso para obter o seu primeiro certificado."
        />
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {data.map((cert) => (
            <Card key={cert.id} className="overflow-hidden">
              <div className="bg-gradient-to-r from-primary to-primary-active p-5 text-canvas">
                <div className="text-xs text-canvas/70 mb-1">
                  Certificado de conclusão
                </div>
                <div className="text-base font-semibold">
                  {cert.course.title}
                </div>
                <div className="text-xs text-canvas/70 mt-1 font-mono">
                  {cert.code}
                </div>
              </div>
              <div className="px-4 py-3">
                <div className="flex justify-between text-xs text-ink-muted">
                  <span>Emitido: {fmtDate(cert.issuedAt)}</span>
                  {cert.expiresAt && (
                    <span
                      className={
                        new Date() > new Date(cert.expiresAt)
                          ? 'text-danger'
                          : ''
                      }
                    >
                      Validade: {fmtDate(cert.expiresAt)}
                    </span>
                  )}
                </div>
                <Button intent="secondary" size="sm" className="mt-2 w-full">
                  <Download size={14} strokeWidth={1.75} />
                  Download PDF
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
