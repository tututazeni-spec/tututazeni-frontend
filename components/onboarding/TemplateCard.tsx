// components/onboarding/TemplateCard.tsx
// Card de template do separador "Planos de Integração" no desenho de "card
// para cursos criados" (public/images): fundo em gradiente azul escuro na cor
// da paleta do template, topo com a imagem "folha de pagamento" tingida com a cor do template e a etiqueta de estado, métricas com ícones, linhas de
// informação, e rodapé com barra de destaque + título + botão circular. O
// clique no card (abre o TemplateDetailModal) é tratado por quem o usa.

import {
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  ListChecks,
  User,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import type { OnboardingTemplate } from './types';

// Paleta por template (escolhida pelo id, estável entre renders): cada card
// tem a sua cor. [início, meio, fim do gradiente, cor de destaque das linhas]
export const PALETTE: Array<[string, string, string, string]> = [
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
export function headerBackground([c1, c2, c3]: [
  string,
  string,
  string,
  string,
]) {
  return [
    'linear-gradient(135deg, rgba(15,31,61,0.35) 0%, rgba(15,31,61,0.10) 60%, rgba(255,255,255,0) 100%)',
    'repeating-linear-gradient(90deg, rgba(255,255,255,0.10) 0 1px, transparent 1px 46px)',
    'repeating-linear-gradient(0deg, rgba(255,255,255,0.07) 0 1px, transparent 1px 38px)',
    `linear-gradient(160deg, ${c1} 0%, ${c2} 55%, ${c3} 100%)`,
  ].join(', ');
}

// Imagem do topo do card (public/images/folha de pagamento.jpg).
const TEMPLATE_IMAGE = '/images/folha%20de%20pagamento.jpg';

function Metric({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 text-[15px] font-medium text-white">
      <Icon size={22} strokeWidth={1.5} className="shrink-0 text-[#9DB8E0]" />
      <span className="min-w-0 break-words">{children}</span>
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
      className={cn(
        'relative flex h-full cursor-pointer flex-col overflow-hidden rounded-panel border border-white/10 text-white shadow-[0_4px_14px_rgba(21,47,89,0.25)] transition-all duration-200 ease-out hover:scale-[1.03] hover:shadow-[0_10px_24px_rgba(21,47,89,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 motion-reduce:hover:scale-100',
      )}
      style={{
        background: `linear-gradient(165deg, ${palette[1]} 0%, ${palette[2]} 60%, ${palette[2]} 100%)`,
      }}
    >
      {/* Topo: fachada de vidro que se funde no azul do card */}
      <div
        className="relative min-h-[170px] shrink-0"
        style={{
          backgroundImage: `url("${TEMPLATE_IMAGE}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Tinge a imagem com a cor própria de cada template */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: `linear-gradient(160deg, ${palette[0]}26 0%, ${palette[1]}26 100%)`,
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 h-24"
          style={{
            background: `linear-gradient(180deg, transparent 0%, ${palette[2]} 100%)`,
          }}
        />
        <span className="absolute right-5 top-5 inline-flex items-center gap-2 rounded-full bg-[#0F1F3D]/80 px-4 py-1.5 text-sm font-semibold text-white">
          <span
            aria-hidden
            className={`h-2.5 w-2.5 rounded-full ${t.active ? 'bg-[#16A765]' : 'bg-white/50'}`}
          />
          {t.active ? 'Activo' : 'Inactivo'}
        </span>
      </div>

      {/* Métricas e informação */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-4 px-6 pb-2 pt-1">
        <Metric icon={CalendarDays}>{t.durationDays} dias</Metric>
        <Metric icon={CheckCircle2}>{t._count?.tasks ?? 0} tarefas</Metric>
        <Metric icon={ListChecks}>{t._count?.plans ?? 0} planos</Metric>
        {t.position && <Metric icon={User}>{t.position.name}</Metric>}
        {t.unit && <Metric icon={GraduationCap}>{t.unit.name}</Metric>}
      </div>

      {description && (
        <div className="px-6 pt-3">
          <ul className="space-y-1.5 text-sm text-white/80">
            {description
              .split(/\r?\n+|(?<=[.;!?])\s+(?=[A-ZÀ-Ý])/)
              .map((line) => line.replace(/^[\s\-•*]+/, '').trim())
              .filter(Boolean)
              .map((line, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span
                    aria-hidden
                    className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#FFD28A]"
                  />
                  <span className="min-w-0 break-words">{line}</span>
                </li>
              ))}
          </ul>
        </div>
      )}

      {/* Rodapé: barra de destaque + título + botão circular */}
      <div className="mt-auto flex items-center gap-4 px-6 pb-6 pt-6">
        <span
          aria-hidden
          className="h-16 w-1 shrink-0 rounded-full"
          style={{ background: palette[3] }}
        />
        <div className="min-w-0 flex-1">
          <h3 className="break-words font-body text-2xl font-extrabold leading-tight">
            {t.name}
            {t.version && t.version > 1 && (
              <span className="ml-2 font-mono text-sm font-normal text-white/70">
                v{t.version}
              </span>
            )}
          </h3>
          {category && (
            <p className="mt-1 break-words text-[15px] text-white/70">
              {category}
            </p>
          )}
        </div>
        <span
          aria-hidden
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-white"
          style={{ background: palette[0] }}
        >
          <ChevronRight size={22} strokeWidth={2.25} />
        </span>
      </div>
    </div>
  );
}
