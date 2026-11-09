// components/leave/AbsenceCard.tsx
// Cartão de ausência (aba "Gestão de Ausências"), com o mesmo desenho do cartão
// de licença (LeaveCardShell): identidade, tipo e estado de justificação à
// esquerda; Data / Horário / Duração / Validador no painel branco e, por baixo,
// o registo, o comprovativo, a assiduidade associada e o botão "Abrir".

import {
  CalendarDays,
  Clock,
  FileLock2,
  Hourglass,
  Paperclip,
  UserCheck,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { NavyBadge, type NavyTone } from '@/components/courses/NavyCard';
import { formatDate, formatDateTime } from '@/lib/format';
import {
  ABSENCE_SOURCE_LABELS,
  ATTENDANCE_STATUS_LABELS,
  JUSTIFICATION_CFG,
  absenceTypeLabel,
} from './constants';
import { DOC_PILL, LeaveCardShell, PILL } from './LeaveCardShell';
import { LeaveFileLink } from './LeaveFileLink';
import type { AbsenceJustificationStatus, AbsenceRow } from './types';

const STATUS_TONE: Record<AbsenceJustificationStatus, NavyTone> = {
  TO_JUSTIFY: 'warning',
  SUBMITTED: 'info',
  VALIDATED: 'success',
  REJECTED: 'danger',
};

function durationLabel(a: AbsenceRow): string {
  return a.durationHours ? `${a.durationHours} h` : `${a.durationDays} dia(s)`;
}

export interface AbsenceCardProps {
  row: AbsenceRow;
  /** ADMIN/RH: mostra o aviso de análise do Payroll. */
  showPayroll: boolean;
  onOpen: (id: number) => void;
  onCancel: (id: number) => void;
}

export function AbsenceCard({
  row: a,
  showPayroll,
  onOpen,
  onCancel,
}: AbsenceCardProps) {
  const protectedProof = a.hasAttachment && a.attachments.length === 0;
  const hasProof = a.attachments.length > 0 || protectedProof;
  const attendance = a.attendance
    ? (ATTENDANCE_STATUS_LABELS[a.attendance.status] ?? a.attendance.status)
    : null;

  return (
    <LeaveCardShell
      user={a.user}
      title={absenceTypeLabel(a)}
      badges={
        <>
          <NavyBadge tone={STATUS_TONE[a.justificationStatus]}>
            {JUSTIFICATION_CFG[a.justificationStatus].label}
          </NavyBadge>
          <NavyBadge tone="neutral">{ABSENCE_SOURCE_LABELS[a.source]}</NavyBadge>
        </>
      }
      infos={[
        { icon: CalendarDays, value: formatDate(a.date), label: 'Data' },
        {
          icon: Clock,
          value:
            a.startTime && a.endTime
              ? `${a.startTime}–${a.endTime}`
              : 'Dia inteiro',
          label: 'Horário',
        },
        { icon: Hourglass, value: durationLabel(a), label: 'Duração' },
        {
          icon: UserCheck,
          value: a.validator?.fullName ?? '—',
          label: 'Validador',
        },
      ]}
      recordedLabel={`Registada em ${formatDateTime(a.createdAt)} · por ${
        a.createdBy.fullName ?? '—'
      }`}
      footer={
        <>
          {hasProof && (
            <div className="flex flex-wrap items-center gap-1.5">
              {a.attachments.map((d) => (
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
              {protectedProof && (
                <span
                  className={`${PILL} border-[1.5px] border-brand/25 bg-white text-brand-muted`}
                  title="Comprovativo protegido — acesso restrito ao titular e ao RH"
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
          {attendance && (
            <span
              className={`${PILL} border-[1.5px] border-brand/25 bg-white text-brand`}
              title="Estado do registo de assiduidade associado"
            >
              Assiduidade: {attendance}
            </span>
          )}
          {showPayroll && a.payrollReview && (
            <span className={`${PILL} bg-warning-subtle text-warning-ink`}>
              <span
                aria-hidden
                className="h-2 w-2 shrink-0 rounded-full bg-warning"
              />
              Análise Payroll
            </span>
          )}
          <Button
            type="button"
            intent="secondary"
            size="sm"
            onClick={() => onOpen(a.id)}
            className="!h-6 !rounded-full !px-3 !text-xs"
          >
            Abrir
          </Button>
          {a.actions.cancel && (
            <Button
              type="button"
              intent="secondary"
              size="sm"
              onClick={() => onCancel(a.id)}
              className="!h-6 gap-1.5 !rounded-full border-danger/60 !px-3 !text-xs text-danger-ink hover:bg-danger-subtle"
            >
              <X size={12} strokeWidth={1.75} className="shrink-0" />
              Cancelar registo
            </Button>
          )}
        </>
      }
    />
  );
}
