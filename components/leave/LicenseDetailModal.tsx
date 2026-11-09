// components/leave/LicenseDetailModal.tsx
// Ficha da licença (aba "Licenças"), com o desenho da ficha do Formador
// (DetailCardParts): cabeçalho com avatar e estado, duas colunas de dados e
// rodapé com "Fechar" e, a quem pode decidir, "Recusar" / "Aprovar". Abre ao
// carregar em "Abrir" no cartão; usa os dados já carregados na lista.

'use client';

import {
  CalendarDays,
  ClipboardList,
  Clock,
  FileLock2,
  MessageSquareText,
  Paperclip,
  Send,
  User,
  UserCheck,
  Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  DetailDivider,
  DetailHeader,
  DetailInfoRow,
  DetailSectionRow,
} from '@/components/ui/DetailCardParts';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatDate, formatDateTime } from '@/lib/format';
import { PAY_REGIME_LABELS, PHASE_CFG } from './constants';
import { LeaveFileLink } from './LeaveFileLink';
import type { LicenseRow } from './types';

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
  return `${r.workDays} dia(s) úteis · ${r.calendarDays} dia(s) de calendário`;
}

export interface LicenseDetailModalProps {
  row: LicenseRow;
  onClose: () => void;
  onDecide: (row: LicenseRow, action: 'APPROVE' | 'REJECT') => void;
}

export function LicenseDetailModal({
  row: r,
  onClose,
  onDecide,
}: LicenseDetailModalProps) {
  const protectedProof = r.hasDocument && r.documents.length === 0;

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={`Licença — ${r.user.fullName}`}
        hideHeading
        navyClose
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <DetailHeader
          name={r.user.fullName}
          avatarUrl={r.user.avatarUrl}
          subtitle={
            [
              r.user.employeeNumber && `N.º ${r.user.employeeNumber}`,
              r.user.department?.name,
            ]
              .filter(Boolean)
              .join(' · ') || undefined
          }
        >
          <span className="text-sm font-semibold uppercase tracking-wide text-ink">
            {r.type.name}
          </span>
          <StatusBadge value={r.phase} map={PHASE_CFG} variant="pill" />
        </DetailHeader>

        <div className="mt-6 grid gap-6 md:grid-cols-[1fr_auto_1fr]">
          <div className="space-y-4">
            <DetailInfoRow icon={ClipboardList} label="Tipo de licença">
              {r.type.name}
            </DetailInfoRow>
            <DetailInfoRow icon={CalendarDays} label="Período">
              {periodLabel(r)}
            </DetailInfoRow>
            <DetailInfoRow icon={Clock} label="Duração">
              {durationLabel(r)}
            </DetailInfoRow>
            <DetailInfoRow icon={Wallet} label="Regime">
              {PAY_REGIME_LABELS[r.payRegime]}
            </DetailInfoRow>
            {r.payrollImpact !== undefined && (
              <DetailInfoRow icon={Wallet} label="Impacto salarial">
                {r.payrollImpact === 'VALIDATION_REQUIRED'
                  ? 'Validar na folha salarial'
                  : 'Sem indicação'}
              </DetailInfoRow>
            )}
            <DetailInfoRow icon={UserCheck} label="Aprovador">
              {r.approver?.fullName ?? '—'}
            </DetailInfoRow>
            <DetailInfoRow icon={Send} label="Submetida em">
              {formatDateTime(r.submittedAt)}
            </DetailInfoRow>
            {r.registeredBy && (
              <DetailInfoRow icon={User} label="Registada por">
                {r.registeredBy.fullName ?? '—'}
              </DetailInfoRow>
            )}
          </div>

          <DetailDivider />

          <div className="space-y-5">
            <DetailSectionRow icon={MessageSquareText} label="Motivo">
              {r.reason ? (
                <span className="whitespace-pre-wrap">{r.reason}</span>
              ) : r.type.isSensitive ? (
                <span className="inline-flex items-center gap-1.5 text-ink-faint">
                  <FileLock2 size={14} strokeWidth={1.75} /> Acesso restrito ao
                  colaborador e ao RH.
                </span>
              ) : (
                '—'
              )}
            </DetailSectionRow>
            <DetailSectionRow icon={Paperclip} label="Comprovativos">
              {r.documents.length > 0 ? (
                <ul className="space-y-0.5">
                  {r.documents.map((d) => (
                    <li key={d.id}>
                      <LeaveFileLink
                        fileUrl={d.fileUrl}
                        className="inline-flex items-center gap-1 underline"
                      >
                        <Paperclip size={13} strokeWidth={1.75} />
                        {d.name}
                      </LeaveFileLink>
                    </li>
                  ))}
                </ul>
              ) : protectedProof ? (
                <span className="inline-flex items-center gap-1.5 text-ink-faint">
                  <FileLock2 size={14} strokeWidth={1.75} /> Protegido — acesso
                  restrito ao colaborador e ao RH.
                </span>
              ) : (
                '—'
              )}
            </DetailSectionRow>
          </div>
        </div>

        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <Button
            intent="secondary"
            className="flex-1 justify-center"
            onClick={onClose}
          >
            Fechar
          </Button>
          {r.canApprove && (
            <>
              <Button
                intent="danger"
                className="flex-1 justify-center"
                onClick={() => onDecide(r, 'REJECT')}
              >
                Recusar
              </Button>
              <Button
                intent="success"
                className="flex-1 justify-center"
                onClick={() => onDecide(r, 'APPROVE')}
              >
                Aprovar
              </Button>
            </>
          )}
        </div>
      </ModalContent>
    </Modal>
  );
}
