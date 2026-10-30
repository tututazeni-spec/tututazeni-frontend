// components/automation/EventsCatalogPanel.tsx
// Integração por eventos (docs/modulo_automation.md §5): catálogo de eventos
// por módulo — o que já pode ser gatilho vs. o que o spec propõe mas nenhum
// módulo emite ainda — e o registo dos eventos recebidos (identificador,
// correlação, regras accionadas).

'use client';

import { useState } from 'react';
import {
  Award,
  Bot,
  Briefcase,
  CalendarClock,
  CalendarDays,
  ClipboardCheck,
  Compass,
  FileText,
  GraduationCap,
  Layers,
  LineChart,
  Network,
  Palmtree,
  Plug,
  Route,
  ShieldCheck,
  Target,
  Timer,
  UserCheck,
  UserPlus,
  Users,
  Wallet,
  Workflow,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { cn } from '@/lib/cn';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SearchInput } from '@/components/ui/SearchInput';
import { Skeleton } from '@/components/ui/Skeleton';
import type {
  AutomationEventRow,
  CatalogModule,
  EventCatalog,
  Paginated,
} from './types';
import { formatDateTimeNumeric } from '@/lib/format';

const STATUS_INTENT = {
  PROCESSED: 'success',
  NO_RULES: 'neutral',
  REJECTED: 'danger',
} as const;
const STATUS_LABEL: Record<string, string> = {
  PROCESSED: 'Processado',
  NO_RULES: 'Sem regras',
  REJECTED: 'Rejeitado',
};

type FilterId = 'all' | 'available' | 'active';
const FILTERS: Array<{ id: FilterId; label: string }> = [
  { id: 'all', label: 'Todos' },
  { id: 'available', label: 'Com eventos disponíveis' },
  { id: 'active', label: 'Com regras activas' },
];

const MODULE_ICON: Record<string, LucideIcon> = {
  USERS: Users,
  DEPARTMENTS: Network,
  ROLES: ShieldCheck,
  COURSES: GraduationCap,
  LEARNING_PATHS: Route,
  EVALUATION: ClipboardCheck,
  COMPETENCIES: Target,
  PDI: Compass,
  CAREER: LineChart,
  ONBOARDING: UserPlus,
  ATTENDANCE: UserCheck,
  LEAVE: Palmtree,
  PAYROLL: Wallet,
  CERTIFICATION: Award,
  AVATAR_TRAINING: Bot,
  PROCESSES: Layers,
  SCHEDULED: Timer,
  EVENTS: CalendarDays,
  TRAININGS: Briefcase,
  DOCUMENTS: FileText,
  INTEGRATIONS: Plug,
  AUTOMATION: Zap,
};

// Todos os cartões usam a cor do módulo Utilizadores.
const CARD_COLOR = '#1E3F7A';

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();
}

function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

