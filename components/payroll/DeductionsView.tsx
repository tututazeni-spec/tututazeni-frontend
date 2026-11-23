// components/payroll/DeductionsView.tsx
// Deduções & Impostos (docs/payroll.md §5): totais por tipo, INSS, IRT por
// escalão e regras fiscais do ano (GET /payroll/deductions).
'use client';

import { useState } from 'react';
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatKz as fmtKz } from '@/lib/format';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { WalletStat } from '@/components/roi-impact/WalletStat';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/providers/ToastProvider';
import { useConfirm } from '@/providers/ConfirmProvider';
import type { DeductionTypeRow, DeductionsSummary } from './insightTypes';
import { InssRulesCard } from './InssRulesCard';
import { NewDeductionModal } from './NewDeductionModal';
import { EditTaxRulesModal } from './EditTaxRulesModal';

const thisMonth = () => new Date().toISOString().slice(0, 7);
const pct = (r: number) => `${(r * 100).toFixed(2).replace(/\.?0+$/, '')}%`;

const TH =
  'px-4 py-3 font-body text-xs font-semibold uppercase tracking-wider text-white';
const H3 =
  'mb-3 font-body text-sm font-semibold uppercase tracking-wide text-ink-faint';

export function DeductionsView() {
  const notify = useToast();
  const confirm = useConfirm();
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editMandatory, setEditMandatory] = useState('true');
  const [period, setPeriod] = useState(thisMonth());
  const [creating, setCreating] = useState(false);
  const [editingRules, setEditingRules] = useState(false);
  const valid = /^\d{4}-(0[1-9]|1[0-2])$/.test(period);
  const { data, isLoading, error } = useApiQuery<DeductionsSummary>(
    queryKeys.payroll.section('deductions', period),
    '/payroll/deductions',
    { params: { period }, enabled: valid, staleTime: STALE_TIME.DYNAMIC },
  );

  const { data: allTypes } = useApiQuery<DeductionTypeRow[]>(
    queryKeys.payroll.section('deduction-types', 'all'),
    '/payroll/deduction-types',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const drafts = (allTypes ?? []).filter((t) => t.status === 'DRAFT');

  const publish = useApiMutation(
    (id: number) => apiClient.post(`/payroll/deduction-types/${id}/publish`),
    {
      invalidateKeys: [queryKeys.payroll.all],
      onSuccess: () =>
        notify({
          title: 'Dedução publicada',
          description: 'Já aparece em "Por tipo de dedução".',
          intent: 'success',
        }),
    },
  );
  const remove = useApiMutation(
    (id: number) => apiClient.delete(`/payroll/deduction-types/${id}`),
    {
      invalidateKeys: [queryKeys.payroll.all],
      onSuccess: () =>
        notify({ title: 'Rascunho eliminado', intent: 'success' }),
    },
  );

  const saveMandatory = useApiMutation(
    (v: { code: string; mandatory: boolean }) =>
      apiClient.patch(`/payroll/deduction-types/code/${v.code}`, {
        mandatory: v.mandatory,
      }),
    {
      invalidateKeys: [queryKeys.payroll.all],
      onSuccess: () => {
        setEditingCode(null);
        notify({ title: 'Dedução actualizada', intent: 'success' });
      },
    },
  );
  const removeType = useApiMutation(
    (code: string) => apiClient.delete(`/payroll/deduction-types/code/${code}`),
    {
      invalidateKeys: [queryKeys.payroll.all],
      onSuccess: () =>
        notify({ title: 'Tipo removido da tabela', intent: 'success' }),
    },
  );
  const restore = useApiMutation(
    () => apiClient.post('/payroll/deduction-types/restore-defaults'),
    {
      invalidateKeys: [queryKeys.payroll.all],
      onSuccess: () =>
        notify({ title: 'Tipos de base repostos', intent: 'success' }),
    },
  );

  const askRemove = async (code: string, name: string, custom?: boolean) => {
    const ok = await confirm({
      title: `Remover "${name}"?`,
      message: custom
        ? 'Esta dedução adicional será eliminada.'
        : 'O tipo deixa de aparecer nesta tabela. O cálculo dos recibos não muda e pode repô-lo depois.',
      confirmLabel: 'Remover',
      destructive: true,
    });
    if (ok) removeType.mutate(code);
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Input
          type="month"
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          aria-label="Período (mês e ano)"
          className="w-44"
        />
        <Button onClick={() => setCreating(true)}>
          <Plus size={16} strokeWidth={1.75} /> Nova dedução ou imposto
        </Button>
      </div>

      {drafts.length > 0 && (
        <section className="mb-8">
          <h3 className={H3}>Rascunhos por publicar</h3>
          <div className="overflow-hidden rounded-[18px] border border-brand-line bg-surface shadow-[0_4px_12px_rgba(21,47,89,0.10)]">
            {drafts.map((d) => (
              <div
                key={d.id}
                className="flex flex-wrap items-center gap-3 border-b border-brand-line px-4 py-3 font-body text-sm last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-ink">{d.name}</p>
                  <p className="text-xs text-ink-muted">
                    {d.calcMethod === 'PERCENT'
                      ? `${pct(d.value)} do salário bruto`
                      : fmtKz(d.value)}
                    {d.mandatory ? ' · Obrigatória' : ''}
                  </p>
                </div>
                <Badge intent="warning">Rascunho</Badge>
                <Button
                  size="sm"
                  onClick={() => publish.mutate(d.id)}
                  loading={publish.isPending && publish.variables === d.id}
                >
                  Publicar
                </Button>
                <Button
                  size="sm"
                  intent="ghost"
                  onClick={() => remove.mutate(d.id)}
                  disabled={remove.isPending}
                >
                  Eliminar
                </Button>
              </div>
            ))}
          </div>
        </section>
      )}

      {valid && isLoading && <Skeleton rows={6} />}
      {error && (
        <div className="font-body text-sm text-danger">{error.message}</div>
      )}
      {data && data.employees === 0 && (
        <EmptyState
          title="Sem recibos neste período"
          description="As deduções aparecem depois de o processamento calcular os recibos."
        />
      )}

      {data && data.employees > 0 && (
        <div className="space-y-8">
          <div className="grid grid-cols-2 items-start gap-6 md:grid-cols-4">
            <WalletStat
              zoom
              image="/images/carteira.png"
              money="bills"
              tone="blue"
              label="Base contributiva INSS"
              value={fmtKz(data.inss.contributoryBase)}
            />
            <WalletStat
              zoom
              image="/images/carteira.png"
              money="stack"
              tone="green"
              label="INSS trabalhador"
              value={fmtKz(data.inss.employeeTotal)}
            />
            <WalletStat
              zoom
              image="/images/carteira.png"
              money="coins"
              tone="blue"
              label="INSS patronal"
              value={fmtKz(data.inss.employerTotal)}
            />
            <WalletStat
              zoom
              image="/images/carteira.png"
              money="mixed"
              tone="orange"
              label="IRT retido"
              value={fmtKz(data.irt.withheld)}
            />
          </div>

          <section>
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className={`${H3} !mb-0`}>Por tipo de dedução</h3>
              <Button
                size="sm"
                intent="ghost"
                onClick={() => restore.mutate(undefined)}
                loading={restore.isPending}
              >
                Repor tipos removidos
              </Button>
            </div>
            <div className="overflow-hidden rounded-[18px] border border-brand-line bg-surface shadow-[0_4px_12px_rgba(21,47,89,0.10)]">
              <table className="w-full min-w-[560px] text-left font-body text-sm">
                <thead className="bg-brand-dark">
                  <tr>
                    <th className={TH}>Tipo</th>
                    <th className={TH}>Obrigatório</th>
                    <th className={TH}>Colaboradores</th>
                    <th className={`${TH} text-right`}>Total</th>
                    <th className={`${TH} text-right`}>Acções</th>
                  </tr>
                </thead>
                <tbody>
                  {data.types.map((t) => (
                    <tr
                      key={t.code}
                      className="border-b border-brand-line last:border-0"
                    >
                      <td className="px-4 py-3 text-ink">
                        {t.name}
                        {t.custom && (
                          <span
                            className="ml-2 text-xs text-ink-muted"
                            title="Ainda não é aplicada ao cálculo dos recibos"
                          >
                            (adicional)
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-ink-muted">
                        {editingCode === t.code ? (
                          <Select
                            items={[
                              { value: 'true', label: 'Sim' },
                              { value: 'false', label: 'Não' },
                            ]}
                            value={editMandatory}
                            onValueChange={setEditMandatory}
                            className="w-24"
                          />
                        ) : t.mandatory ? (
                          'Sim'
                        ) : (
                          'Não'
                        )}
                      </td>
                      <td className="px-4 py-3 text-ink-muted">
                        {t.employeesAffected}
                      </td>
                      <td className="px-4 py-3 text-right font-body text-ink">
                        {fmtKz(t.total)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {editingCode === t.code ? (
                          <span className="inline-flex gap-1">
                            <button
                              type="button"
                              aria-label="Guardar"
                              disabled={saveMandatory.isPending}
                              onClick={() =>
                                saveMandatory.mutate({
                                  code: t.code,
                                  mandatory: editMandatory === 'true',
                                })
                              }
                              className="rounded-control p-1 text-success hover:bg-surface-sunken"
                            >
                              <Check size={16} strokeWidth={1.75} />
                            </button>
                            <button
                              type="button"
                              aria-label="Cancelar"
                              onClick={() => setEditingCode(null)}
                              className="rounded-control p-1 text-ink-muted hover:bg-surface-sunken"
                            >
                              <X size={16} strokeWidth={1.75} />
                            </button>
                          </span>
                        ) : (
                          <span className="inline-flex gap-1">
                            <button
                              type="button"
                              aria-label={`Editar ${t.name}`}
                              onClick={() => {
                                setEditingCode(t.code);
                                setEditMandatory(String(t.mandatory));
                              }}
                              className="rounded-control p-1 text-ink-muted hover:bg-surface-sunken hover:text-ink"
                            >
                              <Pencil size={16} strokeWidth={1.75} />
                            </button>
                            <button
                              type="button"
                              aria-label={`Remover ${t.name}`}
                              onClick={() =>
                                askRemove(t.code, t.name, t.custom)
                              }
                              className="rounded-control p-1 text-ink-muted hover:bg-surface-sunken hover:text-danger"
                            >
                              <Trash2 size={16} strokeWidth={1.75} />
                            </button>
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h3 className={H3}>IRT por escalão aplicado</h3>
            <div className="overflow-hidden rounded-[18px] border border-brand-line bg-surface shadow-[0_4px_12px_rgba(21,47,89,0.10)]">
              <table className="w-full min-w-[420px] text-left font-body text-sm">
                <thead className="bg-brand-dark">
                  <tr>
                    <th className={TH}>Escalão</th>
                    <th className={TH}>Colaboradores</th>
                    <th className={`${TH} text-right`}>IRT</th>
                  </tr>
                </thead>
                <tbody>
                  {data.irt.byBracket.map((b) => (
                    <tr
                      key={b.bracket}
                      className="border-b border-brand-line last:border-0"
                    >
                      <td className="px-4 py-3 text-ink">{b.bracket}</td>
                      <td className="px-4 py-3 text-ink-muted">
                        {b.employees}
                      </td>
                      <td className="px-4 py-3 text-right font-body text-ink">
                        {fmtKz(b.irt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}

      {data?.config && (
        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className={`${H3} !mb-0`}>
              Regras fiscais {data.config.taxYear} ({data.config.countryCode})
            </h3>
            <Button
              size="sm"
              intent="secondary"
              onClick={() => setEditingRules(true)}
            >
              <Pencil size={14} strokeWidth={1.75} /> Editar regras
            </Button>
          </div>
          <InssRulesCard config={data.config} />
        </section>
      )}

      {creating && <NewDeductionModal onClose={() => setCreating(false)} />}
      {editingRules && data?.config && (
        <EditTaxRulesModal
          config={data.config}
          onClose={() => setEditingRules(false)}
        />
      )}
    </div>
  );
}
