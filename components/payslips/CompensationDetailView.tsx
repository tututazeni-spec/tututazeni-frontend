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
  Landmark,
  History,
  Wallet,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatKz as fmtKz, formatDate as fmtDate } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { SectionHeader, TotalPill } from './PayslipAmountBreakdown';
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
  | { kind: 'create'; from?: EmployeeCompensation };

// Efeito de hover dos botões secundários já usado no detalhe do recibo.
const CARD_STYLE = {
  backgroundColor: '#F5F9FF',
  boxShadow: '0 6px 18px rgba(21,47,89,0.12)',
};

const BTN_HOVER =
  'hover:!border-black hover:!bg-black hover:!text-white focus-visible:!bg-black focus-visible:!text-white';

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-[#EAEFF8] py-1.5 last:border-0">
      <dt className="font-body text-sm text-[#1B2742]">{label}</dt>
      <dd className="break-all text-right font-body text-sm font-semibold tabular-nums text-[#1B2742]">
        {value}
      </dd>
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

  const historyBlock = (
    <div className="border-t border-[#BCC6E0] px-5 py-2.5 first:border-t-0">
      <SectionHeader compact icon={History}>
        Histórico
      </SectionHeader>
      <div>
        {history.map((r) => {
          const open = expanded.has(r.id);
          return (
            <div key={r.id} className="border-b border-[#EAEFF8] last:border-0">
              <div className="flex items-center gap-3 py-0.5">
                <button
                  aria-label={open ? 'esconder componentes' : 'ver componentes'}
                  onClick={() => toggle(r.id)}
                  className="text-black hover:text-black/70"
                >
                  {open ? (
                    <ChevronDown size={14} strokeWidth={1.75} />
                  ) : (
                    <ChevronRight size={14} strokeWidth={1.75} />
                  )}
                </button>
                <div className="flex-1 font-body text-xs text-black">
                  {fmtDate(r.effectiveFrom)} →{' '}
                  {r.effectiveTo ? fmtDate(r.effectiveTo) : 'actual'}
                </div>
                <div className="font-body text-xs font-semibold tabular-nums text-black">
                  {fmtKz(r.baseSalary)}
                </div>
                <div className="font-body text-xs text-black">
                  {r.components.length} comp.
                </div>
              </div>
              {open && (
                <div className="mb-1 rounded-[8px] bg-[#EAF0FB] px-5 py-1">
                  {r.components.length === 0 ? (
                    <EmptyState variant="inline" title="Sem componentes" />
                  ) : (
                    r.components.map((c) => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between py-0 font-body text-xs text-black"
                      >
                        <span className="font-body text-xs">
                          {c.componentCode}
                        </span>
                        <span className="font-body tabular-nums">
                          {fmtKz(c.value)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

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
          <p className="font-body text-sm text-black">
            {person.department?.name ?? ''}
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
              </div>
              <div
                className="overflow-hidden rounded-[22px] border border-[#D6E0F2]"
                style={CARD_STYLE}
              >
                <div className="grid md:grid-cols-2 md:divide-x md:divide-[#BCC6E0]">
                  <div className="flex flex-col px-6 py-5">
                    <SectionHeader icon={Wallet}>Remunerações</SectionHeader>
                    <dl>
                      <Row
                        label="Salário base"
                        value={fmtKz(current.baseSalary)}
                      />
                      <Row
                        label="Subsídio de alimentação"
                        value={fmtKz(current.foodAllowance)}
                      />
                      <Row
                        label="Subsídio de transporte"
                        value={fmtKz(current.transportAllowance)}
                      />
                    </dl>
                    <div className="mt-3">
                      <TotalPill
                        label="Total"
                        value={fmtKz(
                          current.baseSalary +
                            (current.foodAllowance ?? 0) +
                            (current.transportAllowance ?? 0),
                        )}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col px-6 py-5">
                    <SectionHeader icon={Landmark}>
                      Dados bancários
                    </SectionHeader>
                    <dl>
                      <Row label="Banco" value={current.bankName ?? '—'} />
                      <Row label="IBAN" value={current.iban ?? '—'} />
                      <Row
                        label="Nº de conta"
                        value={current.accountNumber ?? '—'}
                      />
                      <Row label="País" value={current.countryCode ?? '—'} />
                      <Row
                        label="Em vigor desde"
                        value={fmtDate(current.effectiveFrom)}
                      />
                    </dl>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  intent="secondary"
                  size="sm"
                  className={BTN_HOVER}
                  onClick={() => setModal({ kind: 'edit', record: current })}
                >
                  Corrigir registo
                </Button>
                <Button
                  intent="secondary"
                  size="sm"
                  className={BTN_HOVER}
                  onClick={() =>
                    setModal({ kind: 'components', record: current })
                  }
                >
                  Gerir componentes
                </Button>
                <Button
                  size="sm"
                  onClick={() => setModal({ kind: 'create', from: current })}
                >
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

          {
            <div
              className="overflow-hidden rounded-[22px] border border-[#D6E0F2]"
              style={CARD_STYLE}
            >
              {historyBlock}
            </div>
          }
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
          record={modal.from ?? null}
          onClose={() => setModal({ kind: 'none' })}
        />
      )}
    </div>
  );
}
