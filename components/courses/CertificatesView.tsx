// components/courses/CertificatesView.tsx
// "Os meus certificados": resumo pessoal (pendentes, a expirar, obrigatórias em
// falta), verificação por código, filtros e cartões com download e partilha.
// Só se oferecem as acções que funcionam: PDF (válido/expirado), ligação pública,
// LinkedIn (URL oficial "Add to profile") e e-mail (só com SMTP configurado).

'use client';

import { useMemo, useState } from 'react';
import {
  CalendarDays,
  Check,
  Copy,
  Download,
  Mail,
  Trash2,
} from 'lucide-react';
import { usePdfDownload } from '@/hooks/usePdfDownload';
import { Badge } from '@/components/ui/Badge';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { cn } from '@/lib/cn';
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
import { Skeleton } from './shared';
import type { Certificate, CertificateVerifyResult } from './types';

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

export function CertificatesView({
  onlyOwnVerify = false,
}: {
  /** Colaborador: "Verificar certificado" só aceita códigos dos seus certificados. */
  onlyOwnVerify?: boolean;
} = {}) {
  const [verifyCode, setVerifyCode] = useState('');
  const [verifyResult, setVerifyResult] =
    useState<CertificateVerifyResult | null>(null);

  const { data = [], isLoading: loading } = useApiQuery<Certificate[]>(
    queryKeys.courses.myCertificates(),
    '/certificates/my',
    // Um certificado novo (curso acabado de concluir) tem de aparecer logo.
    { staleTime: STALE_TIME.DYNAMIC },
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
    const code = verifyCode.trim();
    if (!code) return;
    if (
      onlyOwnVerify &&
      !data.some((c) => c.validationCode.toLowerCase() === code.toLowerCase())
    ) {
      setVerifyResult({
        error: 'Só pode verificar os seus próprios certificados.',
      });
      return;
    }
    verifyMut.mutate(code);
  };

  // Todos, do mais recente para o mais antigo.
  const sorted = useMemo(
    () =>
      [...data].sort(
        (x, y) =>
          new Date(y.issuedAt).getTime() - new Date(x.issuedAt).getTime(),
      ),
    [data],
  );

  if (loading) return <Skeleton rows={3} />;

  return (
    <div className="space-y-6">
      {summary && <MySummaryPanel summary={summary} />}
      <MyLearningPathsPanel paths={learningPaths} />

      {data.length === 0 ? (
        <EmptyState
          title="Sem certificados ainda"
          description="Conclua um curso para obter o seu primeiro certificado."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {sorted.map((cert) => (
              <CertificateCard
                key={cert.id}
                cert={cert}
                emailEnabled={!!summary?.emailEnabled}
              />
            ))}
          </div>
        </>
      )}

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
            className={`mt-3 p-3 rounded-control text-sm ${verifyResult.error ? 'bg-danger-subtle text-ink' : verifyResult.valid ? 'bg-success-subtle text-ink' : 'bg-warning-subtle text-ink'}`}
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

  // "Apagar" só oculta da lista do titular: o certificado fica nos relatórios e na auditoria.
  const hide = useApiMutation(
    () => apiClient.delete(`/certificates/my/${cert.id}`),
    {
      invalidateKeys: [
        queryKeys.courses.myCertificates(),
        queryKeys.certificates.mySummary(),
      ],
      onSuccess: () =>
        toast({
          title: 'Certificado apagado da sua lista.',
          intent: 'success',
        }),
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  async function onDelete() {
    const ok = await confirm({
      title: 'Apagar este certificado revogado da sua lista?',
      message:
        'Deixa de aparecer em "Os meus certificados". O registo mantém-se nos relatórios e na auditoria.',
      confirmLabel: 'Apagar',
      destructive: true,
    });
    if (ok) hide.mutate(undefined);
  }

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

  const pill = STATUS_PILL[badge.intent];
  // Botões altos, ícone à esquerda e rótulo em duas linhas (desenho de referência).
  const BTN =
    'group transition-colors hover:border-brand hover:bg-brand hover:text-white active:border-brand active:bg-brand active:text-white h-8 min-h-0 w-fit shrink-0 justify-start gap-2 whitespace-nowrap rounded-control px-3 py-0 text-left text-sm font-semibold';
  const OUTLINE = `${BTN} border-[1.5px] border-brand bg-surface text-brand`;

  return (
    <div className="relative overflow-hidden rounded-[22px] border border-brand-line bg-gradient-to-br from-brand-soft/60 via-surface to-surface p-6 shadow-[0_8px_24px_rgba(15,31,61,0.10)]">
      {/* Ilustração do certificado (canto superior direito) */}
      <CertificateIllustration className="pointer-events-none absolute right-2 top-2 hidden h-[150px] w-[200px] sm:block" />

      <div className="relative flex items-start gap-4 sm:pr-[190px]">
        <div
          aria-hidden
          className="flex h-[68px] w-[68px] shrink-0 items-center justify-center rounded-full bg-success text-white"
        >
          <Check size={38} strokeWidth={3.25} />
        </div>
        <div className="min-w-0">
          <div className="text-[15px] text-ink-muted">
            {cert.origin === 'EXTERNAL'
              ? 'Certificado externo'
              : 'Certificado de conclusão'}
          </div>
          <div className="mt-1 font-display text-2xl font-bold leading-tight text-brand">
            {cert.displayTitle}
          </div>
          <div className="mt-2 break-all text-[15px] uppercase tracking-wide text-ink-muted">
            {cert.validationCode}
          </div>
        </div>
      </div>

      <div className="relative mt-5 sm:w-[62%]">
        <div className="border-t border-brand-line" />
      </div>

      <div className="relative mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="space-y-0.5 text-[15px] text-ink">
          <div className="flex items-center gap-2.5">
            <CalendarDays size={22} strokeWidth={1.5} className="text-brand" />
            Emitido: {fmtDate(cert.issuedAt)}
          </div>
          {cert.expiresAt && (
            <div className="pl-8 text-xs text-ink-muted">
              Validade: {fmtDate(cert.expiresAt)}
            </div>
          )}
        </div>
        <span
          className={`inline-flex items-center gap-2 rounded-pill px-4 py-1 text-[15px] font-semibold ${pill.box}`}
        >
          <span className={`h-2.5 w-2.5 rounded-full ${pill.dot}`} />
          {badge.label}
        </span>
      </div>

      <div className="relative mt-4 grid grid-cols-2 justify-items-start gap-3">
        {downloadable && (
          <Button
            size="sm"
            className={`${BTN} border-[1.5px] border-primary bg-primary text-white`}
            onClick={() => void download()}
            disabled={loading}
          >
            <Download size={18} strokeWidth={1.75} className="shrink-0" />
            <span>{loading ? 'A gerar…' : 'Download PDF'}</span>
          </Button>
        )}
        {shareable && (
          <Button
            intent="secondary"
            size="sm"
            className={OUTLINE}
            onClick={() => void copyLink()}
          >
            <Copy size={18} strokeWidth={1.75} className="shrink-0" />
            <span>Copiar ligação</span>
          </Button>
        )}
        {cert.linkedInUrl && (
          <Button
            intent="secondary"
            size="sm"
            className={OUTLINE}
            onClick={() =>
              window.open(cert.linkedInUrl, '_blank', 'noopener,noreferrer')
            }
          >
            <LinkedInMark />
            <span>Adicionar ao LinkedIn</span>
          </Button>
        )}
        {cert.status === 'REVOKED' && (
          <Button
            intent="secondary"
            size="sm"
            className={cn(
              BTN,
              'border-[1.5px] border-danger bg-surface text-danger hover:border-danger hover:bg-danger hover:text-white active:border-danger active:bg-danger active:text-white',
            )}
            onClick={() => void onDelete()}
            disabled={hide.isPending}
          >
            <Trash2 size={18} strokeWidth={1.75} className="shrink-0" />
            Apagar
          </Button>
        )}
        {emailEnabled && cert.status === 'ACTIVE' && (
          <Button
            intent="secondary"
            size="sm"
            className={OUTLINE}
            onClick={() => void onEmail()}
            disabled={emailMe.isPending}
          >
            <Mail size={18} strokeWidth={1.75} className="shrink-0" />
            Enviar por e-mail
          </Button>
        )}
      </div>
      {error && <p className="relative mt-2 text-xs text-danger">{error}</p>}
    </div>
  );
}

const STATUS_PILL: Record<
  'success' | 'warning' | 'danger' | 'neutral',
  { box: string; dot: string }
> = {
  success: { box: 'bg-success-subtle text-success-ink', dot: 'bg-success' },
  warning: { box: 'bg-warning-subtle text-warning-ink', dot: 'bg-warning' },
  danger: { box: 'bg-danger-subtle text-danger-ink', dot: 'bg-danger' },
  neutral: { box: 'bg-brand-line text-brand-muted', dot: 'bg-brand-muted' },
};

/** Quadrado azul com "in" (marca do LinkedIn). */
function LinkedInMark() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-[18px] w-[18px] shrink-0">
      <rect
        width="24"
        height="24"
        rx="4"
        className="fill-primary group-hover:fill-white group-active:fill-white"
      />
      <path
        d="M7.2 10.2v6.6M7.2 7.4v.1M10.6 16.8v-6.6m0 3.1c0-1.9 1.2-3.2 2.8-3.2 1.5 0 2.4 1 2.4 2.9v3.8"
        className="stroke-white group-hover:stroke-brand group-active:stroke-brand"
        strokeWidth="2.1"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/** Pergaminho inclinado com linhas, medalha dourada e brilhos — ilustração do cartão. */
function CertificateIllustration({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 220 165" fill="none" className={className}>
      <ellipse cx="108" cy="92" rx="88" ry="66" fill="#EAF1FD" />
      <g transform="rotate(-7 100 80)">
        <rect x="52" y="22" width="86" height="102" rx="9" fill="#FFFFFF" />
        <rect
          x="52"
          y="22"
          width="86"
          height="102"
          rx="9"
          stroke="#2F6FDE"
          strokeWidth="5"
        />
        <rect x="52" y="22" width="86" height="15" rx="7" fill="#3B7BEA" />
        <rect x="64" y="48" width="56" height="7" rx="3.5" fill="#4C8CF2" />
        <rect x="64" y="63" width="44" height="7" rx="3.5" fill="#9DBDF6" />
        <rect x="64" y="78" width="52" height="7" rx="3.5" fill="#9DBDF6" />
        <path
          d="M52 124c10 0 14 8 24 8h62"
          stroke="#2F6FDE"
          strokeWidth="5"
          strokeLinecap="round"
        />
      </g>
      <path d="M140 96l-12 34 14-6 7 14 12-42z" fill="#F2833B" />
      <path d="M156 94l8 38 8-12 12 6-7-38z" fill="#E86A25" />
      <circle cx="150" cy="86" r="22" fill="#F5B731" />
      <circle
        cx="150"
        cy="86"
        r="15"
        fill="#F9D262"
        stroke="#E7A21C"
        strokeWidth="2.5"
      />
      <path
        d="M150 76l3 6.3 6.9 1-5 4.8 1.2 6.9-6.1-3.2-6.1 3.2 1.2-6.9-5-4.8 6.9-1z"
        fill="#F5B731"
      />
      <path
        d="M186 22l3 9M198 34l-8 5M176 14l-1 8"
        stroke="#3B7BEA"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
