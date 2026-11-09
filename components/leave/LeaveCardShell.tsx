// components/leave/LeaveCardShell.tsx
// Estrutura visual partilhada pelos cards do módulo Férias e Ausências
// (licenças e ausências), desenho do "licença.jpeg" em azul marinho: à esquerda
// a identidade (avatar, colaborador), o título em destaque e os estados; à
// direita um painel branco com quatro dados separados por linhas e, por baixo,
// a linha de registo e as acções. Cada módulo decide o conteúdo de cada zona.

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Clock } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';

export interface InfoCellProps {
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

/** Base comum das pílulas do rodapé: anexos, avisos e acções. */
export const PILL =
  'inline-flex h-6 max-w-full items-center gap-1.5 rounded-full px-3 font-body text-xs font-semibold leading-none';

/** Anexo: pílula com contorno azul marinho. */
export const DOC_PILL = `${PILL} border-[1.5px] border-brand/70 bg-white text-brand hover:bg-brand/5`;

export interface LeaveCardShellProps {
  user: {
    fullName: string;
    avatarUrl?: string | null;
    employeeNumber: string | null;
  };
  title: string;
  /** Estados (NavyBadge) por baixo do título. */
  badges: ReactNode;
  /** Os quatro dados do painel branco. */
  infos: InfoCellProps[];
  /** Texto da linha de registo, por baixo dos dados. */
  recordedLabel: string;
  /** Comprovativos e acções, à direita da linha de registo. */
  footer: ReactNode;
}

export function LeaveCardShell({
  user,
  title,
  badges,
  infos,
  recordedLabel,
  footer,
}: LeaveCardShellProps) {
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
          <Avatar
            name={user.fullName}
            url={user.avatarUrl ?? undefined}
            size="sm"
          />
          <span className="truncate font-body text-xs font-semibold">
            {user.fullName}
          </span>
        </div>
        <div className="min-w-0">
          <h3 className="break-words font-body text-base font-extrabold uppercase leading-tight tracking-wide">
            {title}
          </h3>
          {user.employeeNumber && (
            <p className="truncate font-body text-xs text-white/80">
              N.º {user.employeeNumber}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">{badges}</div>
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
            {recordedLabel}
          </span>
          <div className="flex flex-wrap items-center justify-end gap-x-2 gap-y-1.5">
            {footer}
          </div>
        </div>
      </div>
    </div>
  );
}
