// components/onboarding/TemplateCard.tsx
// Card de template do separador "Planos de Integração"
// (docs/prompt_claude_code_card_onboarding.md): cabeçalho azul com fachada
// de vidro desenhada em CSS (sem assets novos), título + estado, linha de
// métricas, divisor e linhas de informação. O clique no card (abre o
// TemplateDetailModal) continua a ser tratado por quem o usa.

import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  ListChecks,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { CATEGORY_CFG } from './constants';
import type { OnboardingTemplate } from './types';

// Fachada de vidro: gradiente azul + grelha de montantes finos + brilho
const HEADER_BG = [
  'linear-gradient(135deg, rgba(15,31,61,0.55) 0%, rgba(15,31,61,0.15) 60%, rgba(18,103,184,0.0) 100%)',
  'repeating-linear-gradient(90deg, rgba(255,255,255,0.10) 0 1px, transparent 1px 46px)',
  'repeating-linear-gradient(0deg, rgba(255,255,255,0.07) 0 1px, transparent 1px 38px)',
  'linear-gradient(160deg, #1267B8 0%, #0B4F9C 55%, #0F1F3D 100%)',
].join(', ');

function Metric({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 px-3 first:pl-0 last:pr-0 text-[15px] text-[#0F1F3D]">
      <Icon size={22} strokeWidth={1.75} className="shrink-0 text-[#49658A]" />
      <span className="whitespace-nowrap">{children}</span>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[14px] bg-[#EEF4FD] px-4 py-3 text-[15px] text-[#0F1F3D]">
      <Icon size={20} strokeWidth={1.75} className="shrink-0 text-[#1267B8]" />
      <span className="min-w-0 flex-1 truncate">{children}</span>
      <ChevronRight
        size={18}
        strokeWidth={1.75}
        className="shrink-0 text-[#1267B8]"
      />
    </div>
  );
}

export function TemplateCard({
  template: t,
  onOpen,
}: {
  template: OnboardingTemplate;
  onOpen: () => void;
}) {
  const category = t.department?.name ?? t.company ?? null;
  const description = t.objective || t.description;
  const tasks = t.tasks ?? [];

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      className="cursor-pointer overflow-hidden rounded-[20px] border border-[#D8E2F0] bg-white shadow-[0_4px_14px_rgba(21,47,89,0.08)] transition-shadow duration-150 hover:shadow-[0_10px_24px_rgba(21,47,89,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
    >
      <div
        className="flex min-h-[190px] flex-col justify-between p-7 text-white"
        style={{ background: HEADER_BG }}
      >
        <div className="flex items-start justify-between">
          <Users size={30} strokeWidth={1.75} aria-hidden />
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${t.active ? 'bg-[#16A765] text-white' : 'bg-white/20 text-white'}`}
          >
            <span aria-hidden className="h-2 w-2 rounded-full bg-white" />
            {t.active ? 'Activo' : 'Inactivo'}
          </span>
        </div>
        <div>
          <h3 className="font-display text-[24px] font-semibold leading-tight">
            {t.name}
            {t.version && t.version > 1 && (
              <span className="ml-2 font-mono text-sm font-normal text-white/70">
                v{t.version}
              </span>
            )}
          </h3>
          {category && (
            <p className="mt-1 text-[17px] text-white/80">{category}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-y-2 px-7 py-6 divide-x divide-[#E6ECF4]">
        <Metric icon={CalendarDays}>{t.durationDays} dias</Metric>
        <Metric icon={CheckCircle2}>{t._count?.tasks ?? 0} tarefas</Metric>
        <Metric icon={ListChecks}>{t._count?.plans ?? 0} planos</Metric>
      </div>

      <div className="mx-7 border-t border-[#E6ECF4]" />

      <div className="space-y-2 px-7 py-6">
        {description && (
          <p className="mb-3 line-clamp-2 text-xs text-[#49658A]">
            {description}
          </p>
        )}
        {t.position && <InfoRow icon={User}>{t.position.name}</InfoRow>}
        {t.unit && <InfoRow icon={GraduationCap}>{t.unit.name}</InfoRow>}

        {tasks.length > 0 && (
          <div className="space-y-1 pt-3">
            {tasks.slice(0, 3).map((task) => {
              const CatIcon = CATEGORY_CFG[task.category]?.icon;
              return (
                <div
                  key={task.id}
                  className="flex items-center gap-2 text-xs text-[#49658A]"
                >
                  <span>
                    {CatIcon ? <CatIcon size={13} strokeWidth={1.75} /> : '•'}
                  </span>
                  <span className="truncate">{task.title}</span>
                  <span className="ml-auto text-warning-ink">
                    +{task.xpReward}xp
                  </span>
                </div>
              );
            })}
            {tasks.length > 3 && (
              <div className="text-xs text-ink-faint">
                +{tasks.length - 3} mais tarefas…
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
