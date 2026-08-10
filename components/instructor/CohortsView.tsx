// components/instructor/CohortsView.tsx
// Vista "Turmas": listagem filtrável + formulário de criação.
// Extraído de app/(platform)/instructor/page.tsx.

'use client';

import { useState } from 'react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { useFormValidation } from '@/hooks/useFormValidation';
import { required } from '@/lib/validation';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ProgressBar, Skeleton } from './atoms';
import { MODALITY_CFG, STATUS_CFG } from './constants';
import type { CohortSummary } from './types';

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
      setSubmitError(e instanceof Error ? e.message : String(e));
    }
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {['', 'OPEN', 'ACTIVE', 'CLOSED'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${statusFilter === s ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {s === '' ? 'Todas' : (STATUS_CFG[s]?.label ?? s)}
            </button>
          ))}
        </div>
        <button
          onClick={() => setCreating((c) => !c)}
          className="px-3 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800"
        >
          {creating ? '✕ Cancelar' : '+ Nova turma'}
        </button>
      </div>

      {/* Formulário de criação */}
      {creating && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mb-4">
          <div className="text-sm font-semibold text-gray-900 mb-3">
            Nova turma
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-3">
              {error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <input
              type="text"
              placeholder="Nome da turma"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 col-span-2"
            />
            <input
              type="number"
              placeholder="ID do curso"
              value={form.courseId}
              onChange={(e) =>
                setForm((f) => ({ ...f, courseId: e.target.value }))
              }
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              type="date"
              value={form.startDate}
              onChange={(e) =>
                setForm((f) => ({ ...f, startDate: e.target.value }))
              }
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <select
              value={form.modalidade}
              onChange={(e) =>
                setForm((f) => ({ ...f, modalidade: e.target.value }))
              }
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(MODALITY_CFG).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.icon} {v.label}
                </option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Máx. participantes"
              value={form.maxParticipants}
              onChange={(e) =>
                setForm((f) => ({ ...f, maxParticipants: e.target.value }))
              }
              className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleCreate}
            className="mt-3 px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800"
          >
            Criar turma
          </button>
        </div>
      )}

      {loading ? (
        <Skeleton />
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {(data?.data ?? []).map((c) => {
            const modalityCfg =
              MODALITY_CFG[c.modalidade] ?? MODALITY_CFG.ONLINE;
            return (
              <div
                key={c.id}
                onClick={() => onSelectCohort(c.id)}
                className="bg-white border border-gray-200 rounded-xl p-4 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge value={c.status} map={STATUS_CFG} />
                      <span className="text-xs text-gray-400">
                        {modalityCfg.icon}
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-gray-900">
                      {c.name}
                    </div>
                    <div className="text-xs text-gray-400">
                      {c.course.title}
                    </div>
                  </div>
                </div>
                <ProgressBar pct={c.avgProgress} />
                <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                  <span>👥 {c.totalStudents} alunos</span>
                  {c.atRisk > 0 && (
                    <span className="text-red-600">⚠ {c.atRisk} em risco</span>
                  )}
                  <span>{fmtDate(c.startDate)}</span>
                </div>
              </div>
            );
          })}
          {(data?.data ?? []).length === 0 && (
            <div className="col-span-2 py-10 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
              Sem turmas criadas
            </div>
          )}
        </div>
      )}
    </div>
  );
}
