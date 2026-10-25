// components/ui/ProfileRoiCard.tsx
// Card de perfil no desenho do "ROI Total" (public/images/roi total.jpeg,
// roi-impact/RoiTotalCard): degradé azul-marinho, título em maiúsculas com
// ícone, avatar no lugar do anel, colunas separadas por divisórias finas e
// faixa de nota em baixo. Usado no cabeçalho de evaluation360 (Visão Geral) e
// de career (Minha Carreira).

import type { ReactNode } from 'react';
import { Info, type LucideIcon } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';

export interface ProfileRoiStat {
  label: string;
  value: ReactNode;
  /** Cor do valor e do ponto (estado), como o "Crítico" do ROI Total. */
  color?: string;
}

interface ProfileRoiCardProps {
  kicker: string;
  kickerIcon: LucideIcon;
  name: string;
  avatarUrl?: string | null;
  subtitle?: string;
  stats: ProfileRoiStat[];
  note?: ReactNode;
}

export function ProfileRoiCard({
  kicker,
  kickerIcon: KickerIcon,
  name,
  avatarUrl,
  subtitle,
  stats,
  note,
}: ProfileRoiCardProps) {
  return (
    <div className="overflow-hidden rounded-panel bg-gradient-to-br from-brand via-[#0B3A75] to-[#0A2A57] p-4 text-white shadow-[0_8px_24px_rgba(15,31,61,0.25)]">
      <div className="mb-2 flex items-center gap-3">
        <KickerIcon className="h-6 w-6" strokeWidth={1.8} aria-hidden />
        <h3 className="font-display text-base font-bold uppercase tracking-wide">
          {kicker}
        </h3>
      </div>

      <div className="flex flex-col items-center gap-4 md:flex-row md:gap-8">
        <div className="shrink-0 rounded-full p-1.5 ring-[6px] ring-[#2F80ED]/70">
          <Avatar name={name} url={avatarUrl ?? undefined} size="lg" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="font-display text-xl font-bold leading-snug">{name}</p>
          {subtitle && (
            <p className="mb-2 font-body text-sm text-white/70">{subtitle}</p>
          )}
          <div className="mt-2 flex flex-wrap items-stretch gap-x-8 gap-y-2">
            {stats.map((s, i) => (
              <div key={s.label} className="flex items-stretch gap-8">
                {i > 0 && <div className="hidden w-px bg-white/20 sm:block" />}
                <div>
                  <p className="font-body text-sm text-white/70">{s.label}</p>
                  <p
                    className="mt-1 flex items-center gap-2 font-display text-xl font-bold"
                    style={s.color ? { color: s.color } : undefined}
                  >
                    {s.color && (
                      <span
                        className="h-4 w-4 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                    )}
                    {s.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {note && (
        <div className="mt-3 flex items-center gap-3 rounded-card bg-white/10 px-4 py-2 font-body text-sm">
          <Info className="h-5 w-5 shrink-0 text-[#7CC4FF]" aria-hidden />
          <span>{note}</span>
        </div>
      )}
    </div>
  );
}
