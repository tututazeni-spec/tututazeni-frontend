// components/courses/CertificatesView.tsx
// "Os meus certificados": resumo pessoal (pendentes, a expirar, obrigatórias em
// falta), verificação por código, filtros e cartões com download e partilha.
// Só se oferecem as acções que funcionam: PDF (válido/expirado), ligação pública,
// LinkedIn (URL oficial "Add to profile") e e-mail (só com SMTP configurado).

'use client';

import { useMemo, useState } from 'react';
import { Copy, Download, Mail, Share2 } from 'lucide-react';
import { usePdfDownload } from '@/hooks/usePdfDownload';
import { Badge } from '@/components/ui/Badge';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { MySummaryPanel } from '@/components/certificates/MySummaryPanel';
import { MyLearningPathsPanel } from '@/components/certificates/MyLearningPathsPanel';
import type {
  LearningPathProgress,
  MySummary,
} from '@/components/certificates/types';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { PeriodPills } from '@/components/ui/Pills';
import { Skeleton } from './shared';
import type { Certificate, CertificateVerifyResult } from './types';
import { Checkbox } from '@/components/ui/Checkbox';

type StatusFilter = 'ALL' | Certificate['status'];
type KindFilter = 'ALL' | 'COURSE' | 'EVENT' | 'TRAINING' | 'LEARNING_PATH';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Todos' },
  { value: 'ACTIVE', label: 'Válidos' },
  { value: 'EXPIRED', label: 'Expirados' },
  { value: 'REVOKED', label: 'Revogados' },
  { value: 'PENDING_APPROVAL', label: 'Pendentes' },
] as const;

const KIND_OPTIONS = [
  { value: 'ALL', label: 'Todos' },
  { value: 'COURSE', label: 'Cursos' },
  { value: 'EVENT', label: 'Eventos' },
  { value: 'TRAINING', label: 'Formações' },
  { value: 'LEARNING_PATH', label: 'Trilhas' },
] as const;

const STATUS_BADGE: Record<
  Certificate['status'],
  { label: string; intent: 'success' | 'warning' | 'danger' | 'neutral' }
> = {
  ACTIVE: { label: 'Válido', intent: 'success' },
  EXPIRED: { label: 'Expirado', intent: 'warning' },
  REVOKED: { label: 'Revogado', intent: 'danger' },
  PENDING: { label: 'Pendente', intent: 'neutral' },
  PENDING_APPROVAL: { label: 'Aguarda aprovação', intent: 'neutral' },
};

