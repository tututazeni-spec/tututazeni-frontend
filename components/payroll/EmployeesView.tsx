// components/payroll/EmployeesView.tsx
// Colaboradores do processamento (docs/payroll.md §3):
// GET /payroll/runs/:id/employees; ao abrir um colaborador mostra a ficha
// salarial (GET /payroll/employees/:userId).
'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle, Building2, UserRound, Wallet } from 'lucide-react';
import { ProfileRoiCard } from '@/components/ui/ProfileRoiCard';
import { keepPreviousData } from '@tanstack/react-query';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatKz as fmtKz, formatDate as fmtDate } from '@/lib/format';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Combobox } from '@/components/ui/Combobox';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { resolveBadge } from '@/lib/statusBadge';
import {
  PAYSLIP_STATUS_MAP,
  type PayslipStatus,
} from '@/components/payslips/types';
import { UNDERLINE_COMBOBOX } from './filterStyles';
import { RunPicker } from './RunPicker';
import type { Paginated } from './types';
import type { EmployeeProfile, RunEmployeeRow } from './insightTypes';

const TH =
  'whitespace-nowrap px-3 py-2.5 font-body text-xs font-medium uppercase tracking-wide text-ink-faint';
const TD = 'whitespace-nowrap px-3 py-3';

function EmployeeProfileView({
  userId,
  onBack,
}: {
  userId: number;
  onBack: () => void;
}) {
  const { data, isLoading, error } = useApiQuery<EmployeeProfile>(
    queryKeys.payroll.section('employee', userId),
    `/payroll/employees/${userId}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );
  return (
    <div>
      <Button intent="ghost" size="sm" onClick={onBack} className="mb-4">
        ← Voltar
      </Button>
      {isLoading && <Skeleton rows={6} />}
      {error && (
        <div className="font-body text-sm text-danger">{error.message}</div>
      )}
      {data && (
        <div className="space-y-6 font-body text-sm">
          <ProfileRoiCard
            kicker="Colaborador"
            kickerIcon={UserRound}
            name={data.user.fullName}
            avatarUrl={data.user.avatarUrl}
            stats={[
              { label: 'Nº', value: data.user.employeeNumber ?? '—' },
              { label: 'NIF', value: data.user.nif ?? '—' },
              { label: 'Cargo', value: data.user.position?.name ?? '—' },
              {
                label: 'Departamento',
                value: data.user.department?.name ?? '—',
              },
              ...(data.user.unit
                ? [{ label: 'Unidade', value: data.user.unit.name }]
                : []),
            ]}
          />

          <section>
            {data.compensation ? (
              <ProfileRoiCard
                kicker="Remuneração base e componentes"
                kickerIcon={Wallet}
                subtitle={`Salário base em vigor desde ${fmtDate(data.compensation.effectiveFrom)}`}
                stats={[
                  {
                    label: 'Salário base',
                    value: fmtKz(data.compensation.baseSalary),
                  },
                  {
                    label: 'Alimentação',
                    value: fmtKz(data.compensation.foodAllowance),
                  },
                  {
                    label: 'Transporte',
                    value: fmtKz(data.compensation.transportAllowance),
                  },
                  ...(data.compensation.bankName
                    ? [{ label: 'Banco', value: data.compensation.bankName }]
                    : []),
                  ...data.compensation.components.map((c) => ({
                    label: c.componentCode,
                    value: fmtKz(c.value),
                  })),
                ]}
              />
            ) : (
              <>
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                  Remuneração base e componentes
                </h3>
                <EmptyState
                  title="Sem compensação registada"
                  description="Defina a remuneração base em Compensações."
                />
              </>
            )}
          </section>

          <section>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#0F1F3D]">
              Recibos e pagamentos
            </h3>
            <div className="overflow-x-auto rounded-card border border-border bg-surface">
              <table className="w-full min-w-[520px] text-left">
                <thead className="border-b border-border">
                  <tr>
                    <th className={TH}>Período</th>
                    <th className={TH}>Recibo</th>
                    <th className={TH}>Líquido</th>
                    <th className={TH}>Estado</th>
                    <th className={TH}>Pago em</th>
                  </tr>
                </thead>
                <tbody>
                  {data.payslips.map((p) => (
                    <tr
                      key={p.id}
                      className="border-b border-border last:border-0"
                    >
                      <td className={`${TD} font-body`}>{p.period}</td>
                      <td className={`${TD} text-ink-muted`}>
                        {p.receiptCode ?? '—'}
                      </td>
                      <td className={`${TD} font-body`}>
                        {fmtKz(p.netSalary)}
                      </td>
                      <td className={`${TD} text-ink-muted`}>
                        {
                          resolveBadge(
                            PAYSLIP_STATUS_MAP,
                            p.status as PayslipStatus,
                          ).label
                        }
                      </td>
                      <td className={`${TD} text-ink-muted`}>
                        {p.paymentDate ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

const ALL_DEPARTMENTS = 'all';

interface DepartmentNode {
  id: number;
  name: string;
  children?: DepartmentNode[];
}

function useDepartmentItems() {
  const { data } = useApiQuery<DepartmentNode[]>(
    queryKeys.departments.tree(),
    '/departments/tree',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  return useMemo(() => {
    const flat: { value: string; label: string }[] = [];
    const walk = (nodes: DepartmentNode[] | undefined) => {
      for (const n of nodes ?? []) {
        flat.push({ value: String(n.id), label: n.name });
        walk(n.children);
      }
    };
    walk(data);
    flat.sort((a, b) => a.label.localeCompare(b.label, 'pt'));
    return [
      { value: ALL_DEPARTMENTS, label: 'Todos os departamentos' },
      ...flat,
    ];
  }, [data]);
}

export function EmployeesView() {
  const [runId, setRunId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState(''); // '' = nada escolhido
  const departmentItems = useDepartmentItems();
  const [page, setPage] = useState(1);
  const [userId, setUserId] = useState<number | null>(null);

  const params: Record<string, string | number> = { page, limit: 30 };
  if (search.trim()) params.search = search.trim();
  if (departmentId && departmentId !== ALL_DEPARTMENTS)
    params.departmentId = departmentId;

  const filtered =
    runId !== null && (departmentId !== '' || search.trim().length > 0);

  const { data, isLoading, error } = useApiQuery<Paginated<RunEmployeeRow>>(
    queryKeys.payroll.section('employees', { runId, ...params }),
    `/payroll/runs/${runId}/employees`,
    {
      params,
      enabled: filtered,
      staleTime: STALE_TIME.DYNAMIC,
      placeholderData: keepPreviousData,
    },
  );

  if (userId !== null)
    return (
      <EmployeeProfileView userId={userId} onBack={() => setUserId(null)} />
    );

  const rows = data?.data ?? [];
  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <RunPicker
          variant="underline"
          value={runId}
          onChange={(id) => {
            setRunId(id);
            setPage(1);
          }}
        />
        <Combobox
          variant="underline"
          icon={Building2}
          items={departmentItems}
          value={departmentId}
          onValueChange={(v) => {
            setDepartmentId(v);
            setPage(1);
          }}
          placeholder="Departamento"
          searchPlaceholder="Escreva o departamento…"
          className={`w-64 ${UNDERLINE_COMBOBOX}`}
        />
        <SearchInput
          variant="underline"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Nome ou nº de colaborador"
          className="w-64"
        />
      </div>

      {runId === null && (
        <EmptyState
          title="Escolha um processamento"
          description="Seleccione o run para ver a situação salarial de cada colaborador."
        />
      )}
      {runId !== null && !filtered && (
        <EmptyState
          title="Filtre para ver os colaboradores"
          description="Escolha um departamento ou pesquise por nome ou nº de colaborador."
        />
      )}
      {filtered && isLoading && <Skeleton rows={8} />}
      {error && (
        <div className="font-body text-sm text-danger">{error.message}</div>
      )}
      {filtered && !isLoading && !error && rows.length === 0 && (
        <EmptyState
          title="Sem colaboradores neste processamento"
          description="Processe o run para gerar os recibos."
        />
      )}

      {filtered && rows.length > 0 && (
        <>
          <div className="overflow-x-auto rounded-card border border-border bg-surface">
            <table className="w-full min-w-[1200px] text-left font-body text-sm">
              <thead className="border-b border-border">
                <tr>
                  <th className={TH}>Colaborador</th>
                  <th className={TH}>Nº</th>
                  <th className={TH}>NIF</th>
                  <th className={TH}>Departamento</th>
                  <th className={TH}>Cargo</th>
                  <th className={`${TH} text-right`}>Base</th>
                  <th className={`${TH} text-right`}>Subsídios</th>
                  <th className={`${TH} text-right`}>Extra</th>
                  <th className={`${TH} text-right`}>Prémios</th>
                  <th className={`${TH} text-right`}>Faltas</th>
                  <th className={`${TH} text-right`}>INSS</th>
                  <th className={`${TH} text-right`}>IRT</th>
                  <th className={`${TH} text-right`}>Outras ded.</th>
                  <th className={`${TH} text-right`}>Bruto</th>
                  <th className={`${TH} text-right`}>Líquido</th>
                  <th className={`${TH} text-right`}>Custo patronal</th>
                  <th className={TH}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.payslipId}
                    onClick={() => setUserId(r.userId)}
                    className="cursor-pointer border-b border-border last:border-0"
                  >
                    <td className={`${TD} font-medium text-ink`}>
                      {r.fullName}
                      {r.hasExceptions && (
                        <span
                          className="ml-2 inline-flex align-middle text-warning-ink"
                          title="Recibo com excepções — abra a ficha do colaborador para ver o que rever"
                          aria-label="Recibo com excepções"
                        >
                          <AlertTriangle size={14} strokeWidth={1.75} />
                        </span>
                      )}
                    </td>
                    <td className={`${TD} text-ink-muted`}>
                      {r.employeeNumber ?? '—'}
                    </td>
                    <td className={`${TD} text-ink-muted`}>{r.nif ?? '—'}</td>
                    <td className={`${TD} text-ink-muted`}>
                      {r.department ?? '—'}
                    </td>
                    <td className={`${TD} text-ink-muted`}>
                      {r.position ?? '—'}
                    </td>
                    <td className={`${TD} text-right font-body`}>
                      {fmtKz(r.baseSalary)}
                    </td>
                    <td className={`${TD} text-right font-body`}>
                      {fmtKz(r.allowances)}
                    </td>
                    <td className={`${TD} text-right font-body`}>
                      {fmtKz(r.overtime)}
                    </td>
                    <td className={`${TD} text-right font-body`}>
                      {fmtKz(r.bonuses)}
                    </td>
                    <td className={`${TD} text-right`}>{r.absenceDays}</td>
                    <td className={`${TD} text-right font-body`}>
                      {fmtKz(r.inss)}
                    </td>
                    <td className={`${TD} text-right font-body`}>
                      {fmtKz(r.irt)}
                    </td>
                    <td className={`${TD} text-right font-body`}>
                      {fmtKz(r.otherDeductions)}
                    </td>
                    <td className={`${TD} text-right font-body`}>
                      {fmtKz(r.grossSalary)}
                    </td>
                    <td className={`${TD} text-right font-body font-medium`}>
                      {fmtKz(r.netSalary)}
                    </td>
                    <td className={`${TD} text-right font-body`}>
                      {fmtKz(r.employerCost)}
                    </td>
                    <td className={`${TD} text-ink-muted`}>
                      {
                        resolveBadge(
                          PAYSLIP_STATUS_MAP,
                          r.status as PayslipStatus,
                        ).label
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            page={page}
            totalPages={data?.meta.totalPages ?? 0}
            onPageChange={setPage}
          />
        </>
      )}
    </div>
  );
}
