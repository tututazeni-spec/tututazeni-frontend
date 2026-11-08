// components/leave/LicenseCard.tsx
// Cartão de licença (aba "Licenças"), desenho do "licença.jpeg" em azul marinho:
// à esquerda a identidade (avatar, colaborador), o tipo em destaque e o estado;
// à direita um painel branco com Período / Duração / Regime / Aprovador separados
// por linhas e, por baixo, a data de submissão, os comprovativos e as acções.

import type { LucideIcon } from 'lucide-react';
import {
  CalendarDays,
  Clock,
  FileLock2,
  Paperclip,
  UserCheck,
  Wallet,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { NavyBadge, type NavyTone } from '@/components/courses/NavyCard';
import { formatDate, formatDateTime, getInitials } from '@/lib/format';
import { PAY_REGIME_LABELS, PHASE_CFG } from './constants';
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

interface InfoCellProps {
  icon: LucideIcon;
  value: string;
  label: string;
}

function InfoCell({ icon: Icon, value, label }: InfoCellProps) {
  return (
    <div className="flex min-w-0 items-start gap-2">
      <Icon
        size={16}
        strokeWidth={1.75}
        className="mt-0.5 shrink-0 text-brand"
      />
      <div className="min-w-0">
        <div className="break-words font-body text-xs font-bold leading-tight text-brand">
          {value}
        </div>
        <div className="font-body text-[11px] leading-tight text-brand-muted">
          {label}
        </div>
      </div>
    </div>
  );
}

/** Base comum das pílulas do rodapé: anexos, aviso de folha salarial e cancelar. */
const PILL =
  'inline-flex h-6 max-w-full items-center gap-1.5 rounded-full px-3 font-body text-xs font-semibold leading-none';

/** Anexo: pílula com contorno azul marinho. */
const DOC_PILL = `${PILL} border-[1.5px] border-brand/70 bg-white text-brand hover:bg-brand/5`;

export interface LicenseCardProps {
  row: LicenseRow;
  /** ADMIN/RH: mostra o aviso de validação na folha salarial. */
  showPayroll: boolean;
  onCancel: (id: number) => void;
}

export function LicenseCard({
  row: r,
  showPayroll,
  onCancel,
}: LicenseCardProps) {
  const infos: InfoCellProps[] = [
    { icon: CalendarDays, value: periodLabel(r), label: 'Período' },
    { icon: Clock, value: durationLabel(r), label: 'Duração' },
    { icon: Wallet, value: PAY_REGIME_LABELS[r.payRegime], label: 'Regime' },
    { icon: UserCheck, value: r.approver?.fullName ?? '—', label: 'Aprovador' },
  ];
  const hasProof = r.documents.length > 0 || r.hasDocument;
  const needsPayroll = showPayroll && r.payrollImpact === 'VALIDATION_REQUIRED';
  const hasActions = needsPayroll || r.canCancel;
  const missingProof =
    r.type.requiresDocument && !r.hasDocument && r.documents.length === 0;

  return (
    <div
      className="flex flex-col gap-2 overflow-hidden rounded-[20px] p-2 text-white shadow-[0_8px_24px_rgba(15,31,61,0.25)] lg:flex-row"
      style={{
        background:
          'linear-gradient(135deg, #1E3A5F 0%, #0F1F3D 55%, #0A1630 100%)',
      }}
    >
      <div className="flex min-w-0 flex-col justify-center gap-1 px-2 py-0.5 lg:w-[30%] lg:shrink-0">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-[11px] font-bold">
            {getInitials(r.user.fullName, '?')}
          </span>
          <span className="truncate font-body text-xs font-semibold">
            {r.user.fullName}
          </span>
        </div>
        <div className="min-w-0">
          <h3 className="break-words font-body text-base font-extrabold uppercase leading-tight tracking-wide">
            {r.type.name}
          </h3>
          {r.user.employeeNumber && (
            <p className="truncate font-body text-xs text-white/80">
              N.º {r.user.employeeNumber}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <NavyBadge tone={PHASE_TONE[r.phase]}>
            {PHASE_CFG[r.phase].label}
          </NavyBadge>
          {missingProof && (
            <NavyBadge tone="warning">Comprovativo em falta</NavyBadge>
          )}
        </div>
      </div>

      <div className="min-w-0 flex-1 rounded-[16px] bg-white px-3 py-1.5 text-brand">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4 xl:gap-0">
          {infos.map((info, i) => (
            <div
              key={info.label}
              className={
                i > 0 ? 'xl:border-l xl:border-brand/25 xl:pl-3' : 'xl:pr-3'
              }
            >
              <InfoCell {...info} />
            </div>
          ))}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-t border-brand/15 pt-1.5">
          <span className="inline-flex items-center gap-1.5 font-body text-[11px] text-brand">
            <Clock size={12} strokeWidth={1.75} className="shrink-0" />
            Submetida em {formatDateTime(r.submittedAt)}
            {r.registeredBy &&
              ` · registada por ${r.registeredBy.fullName ?? '—'}`}
          </span>

          <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1.5">
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

            {hasProof && hasActions && (
              <span
                aria-hidden
                className="hidden h-4 w-px bg-brand/20 sm:block"
              />
            )}

            {hasActions && (
              <div className="flex flex-wrap items-center gap-1.5">
                {needsPayroll && (
                  <span
                    className={`${PILL} bg-warning-subtle text-warning-ink`}
                  >
                    <span
                      aria-hidden
                      className="h-2 w-2 shrink-0 rounded-full bg-warning"
                    />
                    Validar na folha salarial
                  </span>
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
