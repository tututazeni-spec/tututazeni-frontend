// components/automation/RulesTab.tsx
// "Todas as Automações" (docs/modulo_automation.md §3): tabela com os campos
// do spec, filtros enviados ao backend e acções por linha.

import { useDeferredValue, useMemo, useRef, useState } from 'react';
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
} from 'lucide-react';
import { useToast } from '@/providers/ToastProvider';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useConfirm } from '@/providers/ConfirmProvider';
import { apiClient } from '@/lib/apiClient';
import { reportError } from '@/lib/errorReporting';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Badge, type BadgeProps } from '@/components/ui/Badge';
import { Button, IconButton } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import {
  CATEGORY_INTENT,
  CATEGORY_LABEL,
  TRIGGER_LABEL,
} from './constants';
import { CreateRuleModal } from './CreateRuleModal';
import type {
  AutomationRule,
  RuleStatus,
  RulesExportResponse,
  RunAllResponse,
} from './types';

const ALL = '__all__';

const STATUS_META: Record<
  RuleStatus,
  { label: string; intent: BadgeProps['intent'] }
> = {
  DRAFT: { label: 'Rascunho', intent: 'warning' },
  ACTIVE: { label: 'Activa', intent: 'success' },
  PAUSED: { label: 'Pausada', intent: 'neutral' },
  ERROR: { label: 'Com erro', intent: 'danger' },
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
  const [ownerId, setOwnerId] = useState(ALL);
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
    ownerId: ownerId === ALL ? undefined : ownerId,
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

  // Responsáveis vistos até agora — as opções não encolhem quando o filtro
  // de responsável reduz a lista.
  const ownersSeen = useRef(new Map<string, string>());
  for (const r of rules) {
    if (r.ownerId)
      ownersSeen.current.set(r.ownerId, r.ownerName ?? `#${r.ownerId}`);
  }
  const ownerItems = useMemo(
    () => [
      { value: ALL, label: 'Todos os responsáveis' },
      ...[...ownersSeen.current.entries()].map(([value, label]) => ({
        value,
        label,
      })),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rules],
  );
  const moduleItems = useMemo(
    () => [
      { value: ALL, label: 'Todos os módulos' },
      ...modules.map((m) => ({ value: m, label: m })),
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
    setOwnerId(ALL);
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
      notify({ title: 'Não foi possível exportar a listagem', intent: 'danger' });
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
          <Select
            items={ownerItems}
            value={ownerId}
            onValueChange={setOwnerId}
            className="min-w-[180px]"
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
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Nome</TableHeaderCell>
              <TableHeaderCell>Módulo</TableHeaderCell>
              <TableHeaderCell>Categoria</TableHeaderCell>
              <TableHeaderCell>Gatilho</TableHeaderCell>
              <TableHeaderCell>Responsável</TableHeaderCell>
              <TableHeaderCell>Estado</TableHeaderCell>
              <TableHeaderCell>Última execução</TableHeaderCell>
              <TableHeaderCell>Sucesso</TableHeaderCell>
              <TableHeaderCell>Criada</TableHeaderCell>
              <TableHeaderCell>Actualizada</TableHeaderCell>
              <TableHeaderCell>
                <span className="sr-only">Acções</span>
              </TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rules.map((r) => {
              const st = STATUS_META[
                r.status ?? (r.draft ? 'DRAFT' : r.active ? 'ACTIVE' : 'PAUSED')
              ];
              return (
                <TableRow key={r.id} className={r.active ? '' : 'opacity-70'}>
                  <TableCell className="min-w-[220px]">
                    <p className="font-semibold">{r.name}</p>
                    <p className="font-data text-[10px] text-ink-faint">
                      {r.code ?? `#${r.id}`}
                    </p>
                    {r.description && (
                      <p className="line-clamp-2 text-xs text-ink-muted">
                        {r.description}
                      </p>
                    )}
                  </TableCell>
                  <TableCell>{r.module ?? '–'}</TableCell>
                  <TableCell>
                    {r.category ? (
                      <Badge
                        intent={CATEGORY_INTENT[r.category] ?? 'neutral'}
                        dot={false}
                      >
                        {CATEGORY_LABEL[r.category] ?? r.category}
                      </Badge>
                    ) : (
                      '–'
                    )}
                  </TableCell>
                  <TableCell className="min-w-[160px] text-xs">
                    {TRIGGER_LABEL[r.trigger] ?? r.trigger}
                    <span className="block font-data text-[10px] text-ink-faint">
                      → {r.action}
                    </span>
                  </TableCell>
                  <TableCell>{r.ownerName ?? '–'}</TableCell>
                  <TableCell>
                    <Badge intent={st.intent}>{st.label}</Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs">
                    {fmt(r.lastRunAt)}
                  </TableCell>
                  <TableCell className="text-xs">
                    {r.stats && r.stats.total > 0 ? (
                      <>
                        <span className="font-semibold">
                          {r.stats.successRate}%
                        </span>
                        <span className="block text-[10px] text-ink-faint">
                          {r.stats.success}/{r.stats.total}
                        </span>
                      </>
                    ) : (
                      '–'
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs">
                    {fmt(r.createdAt)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-xs">
                    {fmt(r.updatedAt)}
                  </TableCell>
                  <TableCell>
                    <div className="flex shrink-0 gap-1">
                      <IconButton
                        icon={Eye}
                        label="Ver detalhes"
                        intent="ghost"
                        onClick={() => setDetail(r)}
                      />
                      {onEditRule && (
                        <IconButton
                          icon={Pencil}
                          label="Editar regra"
                          intent="ghost"
                          onClick={() => onEditRule(r.id)}
                        />
                      )}
                      {r.draft ? (
                        <IconButton
                          icon={Rocket}
                          label="Publicar regra"
                          intent="ghost"
                          onClick={() => publish(r)}
                        />
                      ) : (
                        <>
                          <IconButton
                            icon={r.active ? Pause : Play}
                            label={r.active ? 'Pausar regra' : 'Activar regra'}
                            intent="ghost"
                            onClick={() => toggle(r.id)}
                          />
                          <IconButton
                            icon={PlayCircle}
                            label="Executar manualmente"
                            intent="ghost"
                            onClick={() => runOne(r)}
                          />
                        </>
                      )}
                      <IconButton
                        icon={History}
                        label="Consultar histórico"
                        intent="ghost"
                        onClick={() => onOpenHistory?.(r.id)}
                      />
                      {(r.stats?.failed ?? 0) > 0 && (
                        <IconButton
                          icon={AlertTriangle}
                          label="Ver erros"
                          intent="ghost"
                          onClick={() => onOpenHistory?.(r.id, true)}
                        />
                      )}
                      <IconButton
                        icon={Copy}
                        label="Duplicar regra"
                        intent="ghost"
                        onClick={() => clone(r.id)}
                      />
                      <IconButton
                        icon={Trash2}
                        label="Remover regra"
                        intent="ghost"
                        className="hover:bg-danger-subtle hover:text-danger"
                        onClick={() => remove(r.id)}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
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
              <dd>{detail.module ?? '–'}</dd>
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