function withAlpha(hex: string, alpha: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

function ModuleCard({ mod }: { mod: CatalogModule }) {
  const Icon = MODULE_ICON[mod.module] ?? CalendarClock;
  const color = CARD_COLOR;
  const total = mod.events.length;
  const available = mod.events.filter((e) => e.implemented).length;
  const activeRules = mod.events.reduce((n, e) => n + e.activeRules, 0);

  // Gradiente diagonal na cor do módulo + sombra difusa da mesma cor.
  return (
    <article
      className="flex h-full flex-col gap-2 rounded-card border p-2 text-brand transition-transform duration-200 hover:z-10 hover:scale-[1.02] motion-reduce:transition-none motion-reduce:hover:scale-100"
      style={{
        borderColor: withAlpha(color, 0.25),
        backgroundImage: `linear-gradient(135deg, ${withAlpha(color, 0.06)} 0%, ${withAlpha(color, 0.12)} 55%, ${withAlpha(color, 0.32)} 100%)`,
        boxShadow: `0 10px 28px -10px ${withAlpha(color, 0.45)}, 0 2px 6px ${withAlpha(color, 0.12)}`,
      }}
    >
      <header className="flex h-[52px] items-center gap-2 px-1 pt-0.5">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control text-white shadow-md"
          style={{
            backgroundColor: color,
            boxShadow: `0 6px 14px -4px ${withAlpha(color, 0.6)}`,
          }}
        >
          <Icon size={18} strokeWidth={1.75} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h4
            className="truncate font-display text-sm font-semibold leading-tight"
            style={{ color }}
          >
            {mod.label}
          </h4>
          <p className="line-clamp-2 font-body text-micro leading-tight text-brand/70">
            {available} de {total} eventos disponíveis
            {activeRules > 0 &&
              ` · ${plural(activeRules, 'regra activa', 'regras activas')}`}
          </p>
        </div>
      </header>

      <div
        className="flex flex-1 flex-col rounded-control bg-surface p-2"
        style={{ boxShadow: `0 1px 4px ${withAlpha(color, 0.15)}` }}
      >
        <ul className="shrink-0">
          {mod.events.map((e) => (
            <li
              key={e.key}
              className="flex h-6 items-center gap-2 font-body text-xs"
            >
              <span
                aria-hidden
                className="h-2 w-2 shrink-0 rounded-full border"
                style={{
                  borderColor: color,
                  backgroundColor: e.implemented ? color : 'transparent',
                }}
              />
              <span
                className={cn(
                  'min-w-0 flex-1 truncate',
                  e.implemented ? 'text-brand' : 'text-brand/55',
                )}
                title={e.label}
              >
                {e.label}
              </span>
              <span className="sr-only">
                {e.implemented ? 'Disponível' : 'Proposto'}
              </span>
              <span className="flex w-[72px] shrink-0 justify-center">
                {e.activeRules > 0 && (
                  <span
                    className="rounded-full px-2 py-0.5 font-data text-micro"
                    style={{ backgroundColor: withAlpha(color, 0.1), color }}
                  >
                    {plural(e.activeRules, 'regra', 'regras')}
                  </span>
                )}
              </span>
              <span className="w-[40px] shrink-0 text-right font-data text-micro text-brand/70">
                {e.events30d > 0 ? `${e.events30d}/30d` : ''}
              </span>
            </li>
          ))}
        </ul>

        <div className="mt-auto flex flex-wrap content-start gap-1.5 pt-2">
          {mod.actions.map((a, i) => (
            <span
              key={a}
              className="rounded-control border px-2 py-1 font-body text-micro font-medium"
              style={
                i === 0
                  ? {
                      backgroundColor: color,
                      borderColor: color,
                      color: '#fff',
                      boxShadow: `0 4px 10px -3px ${withAlpha(color, 0.55)}`,
                    }
                  : {
                      backgroundColor: withAlpha(color, 0.07),
                      borderColor: withAlpha(color, 0.25),
                      color,
                    }
              }
            >
              {a}
            </span>
          ))}
        </div>
      </div>
    </article>
  );
}

export function EventsCatalogPanel() {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterId>('all');
  const { data: catalog, isLoading } = useApiQuery<EventCatalog>(
    queryKeys.automation.eventCatalog(),
    '/automation/events/catalog',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const eventsParams = { limit: 10 };
  const { data: recent } = useApiQuery<Paginated<AutomationEventRow>>(
    queryKeys.automation.events(eventsParams),
    '/automation/events',
    { params: eventsParams, staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading) return <Skeleton rows={3} />;
  if (!catalog) return null;

  const s = catalog.summary;
  const q = normalize(query);
  const modules = catalog.modules.filter((m) => {
    if (filter === 'active' && !m.events.some((e) => e.activeRules > 0))
      return false;
    if (filter === 'available' && !m.events.some((e) => e.implemented))
      return false;
    if (!q) return true;
    return (
      normalize(m.label).includes(q) ||
      m.events.some((e) => normalize(e.label).includes(q))
    );
  });

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="font-display text-base font-semibold text-ink">
          Eventos por módulo
        </h3>
        <p className="font-body text-sm text-ink-muted">
          Cada módulo publica acontecimentos e a automação decide se há regras a
          executar. Só os eventos <strong>disponíveis</strong> podem ser
          gatilho; os <strong>propostos</strong> são a especificação e têm de
          ser emitidos no backend do respectivo módulo.
        </p>
        <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: 'Módulos', value: s.modules },
            { label: 'Eventos disponíveis', value: s.implemented },
            { label: 'Eventos propostos', value: s.proposed },
            { label: 'Eventos com regras activas', value: s.listened },
          ].map((k) => (
            <div
              key={k.label}
              className="rounded-card border p-2"
              style={{
                borderColor: withAlpha(CARD_COLOR, 0.25),
                backgroundImage: `linear-gradient(135deg, ${withAlpha(CARD_COLOR, 0.06)} 0%, ${withAlpha(CARD_COLOR, 0.12)} 55%, ${withAlpha(CARD_COLOR, 0.32)} 100%)`,
                boxShadow: `0 10px 28px -10px ${withAlpha(CARD_COLOR, 0.45)}, 0 2px 6px ${withAlpha(CARD_COLOR, 0.12)}`,
              }}
            >
              <div
                className="rounded-control bg-surface px-3 py-2"
                style={{
                  boxShadow: `0 1px 4px ${withAlpha(CARD_COLOR, 0.15)}`,
                }}
              >
                <dd
                  className="font-display text-2xl font-semibold"
                  style={{ color: CARD_COLOR }}
                >
                  {k.value}
                </dd>
                <dt className="font-body text-xs text-brand/70">{k.label}</dt>
              </div>
            </div>
          ))}
        </dl>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          variant="underline"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Procurar módulo ou evento"
          className="min-w-[240px] flex-1"
        />
        <div
          role="group"
          aria-label="Filtrar módulos"
          className="inline-flex flex-wrap rounded-full border border-border bg-surface-sunken p-0.5"
        >
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                'rounded-full px-3 py-1 font-body text-xs transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary',
                filter === f.id
                  ? 'bg-primary text-white'
                  : 'text-ink-muted hover:text-ink',
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {modules.length === 0 ? (
        <EmptyState
          icon={Workflow}
          title="Nenhum módulo encontrado"
          description="Altere a pesquisa ou o filtro para ver outros módulos."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {modules.map((m) => (
            <ModuleCard key={m.module} mod={m} />
          ))}
        </div>
      )}

      <div>
        <h3 className="mb-2 font-display text-base font-semibold text-ink">
          Eventos recebidos recentemente
        </h3>
        {recent?.data?.length ? (
          <div className="overflow-x-auto rounded-card border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-sunken text-xs uppercase text-ink-faint">
                <tr>
                  <th className="px-3 py-2">Quando</th>
                  <th className="px-3 py-2">Módulo</th>
                  <th className="px-3 py-2">Evento</th>
                  <th className="px-3 py-2">Registo</th>
                  <th className="px-3 py-2">Regras</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2">Correlação</th>
                </tr>
              </thead>
              <tbody>
                {recent.data.map((e) => (
                  <tr key={e.id} className="border-t border-border">
                    <td className="whitespace-nowrap px-3 py-2 text-xs">
                      {formatDateTimeNumeric(e.occurredAt)}
                    </td>
                    <td className="px-3 py-2">{e.module}</td>
                    <td className="px-3 py-2 font-data text-xs">{e.type}</td>
                    <td className="px-3 py-2 text-xs">
                      {e.recordType
                        ? `${e.recordType}${e.recordId ? ` #${e.recordId}` : ''}`
                        : '–'}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {e.executed}/{e.matchedRules}
                    </td>
                    <td className="px-3 py-2">
                      <Badge
                        intent={
                          STATUS_INTENT[
                            e.status as keyof typeof STATUS_INTENT
                          ] ?? 'neutral'
                        }
                        title={e.note ?? undefined}
                      >
                        {STATUS_LABEL[e.status] ?? e.status}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 font-data text-micro text-ink-faint">
                      {e.correlationId.slice(0, 8)}
                      {e.depth > 0 ? ` · nível ${e.depth}` : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon={Workflow}
            title="Sem eventos recebidos"
            description="Quando um módulo publicar um evento, aparece aqui com a correlação e as regras accionadas."
          />
        )}
      </div>
    </div>
  );
}
