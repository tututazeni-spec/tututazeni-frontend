// components/instructor/CohortsView.tsx
// Vista "Turmas": listagem filtrável + formulário de criação.
// Extraído de app/(platform)/instructor/page.tsx.

'use client';

import { useState } from 'react';
import { Plus, Users, X } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { reportError } from '@/lib/errorReporting';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { useFormValidation } from '@/hooks/useFormValidation';
import { required } from '@/lib/validation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { MODALITY_CFG, STATUS_CFG } from './constants';
import type { CohortSummary } from './types';

const STATUS_FILTERS = ['', 'OPEN', 'ACTIVE', 'CLOSED'];
const MODALITY_ITEMS = Object.entries(MODALITY_CFG).map(([value, cfg]) => ({
  value,
  label: cfg.label,
}));

interface CohortsViewProps {
  onSelectCohort: (id: number) => void;
}

export function CohortsView({ onSelectCohort }: CohortsViewProps) {
  const [statusFilter, setStatusFilter] = useState('');
  const [creating, setCreating] = useState(false);
  const {
    values: form,
    setValues: setForm,
    errorMessage: validationError,
    handleSubmit: withValidation,
  } = useFormValidation(
    {
      name: '',
      courseId: '',
      startDate: '',
      modalidade: 'ONLINE',
      maxParticipants: '30',
    },
    {
      name: [required()],
      courseId: [required()],
      startDate: [required()],
    },
  );
  const [submitError, setSubmitError] = useState('');
  const error = validationError || submitError;

  const params = statusFilter ? { status: statusFilter } : {};
  const {
    data,
    isLoading: loading,
    refetch,
  } = useApiQuery<{ data: CohortSummary[] }>(
    queryKeys.instructor.cohorts(statusFilter),
    '/instructors/my/cohorts',
    { params, staleTime: STALE_TIME.DYNAMIC },
  );

  const handleCreate = withValidation(async () => {
    setSubmitError('');
    try {
      await apiClient.post('/instructors/my/cohorts', {
        name: form.name,
        courseId: parseInt(form.courseId),
        startDate: form.startDate,
        modalidade: form.modalidade,
        maxParticipants: parseInt(form.maxParticipants),
      });
      setCreating(false);
      setForm({
        name: '',
        courseId: '',
        startDate: '',
        modalidade: 'ONLINE',
        maxParticipants: '30',
      });
      refetch();
    } catch (e) {
      reportError(e, { source: 'CohortsView.handleCreate' });
      setSubmitError(e instanceof Error ? e.message : String(e));
    }
  });

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-1 rounded-card bg-surface-sunken p-1">
          {STATUS_FILTERS.map((s) => (
            <Button
              key={s}
              size="sm"
              intent={statusFilter === s ? 'primary' : 'ghost'}
              onClick={() => setStatusFilter(s)}
            >
              {s === '' ? 'Todas' : (STATUS_CFG[s]?.label ?? s)}
            </Button>
          ))}
        </div>
        <Button size="sm" onClick={() => setCreating((c) => !c)}>
          {creating ? (
            <>
              <X size={14} strokeWidth={1.75} /> Cancelar
            </>
          ) : (
            <>
              <Plus size={14} strokeWidth={1.75} /> Nova turma
            </>
          )}
        </Button>
      </div>

      {/* Formulário de criação */}
      {creating && (
        <Card className="mb-4 border-border bg-surface p-5">
          <div className="mb-3 font-body text-sm font-semibold text-ink">
            Nova turma
          </div>
          {error && (
            <div className="mb-3 rounded-control border border-danger bg-danger-subtle p-3 font-body text-sm text-danger-ink">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="text"
              placeholder="Nome da turma"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="col-span-2 w-full"
            />
            <Input
              type="number"
              placeholder="ID do curso"
              value={form.courseId}
              onChange={(e) =>
                setForm((f) => ({ ...f, courseId: e.target.value }))
              }
              className="w-full"
            />
            <Input
              type="date"
              value={form.startDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, startDate: e.target.value }))
              }
              className="w-full"
            />
            <Select
              items={MODALITY_ITEMS}
              value={form.modalidade}
              onValueChange={(v) => setForm((f) => ({ ...f, modalidade: v }))}
              className="w-full"
            />
            <Input
              type="number"
              placeholder="Máx. participantes"
              value={form.maxParticipants}
              onChange={(e) =>
                setForm((f) => ({ ...f, maxParticipants: e.target.value }))
              }
              className="w-full"
            />
          </div>
          <Button onClick={handleCreate} className="mt-3">
            Criar turma
          </Button>
        </Card>
      )}

      {loading ? (
        <Skeleton itemClassName="skeleton-shimmer h-16 rounded-card" />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {(data?.data ?? []).map((c) => {
            const modalityCfg =
              MODALITY_CFG[c.modalidade] ?? MODALITY_CFG.ONLINE;
            return (
              <Card
                key={c.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectCohort(c.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectCohort(c.id);
                  }
                }}
                className="cursor-pointer p-4 transition-shadow hover:shadow-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-canvas"
              >
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <div className="mb-1 flex items-center gap-2">
                      <StatusBadge value={c.status} map={STATUS_CFG} />
                      <span className="font-body text-xs text-ink-faint">
                        {modalityCfg.label}
                      </span>
                    </div>
                    <div className="font-body text-sm font-semibold text-ink">
                      {c.name}
                    </div>
                    <div className="font-body text-xs text-ink-faint">
                      {c.course.title}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ProgressBar value={c.avgProgress} className="flex-1" />
                  <span className="w-9 shrink-0 font-mono text-xs text-ink-faint">
                    {c.avgProgress}%
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between font-body text-xs text-ink-faint">
                  <span className="flex items-center gap-1">
                    <Users size={14} strokeWidth={1.75} /> {c.totalStudents}{' '}
                    alunos
                  </span>
                  {c.atRisk > 0 && (
                    <span className="text-danger">{c.atRisk} em risco</span>
                  )}
                  <span>{fmtDate(c.startDate)}</span>
                </div>
              </Card>
            );
          })}
          {(data?.data ?? []).length === 0 && (
            <div className="col-span-2 rounded-card border border-dashed border-border-strong py-10 text-center font-body text-sm text-ink-faint">
              Sem turmas criadas
            </div>
          )}
        </div>
      )}
    </div>
  );
}
