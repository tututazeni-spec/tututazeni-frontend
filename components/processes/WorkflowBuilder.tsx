// components/processes/WorkflowBuilder.tsx
// Construtor visual de fluxos de um modelo (docs/Modulo_Processes.md §8):
// paleta de blocos, canvas com ligações, propriedades da etapa e teste do
// fluxo antes de publicar. Guarda com PUT /processes/:id (só rascunhos; o
// backend recusa trocar etapas que já tenham instâncias com progresso).

'use client';

import { useMemo, useState } from 'react';
import { ArrowLeft, FlaskConical, LayoutGrid, Save, Unlink } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { useToast } from '@/providers/ToastProvider';
import { PROCESS_STATUS_MAP } from './constants';
import { FlowTestModal } from './FlowTestModal';
import { Skeleton } from './Skeleton';
import { StepInspector } from './StepInspector';
import { WorkflowCanvas } from './WorkflowCanvas';
import {
  BLOCKS,
  HUMAN_TYPES,
  NODE_H,
  NODE_W,
  autoLayout,
  newNode,
  nodesFromSteps,
  stepsToServer,
  wouldCycle,
  type FlowNode,
} from './workflow-model';
import type { Process, StepType } from './types';

export interface WorkflowBuilderProps {
  processId: number;
  canEdit: boolean;
  onBack: () => void;
}

export function WorkflowBuilder({ processId, canEdit, onBack }: WorkflowBuilderProps) {
  const { data, isLoading, error } = useApiQuery<Process>(
    queryKeys.processes.detail(processId),
    `/processes/${processId}`,
    { staleTime: 0 },
  );

  if (isLoading || !data) {
    return error ? (
      <p className="font-body text-sm text-danger">{error.message}</p>
    ) : (
      <Skeleton rows={4} />
    );
  }
  // Remonta o editor quando o servidor devolve versão nova (após guardar).
  return (
    <BuilderInner
      key={`${data.id}-${data.updatedAt}`}
      process={data}
      canEdit={canEdit}
      onBack={onBack}
    />
  );
}

