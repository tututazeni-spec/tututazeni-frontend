// components/declarations/WorkDeclFormModal.tsx
// Formulário dinâmico de declaração de vínculo laboral (perguntas
// condicionais por tipo de campo). Extraído de
// app/(platform)/declarations/page.tsx.

'use client';

import { useState } from 'react';
import { AlertCircle, Loader2, Send, X } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { WORK_TYPE_LABELS } from './constants';
import type { WorkForm } from './types';

export interface WorkDeclFormModalProps {
  form: WorkForm;
  onClose: () => void;
  onSuccess: () => void;
}

export function WorkDeclFormModal({
  form,
  onClose,
  onSuccess,
}: WorkDeclFormModalProps) {
  const [answers, setAnswers] = useState<
    Record<string, string | number | boolean>
  >({});
  const [error, setError] = useState('');

  const questions = (form.questions ?? [])
    .filter((q) => {
      if (!q.conditionalKey) return true;
      return answers[q.conditionalKey] == q.conditionalValue;
    })
    .sort((a, b) => a.order - b.order);

  const submitForm = useApiMutation(
    (draft: boolean) =>
      apiClient.post('/declarations/work/submit', {
        formId: form.id,
        answers: Object.entries(answers).map(([key, value]) => ({
          key,
          value,
        })),
        saveAsDraft: draft,
      }),
    {
      onSuccess: () => {
        onSuccess();
        onClose();
      },
      onError: (e) => setError(e.message),
    },
  );
  const loading = submitForm.isPending;
  const handleSubmit = (draft = false) => {
    setError('');
    submitForm.mutate(draft);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100 flex items-start justify-between">
          <div>
            <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              {WORK_TYPE_LABELS[form.type]}
            </span>
            <h2 className="font-bold text-gray-900 mt-1.5">{form.title}</h2>
            {form.description && (
              <p className="text-sm text-gray-500 mt-0.5">{form.description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar"
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-sm">
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          {questions.map((q) => (
            <div key={q.key}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {q.label}
                {q.required && <span className="text-red-500 ml-1">*</span>}
              </label>

              {['TEXT', 'TEXTAREA'].includes(q.fieldType) &&
                (q.fieldType === 'TEXTAREA' ? (
                  <textarea
                    value={String(answers[q.key] ?? '')}
                    onChange={(e) =>
                      setAnswers((a) => ({ ...a, [q.key]: e.target.value }))
                    }
                    rows={3}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                ) : (
                  <input
                    value={String(answers[q.key] ?? '')}
                    onChange={(e) =>
                      setAnswers((a) => ({ ...a, [q.key]: e.target.value }))
                    }
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                ))}

              {q.fieldType === 'BOOLEAN' && (
                <div className="flex gap-3">
                  {['Sim', 'Não'].map((opt) => (
                    <button
                      key={opt}
                      onClick={() =>
                        setAnswers((a) => ({ ...a, [q.key]: opt === 'Sim' }))
                      }
                      className={`flex-1 py-2.5 text-sm rounded-xl border-2 font-medium transition-colors ${answers[q.key] === (opt === 'Sim') ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {['SELECT', 'MULTI_SELECT'].includes(q.fieldType) && (
                <select
                  value={String(answers[q.key] ?? '')}
                  onChange={(e) =>
                    setAnswers((a) => ({ ...a, [q.key]: e.target.value }))
                  }
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Seleccionar...</option>
                  {q.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              )}

              {q.fieldType === 'DATE' && (
                <input
                  type="date"
                  value={String(answers[q.key] ?? '')}
                  onChange={(e) =>
                    setAnswers((a) => ({ ...a, [q.key]: e.target.value }))
                  }
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}

              {q.fieldType === 'NUMBER' && (
                <input
                  type="number"
                  value={String(answers[q.key] ?? '')}
                  onChange={(e) =>
                    setAnswers((a) => ({ ...a, [q.key]: +e.target.value }))
                  }
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              )}
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-3">
          <button
            onClick={() => handleSubmit(true)}
            disabled={loading}
            className="px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
          >
            Guardar Rascunho
          </button>
          <div className="flex-1" />
          <button
            onClick={onClose}
            className="px-3 py-2.5 text-sm text-gray-500 hover:text-gray-700"
          >
            Cancelar
          </button>
          <button
            onClick={() => handleSubmit(false)}
            disabled={loading}
            className="px-5 py-2.5 text-sm text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Send size={14} />
            )}{' '}
            Submeter
          </button>
        </div>
      </div>
    </div>
  );
}
