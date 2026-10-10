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

// Paleta por template (escolhida pelo id, estável entre renders): cada card
// tem a sua cor. [início, meio, fim do gradiente, cor de destaque das linhas]
const PALETTE: Array<[string, string, string, string]> = [
  ['#1267B8', '#0B4F9C', '#0F1F3D', '#1267B8'], // azul
  ['#0E9AA7', '#0B7A86', '#0F3D45', '#0E8794'], // turquesa
  ['#2E9E6B', '#1E7D52', '#0F3D2A', '#1E8A5A'], // verde
  ['#7B5CD6', '#5B3FB5', '#2A1B63', '#6A4CC4'], // roxo
  ['#D9822B', '#B5651A', '#5A3009', '#C27220'], // âmbar
  ['#D6455D', '#B02D45', '#5E1424', '#C23A52'], // carmim
  ['#3F6FD8', '#2B4FB0', '#14235E', '#3A63C6'], // índigo
  ['#5B7083', '#46586A', '#1E2A36', '#51657A'], // ardósia
];

// Fachada de vidro: gradiente + grelha de montantes finos + brilho
function headerBackground([c1, c2, c3]: [string, string, string, string]) {
  return [
    'linear-gradient(135deg, rgba(15,31,61,0.35) 0%, rgba(15,31,61,0.10) 60%, rgba(255,255,255,0) 100%)',
    'repeating-linear-gradient(90deg, rgba(255,255,255,0.10) 0 1px, transparent 1px 46px)',
    'repeating-linear-gradient(0deg, rgba(255,255,255,0.07) 0 1px, transparent 1px 38px)',
    `linear-gradient(160deg, ${c1} 0%, ${c2} 55%, ${c3} 100%)`,
  ].join(', ');
}

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
      <span>{children}</span>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  accent,
  children,
}: {
  icon: LucideIcon;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[14px] bg-[#EEF4FD] px-4 py-3 text-[15px] text-[#0F1F3D]">
      <Icon
        size={20}
        strokeWidth={1.75}
        className="shrink-0"
        style={{ color: accent }}
      />
      <span className="min-w-0 flex-1 break-words">{children}</span>
      <ChevronRight
        size={18}
        strokeWidth={1.75}
        className="shrink-0"
        style={{ color: accent }}
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
  const palette = PALETTE[Math.abs(t.id) % PALETTE.length];
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
        style={{ background: headerBackground(palette) }}
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
          <p className="mb-3 break-words text-xs text-[#49658A]">
            {description}
          </p>
        )}
        {t.position && (
          <InfoRow icon={User} accent={palette[3]}>
            {t.position.name}
          </InfoRow>
        )}
        {t.unit && (
          <InfoRow icon={GraduationCap} accent={palette[3]}>
            {t.unit.name}
          </InfoRow>
        )}

        {tasks.length > 0 && (
          <div className="space-y-1 pt-3">
            {tasks.map((task) => {
              const CatIcon = CATEGORY_CFG[task.category]?.icon;
              return (
                <div
                  key={task.id}
                  className="flex items-start gap-2 text-xs text-[#49658A]"
                >
                  <span>
                    {CatIcon ? <CatIcon size={13} strokeWidth={1.75} /> : '•'}
                  </span>
                  <span className="min-w-0 break-words">{task.title}</span>
                  <span className="ml-auto shrink-0 text-warning-ink">
                    +{task.xpReward}xp
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
