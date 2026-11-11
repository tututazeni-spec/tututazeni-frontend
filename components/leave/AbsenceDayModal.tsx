// components/leave/AbsenceDayModal.tsx
// Janela que abre ao clicar num dia do calendário de ausências: todos os
// colaboradores de férias e todos os ausentes (licenças e faltas) nessa data.
// Usa as entradas já carregadas pelo calendário, por isso respeita o âmbito e a
// privacidade do backend: quem não é o titular nem o RH vê só "Férias" ou
// "Indisponível", nunca o motivo.

'use client';

import { CalendarDays, Palmtree, UserX } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { formatDate } from '@/lib/format';
import { VACATION_CODE } from './constants';
import type { CalendarEntry } from './types';

const FALLBACK_COLOR = '#2563EB';

function periodOf(e: CalendarEntry): string {
  if (e.partial && e.startTime && e.endTime)
    return `${e.startTime}–${e.endTime}`;
  return e.startDate === e.endDate
    ? 'Dia inteiro'
    : `${formatDate(e.startDate)} → ${formatDate(e.endDate)}`;
}

function PersonRow({ entry: e }: { entry: CalendarEntry }) {
  const color = e.color ?? FALLBACK_COLOR;
  return (
    <li
      className="flex items-center gap-3 rounded-card border border-brand/10 bg-white p-2.5"
      style={{ borderLeft: `4px solid ${color}` }}
    >
      <Avatar name={e.userName} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-brand">
          {e.userName}
        </p>
        <p className="truncate text-xs text-brand-muted">
          {e.department ?? 'Sem departamento'}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold text-brand">{e.typeName}</p>
        <p className="text-xs text-brand-muted">{periodOf(e)}</p>
      </div>
    </li>
  );
}

function Group({
  icon: Icon,
  title,
  entries,
}: {
  icon: LucideIcon;
  title: string;
  entries: CalendarEntry[];
}) {
  return (
    <section className="space-y-2">
      <h4 className="flex items-center gap-2 text-sm font-bold text-brand">
        <Icon size={16} strokeWidth={1.75} />
        {title}
        <span className="rounded-pill bg-brand/[0.08] px-2 py-0.5 text-xs font-semibold">
          {entries.length}
        </span>
      </h4>
      {entries.length === 0 ? (
        <p className="pl-6 text-sm text-ink-faint">Ninguém neste dia.</p>
      ) : (
        <ul className="space-y-2">
          {entries.map((e) => (
            <PersonRow key={e.id} entry={e} />
          ))}
        </ul>
      )}
    </section>
  );
}

export interface AbsenceDayModalProps {
  /** Dia em formato AAAA-MM-DD. */
  day: string;
  /** Entradas do calendário que cobrem esse dia. */
  entries: CalendarEntry[];
  /** Nome do feriado, se o dia for feriado. */
  holiday?: string;
  onClose: () => void;
}

export function AbsenceDayModal({
  day,
  entries,
  holiday,
  onClose,
}: AbsenceDayModalProps) {
  const sorted = [...entries].sort((a, b) =>
    a.userName.localeCompare(b.userName, 'pt'),
  );
  const vacation = sorted.filter((e) => e.typeCode === VACATION_CODE);
  const absent = sorted.filter((e) => e.typeCode !== VACATION_CODE);
  const people = new Set(entries.map((e) => e.userId)).size;

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        navyHeader
        title={formatDate(day, {
          weekday: 'long',
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })}
        description={
          people === 0
            ? 'Ninguém ausente neste dia.'
            : `${people} colaborador(es) ausente(s) ou de férias`
        }
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="mt-4 space-y-5">
          {holiday && (
            <p className="flex items-center gap-2 text-sm font-semibold text-success-ink">
              <CalendarDays size={16} strokeWidth={1.75} />
              Feriado: {holiday}
            </p>
          )}
          {entries.length === 0 ? (
            <EmptyState
              variant="inline"
              title="Sem férias nem ausências neste dia"
            />
          ) : (
            <>
              <Group icon={Palmtree} title="De férias" entries={vacation} />
              <Group icon={UserX} title="Ausentes" entries={absent} />
            </>
          )}
        </div>
      </ModalContent>
    </Modal>
  );
}
