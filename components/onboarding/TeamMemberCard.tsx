// components/onboarding/TeamMemberCard.tsx
// Cartão de um membro da equipa de apoio (gestor / buddy / RH). Mesmo desenho
// no detalhe do plano (PlanDetailModal) e em "O meu plano > Equipa".

import type { KeyboardEvent } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';

export interface TeamMemberPerson {
  fullName: string;
  email?: string | null;
  avatarUrl: string | null;
}

export type TeamRole = 'manager' | 'buddy' | 'hr';

export function TeamMemberCard({
  label,
  person,
  icon: Icon,
  mailSubject,
  onAssign,
}: {
  label: string;
  person: TeamMemberPerson | null;
  icon: LucideIcon;
  mailSubject: string;
  /** Quando definido, o cartão é clicável e abre a atribuição da pessoa. */
  onAssign?: () => void;
}) {
  const interactive = onAssign
    ? {
        role: 'button' as const,
        tabIndex: 0,
        onClick: onAssign,
        onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => {
          if (e.target !== e.currentTarget) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onAssign();
          }
        },
        'aria-label': `${label}: ${person ? person.fullName : 'atribuir'}`,
      }
    : {};
  return (
    <div
      {...interactive}
      className={`flex items-center gap-4 rounded-[20px] p-3 ${onAssign ? 'cursor-pointer hover:bg-surface-sunken' : ''}`}
    >
      {person ? (
        <Avatar
          name={person.fullName}
          url={person.avatarUrl ?? undefined}
          size="md"
          className="!h-[88px] !w-[88px] shrink-0 !text-2xl"
        />
      ) : (
        <span className="flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-full bg-brand-dark text-white">
          <Icon size={40} strokeWidth={1.75} />
        </span>
      )}
      <div className="min-w-0">
        <div className="font-body text-sm font-bold text-brand-dark">
          {label}
        </div>
        <div className="break-words font-body text-sm text-ink">
          {person ? person.fullName : 'Não atribuído'}
        </div>
        {person?.email && (
          <a
            onClick={(e) => e.stopPropagation()}
            href={`mailto:${person.email}?subject=${encodeURIComponent(mailSubject)}`}
            className="font-body text-xs text-primary underline-offset-2 hover:underline"
          >
            Enviar mensagem
          </a>
        )}
      </div>
    </div>
  );
}
