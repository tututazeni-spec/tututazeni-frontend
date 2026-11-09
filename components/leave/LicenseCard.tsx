// components/leave/LicenseCard.tsx
// Cartão de licença (aba "Licenças"): identidade, tipo e estado à esquerda;
// Período / Duração / Regime / Aprovador num painel branco e, por baixo, a data
// de submissão, os comprovativos e as acções. O desenho é o de LeaveCardShell,
// partilhado com o cartão de ausência.

import {
  CalendarDays,
  Check,
  Clock,
  FileLock2,
  Paperclip,
  UserCheck,
  Wallet,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { NavyBadge, type NavyTone } from '@/components/courses/NavyCard';
import { formatDate, formatDateTime } from '@/lib/format';
import { PAY_REGIME_LABELS, PHASE_CFG } from './constants';
import { DOC_PILL, LeaveCardShell, PILL } from './LeaveCardShell';
import { LeaveFileLink } from './LeaveFileLink';
import type { LicensePhase, LicenseRow } from './types';

const PHASE_TONE: Record<LicensePhase, NavyTone> = {
  DRAFT: 'neutral',
  PENDING: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
  IN_PROGRESS: 'info',
  COMPLETED: 'neutral',
  CANCELLED: 'neutral',
};

function periodLabel(r: LicenseRow): string {
  const dates =
    r.startDate.slice(0, 10) === r.endDate.slice(0, 10)
      ? formatDate(r.startDate)
      : `${formatDate(r.startDate)} → ${formatDate(r.endDate)}`;
  return r.startTime && r.endTime
    ? `${dates} · ${r.startTime}–${r.endTime}`
    : dates;
}

function durationLabel(r: LicenseRow): string {
  if (r.durationMode === 'HOURS' && r.hours) return `${r.hours} h`;
  if (r.durationMode === 'HALF_AM' || r.durationMode === 'HALF_PM')
    return '½ dia';
  return `${r.workDays} dia(s)`;
}

export interface LicenseCardProps {
  row: LicenseRow;
  /** ADMIN/RH: mostra o aviso de validação na folha salarial. */
  showPayroll: boolean;
  onCancel: (id: number) => void;
  onDecide: (row: LicenseRow, action: 'APPROVE' | 'REJECT') => void;
  onOpen: (row: LicenseRow) => void;
}

export function LicenseCard({
  row: r,
  showPayroll,
  onCancel,
  onDecide,
  onOpen,
}: LicenseCardProps) {
  const hasProof = r.documents.length > 0 || r.hasDocument;
  const needsPayroll = showPayroll && r.payrollImpact === 'VALIDATION_REQUIRED';
  const missingProof =
    r.type.requiresDocument && !r.hasDocument && r.documents.length === 0;

  return (
    <LeaveCardShell
      user={r.user}
      title={r.type.name}
      badges={
        <>
          <NavyBadge tone={PHASE_TONE[r.phase]}>
            {PHASE_CFG[r.phase].label}
          </NavyBadge>
          {missingProof && (
            <NavyBadge tone="warning">Comprovativo em falta</NavyBadge>
          )}
        </>
      }
      infos={[
        { icon: CalendarDays, value: periodLabel(r), label: 'Período' },
        { icon: Clock, value: durationLabel(r), label: 'Duração' },
        {
          icon: Wallet,
          value: PAY_REGIME_LABELS[r.payRegime],
          label: 'Regime',
        },
        {
          icon: UserCheck,
          value: r.approver?.fullName ?? '—',
          label: 'Aprovador',
        },
      ]}
      recordedLabel={`Submetida em ${formatDateTime(r.submittedAt)}${
        r.registeredBy
          ? ` · registada por ${r.registeredBy.fullName ?? '—'}`
          : ''
      }`}
      footer={
        <>
          {hasProof && (
            <div className="flex flex-wrap items-center gap-1.5">
              {r.documents.map((d) => (
                <LeaveFileLink
                  key={d.id}
                  fileUrl={d.fileUrl}
                  className={DOC_PILL}
                >
                  <Paperclip
                    size={12}
                    strokeWidth={1.75}
                    className="shrink-0"
                  />
                  <span className="truncate">{d.name}</span>
                </LeaveFileLink>
              ))}
              {r.documents.length === 0 && (
                <span
                  className={`${PILL} border-[1.5px] border-brand/25 bg-white text-brand-muted`}
                  title="Documento protegido — acesso restrito ao titular e ao RH"
                >
                  <FileLock2
                    size={12}
                    strokeWidth={1.75}
                    className="shrink-0"
                  />
                  Protegido
                </span>
              )}
            </div>
          )}

          {hasProof && (
            <span
              aria-hidden
              className="hidden h-4 w-px bg-brand/20 sm:block"
            />
          )}

          <div className="flex flex-wrap items-center gap-1.5">
            {needsPayroll && (
              <span className={`${PILL} bg-warning-subtle text-warning-ink`}>
                <span
                  aria-hidden
                  className="h-2 w-2 shrink-0 rounded-full bg-warning"
                />
                Validar na folha salarial
              </span>
            )}
            <Button
              type="button"
              intent="secondary"
              size="sm"
              onClick={() => onOpen(r)}
              className="!h-6 !rounded-full !px-3 !text-xs"
            >
              Abrir
            </Button>
            {r.canApprove && (
              <>
                <Button
                  type="button"
                  intent="success"
                  size="sm"
                  onClick={() => onDecide(r, 'APPROVE')}
                  className="!h-6 gap-1.5 !rounded-full !px-3 !text-xs"
                >
                  <Check size={12} strokeWidth={1.75} className="shrink-0" />
                  Aprovar
                </Button>
                <Button
                  type="button"
                  intent="secondary"
                  size="sm"
                  onClick={() => onDecide(r, 'REJECT')}
                  className="!h-6 gap-1.5 !rounded-full border-danger/60 !px-3 !text-xs text-danger-ink hover:bg-danger-subtle"
                >
                  <X size={12} strokeWidth={1.75} className="shrink-0" />
                  Recusar
                </Button>
              </>
            )}
            {r.canCancel && (
              <Button
                type="button"
                intent="secondary"
                size="sm"
                onClick={() => onCancel(r.id)}
                className="!h-6 gap-1.5 !rounded-full border-danger/60 !px-3 !text-xs text-danger-ink hover:bg-danger-subtle"
              >
                <X size={12} strokeWidth={1.75} className="shrink-0" />
                Cancelar pedido
              </Button>
            )}
          </div>
        </>
      }
    />
  );
}
