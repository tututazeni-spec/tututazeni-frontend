// components/declarations/WorkFormsTab.tsx
// Separador "Formulários" — declarações de vínculo laboral pendentes do
// utilizador + histórico de submissões. Puramente apresentacional.
// Extraído de app/(platform)/declarations/page.tsx.

import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Clipboard,
} from 'lucide-react';
import { WORK_STATUS, WORK_TYPE_LABELS } from './constants';
import type { WorkForm, WorkSubmission } from './types';

export interface WorkFormsTabProps {
  pendingWork: { pending: WorkForm[]; total: number } | null;
  workSubs: { data: WorkSubmission[] } | null;
  onOpenForm: (form: WorkForm) => void;
}

export function WorkFormsTab({
  pendingWork,
  workSubs,
  onOpenForm,
}: WorkFormsTabProps) {
  return (
    <div className="space-y-4">
      {(pendingWork?.pending.length ?? 0) > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertCircle
            size={18}
            className="text-amber-600 flex-shrink-0 mt-0.5"
          />
          <div>
            <p className="text-sm font-semibold text-amber-900">
              {pendingWork!.total} declaração(ões) pendente(s)
            </p>
            <p className="text-xs text-amber-700 mt-0.5">
              Complete os formulários abaixo para manter o seu perfil
              actualizado.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {pendingWork?.pending.map((f) => (
          <div
            key={f.id}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between hover:border-blue-100 hover:shadow-md transition-all"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Clipboard size={18} className="text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">{f.title}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {WORK_TYPE_LABELS[f.type]}{' '}
                  {f.periodicity ? `· ${f.periodicity}` : ''}
                </p>
                {f.mandatory && (
                  <span className="text-xs text-red-600 font-medium">
                    Obrigatória
                  </span>
                )}
              </div>
            </div>
            <button
              onClick={() => onOpenForm(f)}
              className="flex items-center gap-1.5 px-4 py-2 text-sm text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Preencher <ChevronRight size={14} />
            </button>
          </div>
        ))}
        {pendingWork?.pending.length === 0 && (
          <div className="flex flex-col items-center py-16 text-gray-400">
            <CheckCircle2 size={40} className="mb-3 opacity-30" />
            <p className="text-sm font-medium">Sem formulários pendentes</p>
          </div>
        )}
      </div>

      {/* My submissions */}
      {(workSubs?.data.length ?? 0) > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h3 className="text-sm font-semibold text-gray-900">
              Histórico de Submissões
            </h3>
          </div>
          <div className="divide-y divide-gray-50">
            {workSubs?.data.map((s) => (
              <div
                key={s.id}
                className="px-5 py-3 flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {s.form?.title}
                  </p>
                  <p className="text-xs text-gray-400">
                    {s.submittedAt
                      ? new Date(s.submittedAt).toLocaleDateString('pt-PT')
                      : '—'}
                  </p>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-medium ${WORK_STATUS[s.status]?.color}`}
                >
                  {WORK_STATUS[s.status]?.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