export function CertificatesView() {
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyResult, setVerifyResult] =
    useState<CertificateVerifyResult | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('ALL');
  const [kind, setKind] = useState<KindFilter>('ALL');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [withExpiry, setWithExpiry] = useState(false);

  const { data = [], isLoading: loading } = useApiQuery<Certificate[]>(
    queryKeys.courses.myCertificates(),
    '/certificates/my',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const { data: summary } = useApiQuery<MySummary>(
    queryKeys.certificates.mySummary(),
    '/certificates/my/summary',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const { data: learningPaths = [] } = useApiQuery<LearningPathProgress[]>(
    queryKeys.certificates.myLearningPaths(),
    '/certificates/my/learning-paths',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  // Verificação on-demand de um código → mutação (acção pontual, não cacheada).
  const verifyMut = useApiMutation(
    (code: string) =>
      apiClient.get<CertificateVerifyResult>(`/certificates/verify/${code}`),
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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return data.filter((c) => {
      if (q && !c.displayTitle.toLowerCase().includes(q)) return false;
      if (status !== 'ALL' && c.status !== status) return false;
      if (kind !== 'ALL' && c.activityKind !== kind) return false;
      if (from && c.issuedAt.slice(0, 10) < from) return false;
      if (to && c.issuedAt.slice(0, 10) > to) return false;
      if (withExpiry && !c.expiresAt) return false;
      return true;
    });
  }, [data, search, status, kind, from, to, withExpiry]);

  if (loading) return <Skeleton rows={3} />;

  return (
    <div className="space-y-6">
      {summary && <MySummaryPanel summary={summary} />}
      <MyLearningPathsPanel paths={learningPaths} />

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
            className={`mt-3 p-3 rounded-control text-sm ${verifyResult.error ? 'bg-danger-subtle text-black' : verifyResult.valid ? 'bg-success-subtle text-black' : 'bg-warning-subtle text-black'}`}
          >
            {verifyResult.error
              ? `${verifyResult.error}`
              : verifyResult.valid
                ? `Certificado válido — ${verifyResult.holderName} — ${verifyResult.title}`
                : verifyResult.status === 'REVOKED'
                  ? 'Certificado revogado'
                  : 'Certificado expirado'}
          </div>
        )}
      </Card>

      {data.length === 0 ? (
        <EmptyState
          title="Sem certificados ainda"
          description="Conclua um curso para obter o seu primeiro certificado."
        />
      ) : (
        <>
          <Card className="space-y-3 p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <Input
                placeholder="Pesquisar por formação"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="sm:col-span-2"
              />
              <Input
                type="date"
                aria-label="Emitidos desde"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
              <Input
                type="date"
                aria-label="Emitidos até"
                value={to}
                onChange={(e) => setTo(e.target.value)}
              />
            </div>
            <PeriodPills
              label="Estado"
              options={STATUS_OPTIONS}
              value={status}
              onChange={setStatus}
            />
            <PeriodPills
              label="Tipo"
              options={KIND_OPTIONS}
              value={kind}
              onChange={setKind}
            />
            <div className="flex items-center justify-between text-sm text-ink-muted">
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={withExpiry}
                  onChange={(e) => setWithExpiry(e.target.checked)}
                />
                Só com data de validade
              </label>
              <span>{`${filtered.length} de ${data.length}`}</span>
            </div>
          </Card>

          {filtered.length === 0 ? (
            <EmptyState
              title="Nenhum certificado corresponde aos filtros"
              description="Altere ou limpe os filtros para ver os restantes."
            />
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {filtered.map((cert) => (
                <CertificateCard
                  key={cert.id}
                  cert={cert}
                  emailEnabled={!!summary?.emailEnabled}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function CertificateCard({
  cert,
  emailEnabled,
}: {
  cert: Certificate;
  emailEnabled: boolean;
}) {
  const confirm = useConfirm();
  const toast = useToast();
  const { download, loading, error } = usePdfDownload(
    'certificate',
    String(cert.id),
  );
  const badge = STATUS_BADGE[cert.status];
  const downloadable = cert.status === 'ACTIVE' || cert.status === 'EXPIRED';
  const shareable =
    cert.status !== 'PENDING_APPROVAL' && cert.status !== 'PENDING';

  const emailMe = useApiMutation(
    () => apiClient.post(`/certificates/${cert.id}/email-me`),
    {
      onSuccess: () =>
        toast({
          title: 'Certificado enviado para o seu e-mail.',
          intent: 'success',
        }),
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(cert.verifyUrl);
      toast({ title: 'Ligação de verificação copiada.', intent: 'success' });
    } catch {
      toast({ title: 'Não foi possível copiar a ligação.', intent: 'danger' });
    }
  }

  async function onEmail() {
    const ok = await confirm({
      title: 'Enviar o certificado para o seu e-mail?',
      confirmLabel: 'Enviar',
    });
    if (ok) emailMe.mutate(undefined);
  }

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-primary to-primary-active p-5 text-canvas">
        <div className="text-xs text-canvas/70 mb-1">
          {cert.origin === 'EXTERNAL'
            ? 'Certificado externo'
            : 'Certificado de conclusão'}
        </div>
        <div className="text-base font-semibold">{cert.displayTitle}</div>
        <div className="text-xs text-canvas/70 mt-1 font-mono">
          {cert.validationCode}
        </div>
      </div>
      <div className="px-4 py-3">
        <div className="flex items-center justify-between text-xs text-ink-muted">
          <span>Emitido: {fmtDate(cert.issuedAt)}</span>
          <Badge intent={badge.intent}>{badge.label}</Badge>
        </div>
        {cert.expiresAt && (
          <div className="mt-1 text-xs text-ink-muted">
            Validade: {fmtDate(cert.expiresAt)}
          </div>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          {downloadable && (
            <Button
              intent="secondary"
              size="sm"
              onClick={() => void download()}
              disabled={loading}
            >
              <Download size={14} strokeWidth={1.75} />
              {loading ? 'A gerar…' : 'Download PDF'}
            </Button>
          )}
          {shareable && (
            <Button
              intent="secondary"
              size="sm"
              onClick={() => void copyLink()}
            >
              <Copy size={14} strokeWidth={1.75} />
              Copiar ligação
            </Button>
          )}
          {cert.linkedInUrl && (
            <Button
              intent="secondary"
              size="sm"
              onClick={() =>
                window.open(cert.linkedInUrl, '_blank', 'noopener,noreferrer')
              }
            >
              <Share2 size={14} strokeWidth={1.75} />
              Adicionar ao LinkedIn
            </Button>
          )}
          {emailEnabled && cert.status === 'ACTIVE' && (
            <Button
              intent="secondary"
              size="sm"
              onClick={() => void onEmail()}
              disabled={emailMe.isPending}
            >
              <Mail size={14} strokeWidth={1.75} />
              Enviar por e-mail
            </Button>
          )}
        </div>
        {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      </div>
    </Card>
  );
}
