// components/onboarding/TeamMemberCard.tsx
// Cartão de um membro da equipa de apoio (gestor / buddy / RH). Mesmo desenho
// no detalhe do plano (PlanDetailModal) e em "O meu plano > Equipa".

import type { LucideIcon } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';

export interface TeamMemberPerson {
  fullName: string;
  email?: string | null;
  avatarUrl: string | null;
}

export function TeamMemberCard({
  label,
  person,
  icon: Icon,
  mailSubject,
}: {
  label: string;
  person: TeamMemberPerson | null;
  icon: LucideIcon;
  mailSubject: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[20px] border border-brand-line bg-surface-sunken p-3 shadow-[0_6px_18px_rgba(21,47,89,0.08)]">
      {person ? (
        <Avatar
          name={person.fullName}
          url={person.avatarUrl ?? undefined}
          size="md"
          className="!h-11 !w-11 shrink-0"
        />
      ) : (
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-dark text-white">
          <Icon size={20} strokeWidth={1.75} />
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
