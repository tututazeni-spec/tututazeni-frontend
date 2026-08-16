'use client';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button, buttonVariants } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Award } from 'lucide-react';

interface Certificate {
  id: string;
  code: string;
  title: string;
  verificationCode: string;
  publicUrl: string | null;
  isRevoked: boolean;
  issuedAt: string;
}

export default function MyCertificatesPage() {
  const {
    data: resp,
    isLoading: loading,
    error: queryError,
    refetch,
  } = useApiQuery<{ data: Certificate[] }>(
    queryKeys.certification.myCertificates(),
    '/certification/my-certificates',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const data = resp?.data ?? [];
  const error = queryError?.message ?? '';
  const fetchData = () => refetch();

  if (loading)
    return (
      <div className="p-6">
        <Skeleton rows={3} itemClassName="h-24 bg-surface-sunken rounded-lg" />
      </div>
    );

  if (error)
    return (
      <div className="p-6">
        <div className="bg-danger-subtle border border-danger text-danger-ink p-4 rounded-lg">
          {error}
          <Button intent="ghost" size="sm" className="ml-4" onClick={fetchData}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-ink">Os Meus Certificados</h1>
      {data.length === 0 ? (
        <EmptyState
          icon={Award}
          title="Sem certificados"
          description="Ainda não tens certificados emitidos."
        />
      ) : (
        <div className="grid gap-4">
          {data.map((c) => (
            <Card key={c.id} className="p-5 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-ink">{c.title}</h3>
                <p className="text-sm text-ink-muted font-mono">{c.code}</p>
                <p className="text-xs text-ink-faint mt-1">
                  Emitido em {new Date(c.issuedAt).toLocaleDateString('pt-AO')}
                  {c.isRevoked && (
                    <span className="text-danger ml-2">• Revogado</span>
                  )}
                </p>
              </div>
              <div className="flex gap-2">
                <a
                  href={`/verify/${c.verificationCode}`}
                  target="_blank"
                  rel="noreferrer"
                  className={buttonVariants({ intent: 'secondary', size: 'sm' })}
                >
                  Verificar
                </a>
                {!c.isRevoked && c.publicUrl && (
                  <a
                    href={c.publicUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={buttonVariants({ intent: 'primary', size: 'sm' })}
                  >
                    Descarregar
                  </a>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
