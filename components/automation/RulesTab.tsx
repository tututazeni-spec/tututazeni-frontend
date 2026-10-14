// components/automation/RulesTab.tsx
// "Todas as Automações" (docs/modulo_automation.md §3): tabela com os campos
// do spec, filtros enviados ao backend e acções por linha.

import { useDeferredValue, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Copy,
  Download,
  Eye,
  History,
  Pause,
  Play,
  PlayCircle,
  Pencil,
  Plus,
  Rocket,
  RefreshCw,
  Trash2,
  ArrowRight,
  Clock,
  User,
  Zap,
} from 'lucide-react';
import { useToast } from '@/providers/ToastProvider';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useConfirm } from '@/providers/ConfirmProvider';
import { apiClient } from '@/lib/apiClient';
import { reportError } from '@/lib/errorReporting';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type { BadgeProps } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Button, IconButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tooltip } from '@/components/ui/Tooltip';
import { cn } from '@/lib/cn';
import { ACTION_ITEMS, CATEGORY_LABEL, TRIGGER_LABEL } from './constants';
import { TEMPLATE_PALETTES, templateIcon } from './templateTheme';
import { CreateRuleModal } from './CreateRuleModal';
import type {
  AutomationRule,
  RuleStatus,
  RulesExportResponse,
  RunAllResponse,
} from './types';

const ALL = '__all__';

const MODULE_LABELS: Record<string, string> = {
  ATTENDANCE: 'Assiduidade',
  AUTOMATION: 'Automações',
  AVATAR_TRAINING: 'Treino com Avatar',
  CAREER: 'Carreira',
  CERTIFICATION: 'Certificação',
  COMPETENCIES: 'Competências',
  COURSES: 'Cursos',
  DEPARTMENTS: 'Departamentos',
  DEVELOPMENTPLANS: 'Planos de Desenvolvimento',
  DOCUMENTS: 'Documentos',
  EVALUATION: 'Avaliação',
  EVENTS: 'Eventos',
  INTEGRATIONS: 'Integrações',
  LEARNING_PATHS: 'Percursos de Aprendizagem',
  LEAVE: 'Licenças',
  NOTIFICATIONS: 'Notificações',
  ONBOARDING: 'Integração',
  PAYROLL: 'Salários',
  PDI: 'PDI',
  PROCESSES: 'Processos',
  ROLES: 'Perfis e Permissões',
  SCHEDULED: 'Agendadas',
  TRAININGS: 'Formações',
  USERS: 'Utilizadores',
};

const moduleLabel = (m: string): string =>
  MODULE_LABELS[m.toUpperCase().replace(/\s+/g, '_')] ?? m;

const STATUS_META: Record<
  RuleStatus,
  { label: string; intent: BadgeProps['intent'] }
> = {
  DRAFT: { label: 'Rascunho', intent: 'warning' },
  ACTIVE: { label: 'Activa', intent: 'success' },
  PAUSED: { label: 'Pausada', intent: 'neutral' },
  ERROR: { label: 'Com erro', intent: 'danger' },
};

const STATUS_DOT: Record<NonNullable<BadgeProps['intent']>, string> = {
  success: 'bg-emerald-400',
  warning: 'bg-amber-400',
  danger: 'bg-red-400',
  info: 'bg-sky-400',
  neutral: 'bg-slate-400',
};

const STATUS_ITEMS = [
  { value: ALL, label: 'Todos os estados' },
  ...Object.entries(STATUS_META).map(([value, m]) => ({
    value,
    label: m.label,
  })),
];

const CATEGORY_ITEMS = [
  { value: ALL, label: 'Todas as categorias' },
  ...Object.entries(CATEGORY_LABEL)
    .filter(([k]) => k !== 'AUTOMATION')
    .map(([value, label]) => ({ value, label })),
];

const fmt = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('pt') : '–';

const fmtDay = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('pt') : '–';

