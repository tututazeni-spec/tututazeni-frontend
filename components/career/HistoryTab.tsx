// components/career/HistoryTab.tsx
// Separador "Histórico" — composição só-leitura de GET /career/me/history
// (ou /career/users/:id/history para RH/Gestor/Admin a consultar outro
// colaborador): cargos, mudanças organizacionais, planos de carreira
// (passados+actuais), candidaturas internas e certificados.

'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Award, Briefcase, FileText, GitCommitHorizontal, Send, X } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { EXECUTIVE_ROLES, isRoleAllowed, type Role } from '@/lib/roles';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { DepartmentUserPicker } from '@/components/departments/DepartmentUserPicker';
import type { DirectoryUser } from '@/components/users/types';
import type { CareerHistory } from './types';

function fmt(date: string | null | undefined): string {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('pt-AO', { day: '2-digit', month: 'short', year: 'numeric' });
}

function Section({
  icon: Icon,
  title,
  count,
  children,
}: {
  icon: typeof Briefcase;
  title: string;
  count: number;
  children: ReactNode;
}) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center gap-1.5 border-b border-border px-4 py-3 font-body text-sm font-semibold text-ink">
        <Icon size={16} strokeWidth={1.75} className="text-ink-muted" />
        {title}
        <span className="ml-auto font-body text-xs font-normal text-ink-faint">{count}</span>
      </div>
      {count === 0 ? (
        <div className="px-4 py-6 text-center font-body text-xs text-ink-faint">Sem registos</div>
      ) : (
        <div className="divide-y divide-border">{children}</div>
      )}
    </Card>
  );
}

export function HistoryTab() {
  const { data: me } = useCurrentUser();
  const canLookup = isRoleAllowed(EXECUTIVE_ROLES, me?.role?.name as Role | undefined);
  const [employee, setEmployee] = useState<DirectoryUser | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  const { data: history, isLoading: loading } = useApiQuery<CareerHistory>(
    queryKeys.career.history(employee?.id),
    employee ? `/career/users/${employee.id}/history` : '/career/me/history',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  return (
    <div>
      {canLookup && (
        <div className="mb-4">
          {employee ? (
            <div className="flex items-center gap-2 rounded-control border border-primary bg-primary-subtle px-3 py-2">
              <span className="font-body text-xs text-primary">A ver histórico de:</span>
              <span className="font-body text-sm font-medium text-ink">{employee.fullName}</span>
              <button
                type="button"
                aria-label="Voltar à minha carreira"
                onClick={() => setEmployee(null)}
                className="ml-auto rounded-control p-1 text-ink-muted hover:bg-surface-sunken hover:text-ink"
              >
                <X size={14} strokeWidth={1.75} />
              </button>
            </div>
          ) : showPicker ? (
            <DepartmentUserPicker
              label="Ver histórico de outro colaborador"
              htmlFor="history-employee-picker"
              value={employee}
              onChange={(u) => {
                setEmployee(u);
                setShowPicker(false);
              }}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowPicker(true)}
              className="font-body text-xs font-medium text-primary hover:underline"
            >
              Ver histórico de outro colaborador
            </button>
          )}
        </div>
      )}

      {loading ? (
        <Skeleton rows={4} />
      ) : !history ? (
        <EmptyState title="Histórico indisponível" description="Não foi possível carregar o histórico." />
      ) : (
        <HistoryContent history={history} />
      )}
    </div>
  );
}

function HistoryContent({ history }: { history: CareerHistory }) {
  const { positionHistory, orgChanges, plans, applications, certificates } = history;
  const isEmpty =
    positionHistory.length === 0 &&
    orgChanges.length === 0 &&
    plans.length === 0 &&
    applications.length === 0 &&
    certificates.length === 0;

  if (isEmpty) {
    return (
      <EmptyState
        title="Sem histórico de carreira"
        description="Ainda não há movimentações, planos ou candidaturas registadas."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <Section icon={Briefcase} title="Cargos" count={positionHistory.length}>
        {positionHistory.map((p) => (
          <div key={p.id} className="flex items-center gap-3 px-4 py-2.5">
            <div className="h-2 w-2 flex-shrink-0 rounded-full bg-primary" />
            <div className="flex-1">
              <div className="font-body text-sm font-medium text-ink">{p.position?.title}</div>
              <div className="font-body text-xs text-ink-faint">
                {fmt(p.startedAt)} {p.endedAt ? `→ ${fmt(p.endedAt)}` : '(actual)'}
              </div>
            </div>
          </div>
        ))}
      </Section>

      <Section icon={GitCommitHorizontal} title="Movimentações" count={orgChanges.length}>
        {orgChanges.map((c) => (
          <div key={c.id} className="px-4 py-2.5">
            <div className="flex items-center gap-2">
              <Badge intent="info">{c.changeType}</Badge>
              <span className="font-body text-xs text-ink-faint">{fmt(c.effectiveDate)}</span>
            </div>
            <div className="mt-1 font-body text-xs text-ink-muted">
              {c.fromDepartment?.name ?? c.fromPosition?.name ?? '—'} →{' '}
              {c.toDepartment?.name ?? c.toPosition?.name ?? '—'}
            </div>
          </div>
        ))}
      </Section>

      <Section icon={FileText} title="Planos de Carreira" count={plans.length}>
        {plans.map((p) => (
          <div key={p.id} className="flex items-center gap-3 px-4 py-2.5">
            <div className="min-w-0 flex-1">
              <div className="truncate font-body text-sm font-medium text-ink">{p.title}</div>
              <div className="font-body text-xs text-ink-faint">
                {p.currentRole?.name ?? '—'} → {p.targetRole?.name ?? '—'}
              </div>
            </div>
            <Badge intent={p.status === 'ACTIVE' ? 'info' : p.status === 'COMPLETED' ? 'success' : 'neutral'}>
              {p.status}
            </Badge>
          </div>
        ))}
      </Section>

      <Section icon={Send} title="Candidaturas Internas" count={applications.length}>
        {applications.map((a) => (
          <div key={a.id} className="flex items-center gap-3 px-4 py-2.5">
            <div className="min-w-0 flex-1">
              <div className="truncate font-body text-sm font-medium text-ink">{a.vacancy.title}</div>
              <div className="font-body text-xs text-ink-faint">{fmt(a.appliedAt)}</div>
            </div>
            <Badge intent={a.status === 'ACCEPTED' ? 'success' : a.status === 'REJECTED' ? 'danger' : 'neutral'}>
              {a.status}
            </Badge>
          </div>
        ))}
      </Section>

      <Section icon={Award} title="Certificados" count={certificates.length}>
        {certificates.map((c) => (
          <div key={c.id} className="flex items-center gap-3 px-4 py-2.5">
            <div className="min-w-0 flex-1">
              <div className="truncate font-body text-sm font-medium text-ink">
                {c.course?.title ?? c.program?.name ?? c.type}
              </div>
              <div className="font-body text-xs text-ink-faint">{fmt(c.issuedAt)}</div>
            </div>
          </div>
        ))}
      </Section>
    </div>
  );
}
