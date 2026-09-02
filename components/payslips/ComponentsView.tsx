// components/payslips/ComponentsView.tsx
// Aba "Componentes" (ADMIN/RH) do módulo /payslips: catálogo de componentes
// salariais (GET /payroll/components). Array simples, ~10-15 linhas. Filtros
// tipo/estado na toolbar; criar/editar via ComponentFormModal; remover via
// useConfirm (soft-delete se referenciado, hard-delete caso contrário — o
// backend decide e devolve a linha).
'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { formatKz as fmtKz } from '@/lib/format';
import { Button, IconButton } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useConfirm } from '@/providers/ConfirmProvider';
import { useToast } from '@/providers/ToastProvider';
import { ComponentFormModal } from './ComponentFormModal';
import type { SalaryComponent, ComponentCalcType } from './types';

type StateFilter = 'active' | 'all' | 'inactive';

const TYPE_ITEMS = [
  { value: 'all', label: 'Todos os tipos' },
  { value: 'EARNING', label: 'Rendimento' },
  { value: 'DEDUCTION', label: 'Desconto' },
];
const STATE_ITEMS = [
  { value: 'active', label: 'Activos' },
  { value: 'all', label: 'Todos' },
  { value: 'inactive', label: 'Inactivos' },
];

function calcLabel(c: SalaryComponent): string {
  switch (c.calcType) {
    case 'FIXED':
      return c.fixedValue != null ? fmtKz(c.fixedValue) : '—';
    case 'PERCENT':
      // rate é fracção (0.03 = 3%) — ver payroll-engine.service.ts
      return c.rate != null ? `${+(c.rate * 100).toFixed(2)}%` : '—';
    case 'FORMULA':
      return c.formula ?? 'fórmula';
    case 'TABLE':
      return 'tabela';
  }
}

const CALC_MONO: ComponentCalcType[] = ['FORMULA'];

export function ComponentsView() {
  const qc = useQueryClient();
  const confirm = useConfirm();
  const notify = useToast();

  const [type, setType] = useState<string>('all');
  const [state, setState] = useState<StateFilter>('active');
  const [editing, setEditing] = useState<SalaryComponent | null>(null);
  const [creating, setCreating] = useState(false);

  const params: Record<string, string> = {};
  if (type !== 'all') params.type = type;
  if (state === 'active') params.active = 'true';
  if (state === 'inactive') params.active = 'false';

  const { data, isLoading, error } = useApiQuery<SalaryComponent[]>(
    queryKeys.payslips.salaryComponents(params),
    '/payroll/components',
    { params },
  );

  const remove = async (c: SalaryComponent) => {
    const ok = await confirm({
      title: `Remover "${c.name}"?`,
      message:
        'Se já estiver em uso em compensações ou recibos, é apenas desactivado ' +
        '(deixa de estar disponível para novos usos mas mantém o histórico). ' +
        'Caso contrário, é removido definitivamente.',
      confirmLabel: 'Remover',
      destructive: true,
    });
    if (!ok) return;
    try {
      const back = await apiClient.delete<SalaryComponent>(
        `/payroll/components/${c.code}`,
      );
      qc.invalidateQueries({ queryKey: queryKeys.payslips.all });
      notify({
        title:
          back?.active === false
            ? 'Componente desactivado'
            : 'Componente removido',
        intent: 'success',
      });
    } catch (e) {
      notify({
        title: (e as Error).message || 'Erro ao remover',
        intent: 'danger',
      });
    }
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Select items={TYPE_ITEMS} value={type} onValueChange={setType} />
        <Select
          items={STATE_ITEMS}
          value={state}
          onValueChange={(v) => setState(v as StateFilter)}
        />
        <Button className="ml-auto" onClick={() => setCreating(true)}>
          + Novo componente
        </Button>
      </div>

      {isLoading && <Skeleton rows={6} />}
      {error && (
        <div className="font-body text-sm text-danger">{error.message}</div>
      )}

      {!isLoading && !error && (data?.length ?? 0) === 0 && (
        <EmptyState
          title="Nenhum componente salarial"
          description="Cria o primeiro componente do catálogo com “+ Novo componente”."
        />
      )}

      {!isLoading && (data?.length ?? 0) > 0 && (
        <div className="overflow-hidden rounded-card border border-border bg-surface">
          <div className="grid grid-cols-[120px_1fr_110px_150px_130px_80px_88px] gap-3 border-b border-border px-4 py-2.5 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
            <div>Código</div>
            <div>Nome</div>
            <div>Tipo</div>
            <div>Cálculo</div>
            <div>Flags</div>
            <div>Ordem</div>
            <div>Acções</div>
          </div>
          {data!.map((c) => (
            <div
              key={c.code}
              className={`grid grid-cols-[120px_1fr_110px_150px_130px_80px_88px] items-center gap-3 border-b border-border px-4 py-3 last:border-0 ${
                c.active ? '' : 'opacity-55'
              }`}
            >
              <div className="font-mono text-sm text-ink">{c.code}</div>
              <div className="min-w-0">
                <div className="truncate font-body text-sm font-medium text-ink">
                  {c.name}
                </div>
                {c.description && (
                  <div className="truncate font-body text-xs text-ink-faint">
                    {c.description}
                  </div>
                )}
                {!c.active && (
                  <span className="mt-0.5 inline-block rounded-full bg-surface-sunken px-1.5 py-0.5 font-body text-[10px] font-medium uppercase tracking-wide text-ink-muted">
                    Inactivo
                  </span>
                )}
              </div>
              <div>
                <span
                  className={`rounded-full px-2 py-0.5 font-body text-xs font-medium ${
                    c.type === 'EARNING'
                      ? 'bg-success-subtle text-success-ink'
                      : 'bg-danger-subtle text-danger-ink'
                  }`}
                >
                  {c.type === 'EARNING' ? 'Rendimento' : 'Desconto'}
                </span>
              </div>
              <div
                className={`text-sm text-ink-muted ${
                  CALC_MONO.includes(c.calcType)
                    ? 'font-mono text-xs'
                    : 'font-body'
                }`}
              >
                {calcLabel(c)}
              </div>
              <div className="flex flex-wrap gap-1">
                {c.isTaxable && (
                  <span className="rounded-full bg-surface-sunken px-1.5 py-0.5 font-body text-[10px] text-ink-muted">
                    Tributável
                  </span>
                )}
                {c.isMandatory && (
                  <span className="rounded-full bg-surface-sunken px-1.5 py-0.5 font-body text-[10px] text-ink-muted">
                    Obrigatório
                  </span>
                )}
              </div>
              <div className="font-body text-sm text-ink-muted">{c.order}</div>
              <div className="flex gap-1">
                <Button intent="ghost" size="sm" onClick={() => setEditing(c)}>
                  Editar
                </Button>
                <IconButton
                  icon={Trash2}
                  label="Remover"
                  intent="ghost"
                  size="sm"
                  onClick={() => remove(c)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {creating && <ComponentFormModal onClose={() => setCreating(false)} />}
      {editing && (
        <ComponentFormModal
          component={editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