export interface RulesTabProps {
  /** Abre o Histórico de Execuções filtrado a uma regra (e, opcionalmente, só falhas). */
  onOpenHistory?: (ruleId: number, failedOnly?: boolean) => void;
  /** Abre o Construtor de Fluxos para editar a regra. */
  onEditRule?: (ruleId: number) => void;
  /** Abre o Construtor de Fluxos para uma nova automação. */
  onNewRule?: () => void;
}

export function RulesTab({
  onOpenHistory,
  onEditRule,
  onNewRule,
}: RulesTabProps = {}) {
  const notify = useToast();
  const confirm = useConfirm();
  const [running, setRunning] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [detail, setDetail] = useState<AutomationRule | null>(null);

  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search);
  const [module, setModule] = useState(ALL);
  const [category, setCategory] = useState(ALL);
  const [status, setStatus] = useState(ALL);
  const [withFailures, setWithFailures] = useState(false);
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');
  const [lastRunFrom, setLastRunFrom] = useState('');
  const [lastRunTo, setLastRunTo] = useState('');

  const params = {
    search: deferredSearch.trim() || undefined,
    module: module === ALL ? undefined : module,
    category: category === ALL ? undefined : category,
    status: status === ALL ? undefined : status,
    withFailures: withFailures || undefined,
    createdFrom: createdFrom ? `${createdFrom}T00:00:00.000Z` : undefined,
    createdTo: createdTo ? `${createdTo}T23:59:59.999Z` : undefined,
    lastRunFrom: lastRunFrom ? `${lastRunFrom}T00:00:00.000Z` : undefined,
    lastRunTo: lastRunTo ? `${lastRunTo}T23:59:59.999Z` : undefined,
  };
  const hasFilters = Object.values(params).some((v) => v !== undefined);

  const {
    data: rules = [],
    isLoading: loading,
    refetch,
  } = useApiQuery<AutomationRule[]>(
    queryKeys.automation.rules(params),
    '/automation/rules',
    { params, staleTime: STALE_TIME.DYNAMIC },
  );
  const { data: modules = [] } = useApiQuery<string[]>(
    queryKeys.automation.modules(),
    '/automation/modules',
    { staleTime: STALE_TIME.STATIC },
  );

  const moduleItems = useMemo(
    () => [
      { value: ALL, label: 'Todos os módulos' },
      ...modules.map((m) => ({ value: m, label: moduleLabel(m) })),
    ],
    [modules],
  );

  const load = () => {
    void refetch();
  };

  const clearFilters = () => {
    setSearch('');
    setModule(ALL);
    setCategory(ALL);
    setStatus(ALL);
    setWithFailures(false);
    setCreatedFrom('');
    setCreatedTo('');
    setLastRunFrom('');
    setLastRunTo('');
  };

  const toggle = async (id: number) => {
    try {
      await apiClient.patch(`/automation/rules/${id}/toggle`, {});
    } catch (e) {
      reportError(e, { source: 'RulesTab.toggle' });
      notify({ title: 'Não foi possível alterar a regra', intent: 'danger' });
    }
    load();
  };
  const publish = async (r: AutomationRule) => {
    try {
      await apiClient.post(`/automation/rules/${r.id}/publish`, {});
      notify({ title: 'Automação publicada', intent: 'success' });
    } catch (e) {
      reportError(e, { source: 'RulesTab.publish' });
      notify({
        title: 'Não foi possível publicar — abra o editor e valide o fluxo',
        intent: 'danger',
      });
    }
    load();
  };
  const clone = async (id: number) => {
    try {
      await apiClient.post(`/automation/rules/${id}/clone`, {});
    } catch (e) {
      reportError(e, { source: 'RulesTab.clone' });
      notify({ title: 'Não foi possível clonar a regra', intent: 'danger' });
    }
    load();
  };
  const remove = async (id: number) => {
    if (
      await confirm({
        title: 'Remover regra?',
        message:
          'O histórico de execuções fica associado a registos de auditoria e retenção.',
        confirmLabel: 'Remover',
        destructive: true,
      })
    ) {
      try {
        await apiClient.delete(`/automation/rules/${id}`);
      } catch (e) {
        reportError(e, { source: 'RulesTab.remove' });
        notify({ title: 'Não foi possível remover a regra', intent: 'danger' });
      }
      load();
    }
  };
  const runOne = async (r: AutomationRule) => {
    // §3: a execução manual exige confirmação — pode alterar dados ou
    // desencadear comunicações externas.
    const ok = await confirm({
      title: `Executar "${r.name}" agora?`,
      message:
        'A regra vai ser executada de imediato e pode alterar dados ou enviar comunicações a utilizadores.',
      confirmLabel: 'Executar',
    });
    if (!ok) return;
    try {
      await apiClient.post(`/automation/rules/${r.id}/run`, {});
      notify({ title: 'Regra executada', intent: 'success' });
    } catch (e) {
      reportError(e, { source: 'RulesTab.runOne' });
      notify({ title: 'A execução da regra falhou', intent: 'danger' });
    }
    load();
  };
  const runAll = async () => {
    setRunning(true);
    try {
      const r = await apiClient.post<RunAllResponse>('/automation/run', {});
      notify({
        title: `Executadas: ${r.executed} regras`,
        intent: 'success',
      });
    } catch (e) {
      reportError(e, { source: 'RulesTab.runAll' });
      notify({
        title: 'Não foi possível executar as regras',
        intent: 'danger',
      });
    } finally {
      setRunning(false);
    }
  };
  const exportCsv = async () => {
    setExporting(true);
    try {
      const { filename, content } = await apiClient.get<RulesExportResponse>(
        '/automation/rules/export',
        { params },
      );
      const url = URL.createObjectURL(
        new Blob([content], { type: 'text/csv;charset=utf-8' }),
      );
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      reportError(e, { source: 'RulesTab.exportCsv' });
      notify({
        title: 'Não foi possível exportar a listagem',
        intent: 'danger',
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-body text-sm text-ink-muted">
          {rules.length} regra(s) · {rules.filter((r) => r.active).length}{' '}
          activas
        </span>
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            intent="secondary"
            onClick={exportCsv}
            disabled={exporting}
          >
            <Download size={14} strokeWidth={1.75} />
            Exportar
          </Button>
          <Button
            size="sm"
            intent="secondary"
            onClick={runAll}
            disabled={running}
          >
            {running ? (
              <RefreshCw
                size={14}
                strokeWidth={1.75}
                className="animate-spin"
              />
            ) : (
              <Play size={14} strokeWidth={1.75} />
            )}
            Executar Todas
          </Button>
          <Button
            size="sm"
            onClick={() => (onNewRule ? onNewRule() : setShowCreate(true))}
          >
            <Plus size={14} strokeWidth={1.75} />
            Nova automação
          </Button>
        </div>
      </div>

      <div className="space-y-2 rounded-card border border-border bg-surface p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            type="search"
            placeholder="Pesquisar por nome ou código…"
            aria-label="Pesquisar por nome ou código"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="min-w-[160px] flex-1"
          />
          <Select
            items={moduleItems}
            value={module}
            onValueChange={setModule}
            className="min-w-[160px]"
          />
          <Select
            items={CATEGORY_ITEMS}
            value={category}
            onValueChange={setCategory}
            className="min-w-[160px]"
          />
          <Select
            items={STATUS_ITEMS}
            value={status}
            onValueChange={setStatus}
            className="min-w-[150px]"
          />
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 font-body text-xs text-ink-muted">
            Criada de
            <Input
              type="date"
              value={createdFrom}
              onChange={(e) => setCreatedFrom(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 font-body text-xs text-ink-muted">
            Criada até
            <Input
              type="date"
              value={createdTo}
              onChange={(e) => setCreatedTo(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 font-body text-xs text-ink-muted">
            Última execução de
            <Input
              type="date"
              value={lastRunFrom}
              onChange={(e) => setLastRunFrom(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 font-body text-xs text-ink-muted">
            Última execução até
            <Input
              type="date"
              value={lastRunTo}
              onChange={(e) => setLastRunTo(e.target.value)}
            />
          </label>
          <label className="flex items-center gap-2 pb-2 font-body text-sm text-ink">
            <input
              type="checkbox"
              checked={withFailures}
              onChange={(e) => setWithFailures(e.target.checked)}
            />
            Com falhas
          </label>
          {hasFilters && (
            <Button size="sm" intent="ghost" onClick={clearFilters}>
              Limpar filtros
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <Skeleton
          rows={4}
          wrapperClassName="space-y-3"
          itemClassName="skeleton-shimmer h-16 rounded-card"
        />
      ) : rules.length === 0 ? (
        <EmptyState
          title={hasFilters ? 'Nenhuma automação encontrada' : 'Sem automações'}
          description={
            hasFilters
              ? 'Nenhuma regra corresponde aos filtros aplicados.'
              : 'Cria uma regra ou usa os modelos do Construtor de Fluxos para começar.'
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rules.map((r) => {
            const st =
              STATUS_META[
                r.status ?? (r.draft ? 'DRAFT' : r.active ? 'ACTIVE' : 'PAUSED')
              ];
            const failed = r.stats?.failed ?? 0;
            const actionLabel =
              ACTION_ITEMS.find((a) => a.value === r.action)?.label ?? r.action;
            const iconBtn =
              'text-[#0F1F3D] hover:bg-[#0F1F3D]/10 hover:text-[#0F1F3D] focus-visible:ring-[#0F1F3D]/40';
            const dot = STATUS_DOT[st.intent ?? 'neutral'];
            const c = TEMPLATE_PALETTES[r.id % TEMPLATE_PALETTES.length];
            const Icon = templateIcon(r);
            const hasTrigger = Boolean(TRIGGER_LABEL[r.trigger]);
            return (
              <li
                key={r.id}
                className={cn(
                  'group flex flex-col overflow-hidden rounded-2xl border bg-surface shadow-resting transition-shadow duration-150 hover:shadow-hover',
                  c.border,
                  !r.active && !r.draft && 'opacity-80',
                )}
              >
                <div
                  className={`relative h-20 overflow-hidden bg-gradient-to-br ${c.header}`}
                >
                  <div
                    className="absolute -right-6 -top-10 h-36 w-36 rounded-full bg-white/15"
                    aria-hidden
                  />
                  <div
                    className="absolute -bottom-10 right-24 h-24 w-24 rounded-full bg-white/10"
                    aria-hidden
                  />
                  <Icon
                    size={72}
                    strokeWidth={1.25}
                    className="absolute -bottom-2 right-5 rotate-12 text-white/25"
                    aria-hidden
                  />
                  <span className="absolute right-2.5 top-2.5 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-0.5 font-body text-[11px] font-medium text-ink shadow-sm">
                    <span
                      aria-hidden
                      className={cn('h-2 w-2 rounded-full', dot)}
                    />
                    {st.label}
                  </span>
                </div>

                <div className="relative -mt-6 flex flex-1 flex-col gap-3 px-4 pb-4">
                  <span
                    className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-lg ring-[3px] ring-surface ${c.tile}`}
                    aria-hidden
                  >
                    <Icon size={22} strokeWidth={1.75} />
                  </span>

                  <div className="min-w-0">
                    <h3 className="break-words font-display text-base font-bold leading-snug text-[#0F1F3D]">
                      {r.name}
                    </h3>
                    <p className="font-data text-[11px] text-ink-muted">
                      {r.code ?? `#${r.id}`}
                    </p>
                    {r.description && (
                      <p className="mt-1 line-clamp-2 font-body text-xs leading-relaxed text-ink-muted">
                        {r.description}
                      </p>
                    )}
                  </div>

                  <dl className={`space-y-2 rounded-xl px-3 py-2.5 ${c.panel}`}>
                    {hasTrigger && (
                      <div className="flex items-start gap-2.5">
                        <Zap
                          size={14}
                          strokeWidth={1.75}
                          className={`mt-0.5 shrink-0 ${c.accent}`}
                          aria-hidden
                        />
                        <dt className="w-12 shrink-0 font-body text-xs text-ink-muted">
                          Quando
                        </dt>
                        <dd className="min-w-0 break-words font-body text-xs font-semibold text-[#0F1F3D]">
                          {TRIGGER_LABEL[r.trigger]}
                        </dd>
                      </div>
                    )}
                    <div
                      className={cn(
                        'flex items-start gap-2.5',
                        hasTrigger && `border-t pt-2.5 ${c.divider}`,
                      )}
                    >
                      <ArrowRight
                        size={14}
                        strokeWidth={1.75}
                        className={`mt-0.5 shrink-0 ${c.accent}`}
                        aria-hidden
                      />
                      <dt className="w-12 shrink-0 font-body text-xs text-ink-muted">
                        Então
                      </dt>
                      <dd className="min-w-0 break-words font-body text-xs font-semibold text-[#0F1F3D]">
                        {actionLabel}
                      </dd>
                    </div>
                  </dl>

                  <div className={`rounded-xl border px-3 py-2.5 ${c.border}`}>
                    <p className="flex items-center gap-1.5 font-body text-xs text-ink-muted">
                      <Clock size={12} strokeWidth={1.75} aria-hidden />
                      Última execução
                    </p>
                    <p className="mt-0.5 font-display text-sm font-bold text-[#0F1F3D]">
                      {fmt(r.lastRunAt)}
                    </p>
                    {r.stats && r.stats.total > 0 && (
                      <div className="mt-2">
                        <div className="mb-1 flex justify-between font-body text-xs text-ink-muted">
                          <span>
                            {r.stats.success} de {r.stats.total} com sucesso
                          </span>
                          <span className="font-semibold text-[#0F1F3D]">
                            {r.stats.successRate}%
                          </span>
                        </div>
                        <div
                          className="h-1.5 overflow-hidden rounded-full bg-[#0F1F3D]/15"
                          role="img"
                          aria-label={`Taxa de sucesso ${r.stats.successRate}%`}
                        >
                          <div
                            className="h-full rounded-full bg-[#0F1F3D]"
                            style={{ width: `${r.stats.successRate}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <dl className="grid grid-cols-2 divide-x divide-border font-body text-xs text-[#0F1F3D]">
                    <div className="pr-3">
                      <dt className="mb-0.5 text-ink-muted">Módulo</dt>
                      <dd className="break-words">
                        {r.module ? moduleLabel(r.module) : '–'}
                        {r.category && (
                          <span className="block text-ink-muted">
                            {CATEGORY_LABEL[r.category] ?? r.category}
                          </span>
                        )}
                      </dd>
                    </div>
                    <div className="pl-3">
                      <dt className="mb-0.5 text-ink-muted">Criada</dt>
                      <dd>
                        {fmtDay(r.createdAt)}
                        <span className="block text-ink-muted">
                          Actualizada {fmtDay(r.updatedAt)}
                        </span>
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-auto flex items-center gap-2 border-t border-border pt-2.5 font-body text-xs text-[#0F1F3D]">
                    {r.ownerName ? (
                      <>
                        <Avatar
                          name={r.ownerName}
                          url={r.ownerAvatarUrl ?? undefined}
                          size="sm"
                        />
                        <span className="min-w-0 truncate">
                          <span className="block text-[10px] text-ink-muted">
                            Responsável
                          </span>
                          {r.ownerName}
                        </span>
                      </>
                    ) : (
                      <span className="text-ink-muted">Sem responsável</span>
                    )}
                  </div>

                  <div className="-ml-2 flex flex-wrap gap-0.5">
                    <Tooltip content="Ver detalhes">
                      <IconButton
                        icon={Eye}
                        label="Ver detalhes"
                        intent="ghost"
                        className={iconBtn}
                        onClick={() => setDetail(r)}
                      />
                    </Tooltip>
                    {onEditRule && (
                      <Tooltip content="Editar regra">
                        <IconButton
                          icon={Pencil}
                          label="Editar regra"
                          intent="ghost"
                          className={iconBtn}
                          onClick={() => onEditRule(r.id)}
                        />
                      </Tooltip>
                    )}
                    {r.draft ? (
                      <Tooltip content="Publicar regra">
                        <IconButton
                          icon={Rocket}
                          label="Publicar regra"
                          intent="ghost"
                          className={iconBtn}
                          onClick={() => publish(r)}
                        />
                      </Tooltip>
                    ) : (
                      <>
                        <Tooltip
                          content={r.active ? 'Pausar regra' : 'Activar regra'}
                        >
                          <IconButton
                            icon={r.active ? Pause : Play}
                            label={r.active ? 'Pausar regra' : 'Activar regra'}
                            intent="ghost"
                            className={iconBtn}
                            onClick={() => toggle(r.id)}
                          />
                        </Tooltip>
                        <Tooltip content="Executar manualmente">
                          <IconButton
                            icon={PlayCircle}
                            label="Executar manualmente"
                            intent="ghost"
                            className={iconBtn}
                            onClick={() => runOne(r)}
                          />
                        </Tooltip>
                      </>
                    )}
                    <Tooltip content="Consultar histórico">
                      <IconButton
                        icon={History}
                        label="Consultar histórico"
                        intent="ghost"
                        className={iconBtn}
                        onClick={() => onOpenHistory?.(r.id)}
                      />
                    </Tooltip>
                    {failed > 0 && (
                      <Tooltip content="Ver erros">
                        <IconButton
                          icon={AlertTriangle}
                          label="Ver erros"
                          intent="ghost"
                          className={iconBtn}
                          onClick={() => onOpenHistory?.(r.id, true)}
                        />
                      </Tooltip>
                    )}
                    <Tooltip content="Duplicar regra">
                      <IconButton
                        icon={Copy}
                        label="Duplicar regra"
                        intent="ghost"
                        className={iconBtn}
                        onClick={() => clone(r.id)}
                      />
                    </Tooltip>
                    <Tooltip content="Remover regra">
                      <IconButton
                        icon={Trash2}
                        label="Remover regra"
                        intent="ghost"
                        className={iconBtn}
                        onClick={() => remove(r.id)}
                      />
                    </Tooltip>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {showCreate && <CreateRuleModal onClose={() => setShowCreate(false)} />}

      {detail && (
        <Modal open onOpenChange={(open) => !open && setDetail(null)}>
          <ModalContent
            title={detail.name}
            description={detail.code ?? `Regra #${detail.id}`}
          >
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 font-body text-sm">
              <dt className="text-ink-muted">Descrição</dt>
              <dd>{detail.description || '–'}</dd>
              <dt className="text-ink-muted">Módulo</dt>
              <dd>{detail.module ? moduleLabel(detail.module) : '–'}</dd>
              <dt className="text-ink-muted">Gatilho</dt>
              <dd>{TRIGGER_LABEL[detail.trigger] ?? detail.trigger}</dd>
              <dt className="text-ink-muted">Acção</dt>
              <dd className="font-data">{detail.action}</dd>
              <dt className="text-ink-muted">Responsável</dt>
              <dd>{detail.ownerName ?? '–'}</dd>
              <dt className="text-ink-muted">Prioridade</dt>
              <dd>{detail.priority ?? 0}</dd>
              <dt className="text-ink-muted">Última execução</dt>
              <dd>
                {fmt(detail.lastRunAt)}
                {detail.lastRunStatus ? ` (${detail.lastRunStatus})` : ''}
              </dd>
              <dt className="text-ink-muted">Execuções</dt>
              <dd>
                {detail.stats?.total ?? 0} · {detail.stats?.success ?? 0} com
                sucesso · {detail.stats?.failed ?? 0} falhadas
              </dd>
              <dt className="text-ink-muted">Notas</dt>
              <dd>{detail.notes || '–'}</dd>
            </dl>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
}
