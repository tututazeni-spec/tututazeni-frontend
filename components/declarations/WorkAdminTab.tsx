// components/declarations/WorkAdminTab.tsx
// Separador "Compliance" — KPIs + tabela de submissões de vínculo laboral,
// com rever/rejeitar e disparo de lembretes. Puramente apresentacional; as
// acções chegam via props. Extraído de app/(platform)/declarations/page.tsx.

import {
  Bell,
  Check,
  CheckCircle2,
  Clock,
  Shield,
  X,
  BarChart3,
} from 'lucide-react';
import { KpiCard } from './KpiCard';
import { WORK_STATUS, WORK_TYPE_LABELS } from './constants';
import type { WorkDashboard, WorkSubmission } from './types';

export interface WorkAdminTabProps {
  workDash: WorkDashboard | null;
  workSubs: { data: WorkSubmission[] } | null;
  onReview: (id: number, approved: boolean) => void;
  onTriggerReminders: () => void;
}

export function WorkAdminTab({
  workDash,
  workSubs,
  onReview,
  onTriggerReminders,
}: WorkAdminTabProps) {
  return (
    <div className="space-y-5">
      {workDash && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KpiCard
            label="Pendentes"
            value={workDash.kpis.pending}
            icon={Clock}
            color="amber"
          />
          <KpiCard
            label="Aprovadas"
            value={workDash.kpis.approved}
            icon={CheckCircle2}
            color="emerald"
          />
          <KpiCard
            label="Conformidade"
            value={`${workDash.kpis.completionRate}%`}
            icon={Shield}
            color="blue"
          />
          <KpiCard
            label="Total"
            value={workDash.kpis.total}
            icon={BarChart3}
            color="violet"
          />
        </div>
      )}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-900">
            Submissões de Declarações
          </h2>
          <button
            onClick={onTriggerReminders}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
          >
            <Bell size={12} /> Enviar lembretes
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/60">
                {[
                  'Colaborador',
                  'Formulário',
                  'Tipo',
                  'Estado',
                  'Submissão',
                  'Acções',
                ].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {workSubs?.data.map((s) => (
                <tr key={s.id} className="hover:bg-gray-50/40 group">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {s.user?.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {s.form?.title}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className="px-2 py-0.5 bg-gray-100 rounded-full">
                      {s.form?.type ? WORK_TYPE_LABELS[s.form.type] : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium ${WORK_STATUS[s.status]?.color}`}
                    >
                      {WORK_STATUS[s.status]?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {s.submittedAt
                      ? new Date(s.submittedAt).toLocaleDateString('pt-PT')
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    {s.status === 'SUBMITTED' && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onReview(s.id, true)}
                          className="p-1.5 rounded-lg hover:bg-emerald-100 text-emerald-600"
                        >
                          <Check size={13} />
                        </button>
                        <button
                          onClick={() => onReview(s.id, false)}
                          className="p-1.5 rounded-lg hover:bg-red-100 text-red-600"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {workSubs?.data.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-gray-400 text-sm"
                  >
                    Sem submissões
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
