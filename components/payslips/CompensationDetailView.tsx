// components/payslips/CompensationDetailView.tsx
// Detalhe de compensação POR COLABORADOR (nav comp-detail; userId). Uma query:
// GET /payroll/compensation?userId= (histórico, inclui components + user via B-1).
// current = history.find(effectiveTo === null). IBAN em claro é intencional
// (mesma política dos endpoints current/history para ADMIN/RH).
'use client';

import { useState } from 'react';
import {
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatKz as fmtKz, formatDate as fmtDate } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { CompensationFormModal } from './CompensationFormModal';
import { CompensationComponentsEditor } from './CompensationComponentsEditor';
import type { EmployeeCompensation } from './types';

export interface CompensationDetailViewProps {
  userId: number;
  onBack: () => void;
}

type ModalState =
  | { kind: 'none' }
  | { kind: 'edit'; record: EmployeeCompensation }
  | { kind: 'components'; record: EmployeeCompensation }
  | { kind: 'create' };

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border px-4 py-2.5 last:border-0">
      <dt className="font-body text-sm text-ink-muted">{label}</dt>
      <dd className="font-mono text-sm font-medium text-ink">{value}</dd>
    </div>
  );
}

export function CompensationDetailView({
  userId,
  onBack,
}: CompensationDetailViewProps) {
  const { data, isLoading, error } = useApiQuery<EmployeeCompensation[]>(
    queryKeys.payslips.compensationHistory(userId),
    '/payroll/compensation',
    { params: { userId }, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const [modal, setModal] = useState<ModalState>({ kind: 'none' });
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  const history = data ?? [];
  const current = history.find((r) => r.effectiveTo === null) ?? null;
  const person = history[0]?.user;
  const heading = person?.fullName ?? `#${userId}`;

  const toggle = (id: number) =>
    setExpanded((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <div>
      <button
        onClick={onBack}
        className="mb-4 flex items-center gap-1 font-body text-sm text-ink-muted hover:text-ink"
      >
        <ChevronLeft size={16} strokeWidth={1.75} />
        Voltar
      </button>

      <div className="mb-5">
        <h2 className="font-display text-lg font-semibold text-ink">
          {heading}
        </h2>
        {person && (
          <p className="font-body text-sm text-ink-faint">
            {person.employeeNumber ?? '—'}
            {person.department ? ` · ${person.department.name}` : ''}
          </p>
        )}
      </div>

      {isLoading && <Skeleton rows={6} />}
      {error && (
        <div className="font-body text-sm text-danger">{error.message}</div>
      )}

      {!isLoading && !error && history.length === 0 && (
        <>
          <EmptyState
            title="Sem compensação registada"
            description="Este colaborador ainda não tem nenhum registo de compensação."
          />
          <div className="mt-4">
            <Button onClick={() => setModal({ kind: 'create' })}>
              Criar compensação
            </Button>
          </div>
        </>
      )}

      {!isLoading && history.length > 0 && (
        <>
          {current ? (
            <div className="mb-6">
              <div className="mb-2 flex items-center gap-2">
                <h3 className="font-body text-sm font-semibold uppercase tracking-wide text-ink-faint">
                  Registo activo
                </h3>
                <span className="rounded-full bg-success-subtle px-2 py-0.5 font-body text-xs font-medium text-success-ink">
                  Activo
                </span>
              </div>
              <dl className="overflow-hidden rounded-card border border-border bg-surface">
                <Row label="Salário base" value={fmtKz(current.baseSalary)} />
                <Row
                  label="Subsídio de alimentação"
                  value={fmtKz(current.foodAllowance)}
                />
                <Row
                  label="Subsídio de transporte"
                  value={fmtKz(current.transportAllowance)}
                />
                <Row label="Banco" value={current.bankName ?? '—'} />
                <Row label="IBAN" value={current.iban ?? '—'} />
                <Row label="Nº de conta" value={current.accountNumber ?? '—'} />
                <Row label="País" value={current.countryCode ?? '—'} />
                <Row
                  label="Em vigor desde"
                  value={fmtDate(current.effectiveFrom)}
                />
              </dl>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  intent="secondary"
                  size="sm"
                  onClick={() => setModal({ kind: 'edit', record: current })}
                >
                  Corrigir registo
                </Button>
                <Button
                  intent="secondary"
                  size="sm"
                  onClick={() =>
                    setModal({ kind: 'components', record: current })
                  }
                >
                  Gerir componentes
                </Button>
                <Button size="sm" onClick={() => setModal({ kind: 'create' })}>
                  Nova versão
                </Button>
              </div>
            </div>
          ) : (
            <div className="mb-6 flex items-start gap-2 rounded-card bg-warning-subtle p-3 text-sm text-warning-ink">
              <AlertCircle size={16} strokeWidth={1.75} className="mt-0.5" />
              <div>
                Este colaborador está sem registo de compensação activo.
                <div className="mt-2">
                  <Button
                    size="sm"
                    onClick={() => setModal({ kind: 'create' })}
                  >
                    Criar compensação
                  </Button>
                </div>
              </div>
            </div>
          )}

          <h3 className="mb-2 font-body text-sm font-semibold uppercase tracking-wide text-ink-faint">
            Histórico
          </h3>
          <div className="overflow-hidden rounded-card border border-border bg-surface">
            {history.map((r) => {
              const open = expanded.has(r.id);
              return (
                <div
                  key={r.id}
                  className="border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3 px-4 py-3">
                    <button
                      aria-label={
                        open ? 'esconder componentes' : 'ver componentes'
                      }
                      onClick={() => toggle(r.id)}
                      className="text-ink-muted hover:text-ink"
                    >
                      {open ? (
                        <ChevronDown size={16} strokeWidth={1.75} />
                      ) : (
                        <ChevronRight size={16} strokeWidth={1.75} />
                      )}
                    </button>
                    <div className="flex-1 font-body text-sm text-ink">
                      {fmtDate(r.effectiveFrom)} →{' '}
                      {r.effectiveTo ? fmtDate(r.effectiveTo) : 'actual'}
                    </div>
                    <div className="font-mono text-sm text-ink-muted">
                      {fmtKz(r.baseSalary)}
                    </div>
                    <div className="font-body text-xs text-ink-faint">
                      {r.components.length} comp.
                    </div>
                    {r.effectiveTo === null && (
                      <span className="rounded-full bg-success-subtle px-2 py-0.5 font-body text-xs font-medium text-success-ink">
                        Activo
                      </span>
                    )}
                  </div>
                  {open && (
                    <div className="bg-surface-sunken px-11 py-2">
                      {r.components.length === 0 ? (
                        <p className="font-body text-xs text-ink-faint">
                          Sem componentes.
                        </p>
                      ) : (
                        r.components.map((c) => (
                          <div
                            key={c.id}
                            className="flex items-center justify-between py-1 font-body text-sm text-ink-muted"
                          >
                            <span className="font-mono text-xs">
                              {c.componentCode}
                            </span>
                            <span className="font-mono">{fmtKz(c.value)}</span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {modal.kind === 'edit' && (
        <CompensationFormModal
          mode="edit"
          record={modal.record}
          onClose={() => setModal({ kind: 'none' })}
        />
      )}
      {modal.kind === 'components' && (
        <CompensationComponentsEditor
          record={modal.record}
          onClose={() => setModal({ kind: 'none' })}
        />
      )}
      {modal.kind === 'create' && (
        <CompensationFormModal
          mode="create"
          userId={userId}
          onClose={() => setModal({ kind: 'none' })}
        />
      )}
    </div>
  );
}