function BuilderInner({
  process,
  canEdit,
  onBack,
}: {
  process: Process;
  canEdit: boolean;
  onBack: () => void;
}) {
  const notify = useToast();
  const readOnly = !canEdit || process.status !== 'DRAFT';
  const [nodes, setNodes] = useState<FlowNode[]>(() => nodesFromSteps(process.steps));
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<{ from: string; to: string } | null>(null);
  const [dirty, setDirty] = useState(false);
  const [testing, setTesting] = useState(false);

  const edit = (fn: (prev: FlowNode[]) => FlowNode[]) => {
    setNodes(fn);
    setDirty(true);
  };
  const patchNode = (key: string, patch: Partial<FlowNode>) =>
    edit((prev) => prev.map((n) => (n.key === key ? { ...n, ...patch } : n)));

  const selected = nodes.find((n) => n.key === selectedKey) ?? null;

  const flagged = useMemo(() => {
    const out = new Set<string>();
    for (const n of nodes) {
      const human = HUMAN_TYPES.includes(n.type);
      if (!n.title.trim()) out.add(n.key);
      if (human && !n.responsibleId && !n.responsibleRole.trim()) out.add(n.key);
      if (n.type === 'REVIEW' && !n.approverIds.some(Boolean) && !n.responsibleId && !n.responsibleRole.trim() && !n.reviewerId) {
        out.add(n.key);
      }
    }
    return out;
  }, [nodes]);

  const addBlock = (type: StepType) => {
    const maxY = nodes.reduce((m, n) => Math.max(m, n.y), 0);
    const node = newNode(type, 40, nodes.length ? maxY + NODE_H + 40 : 40);
    // Liga ao último bloco, para o fluxo ir crescendo em sequência.
    const last = selected ?? nodes[nodes.length - 1];
    if (last && last.type !== 'END') {
      node.deps = [last.key];
      node.x = last.x + NODE_W + 60;
      node.y = last.y;
    }
    edit((prev) => [...prev, node]);
    setSelectedKey(node.key);
    setSelectedEdge(null);
  };

  const connect = (from: string, to: string) => {
    if (readOnly) return;
    const target = nodes.find((n) => n.key === to);
    if (!target || target.deps.includes(from)) return;
    if (wouldCycle(nodes, from, to)) {
      notify({ title: 'Essa ligação criaria um ciclo infinito', intent: 'danger' });
      return;
    }
    patchNode(to, { deps: [...target.deps, from] });
  };

  const toggleDep = (nodeKey: string, depKey: string) => {
    const n = nodes.find((x) => x.key === nodeKey);
    if (!n) return;
    if (n.deps.includes(depKey)) patchNode(nodeKey, { deps: n.deps.filter((d) => d !== depKey) });
    else connect(depKey, nodeKey);
  };

  const removeNode = (key: string) => {
    edit((prev) =>
      prev
        .filter((n) => n.key !== key)
        .map((n) => ({
          ...n,
          deps: n.deps.filter((d) => d !== key),
          // condições que apontavam para o bloco removido deixam de fazer sentido
          entry: n.entry
            ? { ...n.entry, rows: n.entry.rows.filter((r) => !r.field.startsWith(`step:${key}.`)) }
            : null,
          exit: n.exit
            ? { ...n.exit, rows: n.exit.rows.filter((r) => !r.field.startsWith(`step:${key}.`)) }
            : null,
        }))
        .map((n) => ({
          ...n,
          entry: n.entry && n.entry.rows.length ? n.entry : null,
          exit: n.exit && n.exit.rows.length ? n.exit : null,
        })),
    );
    setSelectedKey(null);
  };

  const removeEdge = () => {
    if (!selectedEdge) return;
    patchNode(selectedEdge.to, {
      deps: (nodes.find((n) => n.key === selectedEdge.to)?.deps ?? []).filter((d) => d !== selectedEdge.from),
    });
    setSelectedEdge(null);
  };

  const save = useApiMutation(
    (steps: unknown[]) => apiClient.put<Process>(`/processes/${process.id}`, { steps }),
    {
      invalidateKeys: [queryKeys.processes.all],
      onSuccess: () => {
        notify({ title: 'Fluxo guardado', intent: 'success' });
        setDirty(false);
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const canSave = !readOnly && dirty && nodes.length > 0 && nodes.every((n) => n.title.trim());
  const doSave = () => save.mutate(stepsToServer(nodes));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Button intent="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={14} strokeWidth={1.75} />
          Modelos
        </Button>
        <div className="min-w-0">
          <div className="truncate font-display text-lg font-semibold text-ink">{process.title}</div>
          <div className="font-mono text-xs text-ink-faint">
            {process.code} · v{process.version}
          </div>
        </div>
        <StatusBadge value={process.status} map={PROCESS_STATUS_MAP} variant="dot" />
        <div className="ml-auto flex flex-wrap items-center gap-2">
          {!readOnly && (
            <>
              <Button intent="ghost" size="sm" onClick={() => edit((p) => autoLayout(p, true))}>
                <LayoutGrid size={14} strokeWidth={1.75} />
                Organizar
              </Button>
              <Button intent="ghost" size="sm" onClick={removeEdge} disabled={!selectedEdge}>
                <Unlink size={14} strokeWidth={1.75} />
                Remover ligação
              </Button>
            </>
          )}
          <Button
            intent="secondary"
            size="sm"
            onClick={() => setTesting(true)}
            disabled={dirty || process.steps.length === 0}
            title={dirty ? 'Guarde as alterações antes de testar' : undefined}
          >
            <FlaskConical size={14} strokeWidth={1.75} />
            Testar fluxo
          </Button>
          {!readOnly && (
            <Button size="sm" onClick={doSave} loading={save.isPending} disabled={!canSave}>
              <Save size={14} strokeWidth={1.75} />
              Guardar
            </Button>
          )}
        </div>
      </div>

      {readOnly && (
        <div className="mb-4 rounded-card bg-info-subtle p-3 font-body text-sm text-info-ink">
          {process.status !== 'DRAFT'
            ? 'Só os rascunhos podem ser editados. Em Modelos de Processos, crie uma nova versão ou duplique este modelo.'
            : 'Não tem permissão para editar fluxos.'}
        </div>
      )}

      <div className="flex gap-4">
        {!readOnly && (
          <aside className="w-48 shrink-0 rounded-card border border-border bg-surface p-2">
            <div className="px-1 pb-2 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
              Blocos
            </div>
            <ul className="space-y-1">
              {BLOCKS.map((b) => (
                <li key={b.type}>
                  <button
                    type="button"
                    onClick={() => addBlock(b.type)}
                    title={b.hint}
                    className="w-full rounded-control px-2 py-1.5 text-left font-body text-sm text-ink hover:bg-surface-sunken"
                  >
                    {b.label}
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-2 px-1 font-body text-[11px] text-ink-faint">
              O novo bloco liga-se ao seleccionado.
            </p>
          </aside>
        )}

        <div className="min-w-0 flex-1">
          {nodes.length === 0 ? (
            <div className="flex h-[560px] items-center justify-center rounded-card border border-dashed border-border font-body text-sm text-ink-faint">
              Adicione blocos a partir da paleta.
            </div>
          ) : (
            <WorkflowCanvas
              nodes={nodes}
              selectedKey={selectedKey}
              selectedEdge={selectedEdge}
              readOnly={readOnly}
              flagged={flagged}
              onSelect={setSelectedKey}
              onSelectEdge={setSelectedEdge}
              onMove={(key, x, y) => patchNode(key, { x, y })}
              onConnect={connect}
            />
          )}
          {flagged.size > 0 && (
            <p className="mt-2 font-body text-xs text-warning-ink">
              {flagged.size} bloco(s) com pendências (sem nome, responsável ou aprovador).
            </p>
          )}
        </div>

        {selected && (
          <StepInspector
            key={selected.key}
            node={selected}
            nodes={nodes}
            readOnly={readOnly}
            onChange={(patch) => patchNode(selected.key, patch)}
            onToggleDep={(d) => toggleDep(selected.key, d)}
            onDelete={() => removeNode(selected.key)}
            onClose={() => setSelectedKey(null)}
          />
        )}
      </div>

      {testing && (
        <FlowTestModal processId={process.id} steps={process.steps} onClose={() => setTesting(false)} />
      )}
    </div>
  );
}
