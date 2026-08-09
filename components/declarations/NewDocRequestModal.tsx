// components/declarations/NewDocRequestModal.tsx
// Wizard de 3 passos para solicitar uma declaração/documento. Extraído de
// app/(platform)/declarations/page.tsx.
//
// Wizard de 3 passos: step/form avançam juntos e preview/previewLoading só
// fazem sentido no passo 3. Um reducer com acções por passo torna as
// transições explícitas e evita estados impossíveis (ex: previewLoading=true
// no passo 1) que useState soltos não impediam.

'use client';

import { useReducer } from 'react';
import { AlertCircle, Clock, Eye, FileText, Loader2, X } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';
import type { Purpose, Template } from './types';

interface WizardForm {
  templateId: number;
  purposeId: number;
  addressedTo: string;
  observations: string;
  saveAsDraft: boolean;
}

interface DocPreview {
  previewHtml: string;
}

interface WizardState {
  step: 1 | 2 | 3;
  form: WizardForm;
  preview: DocPreview | null;
  previewLoading: boolean;
  submitting: boolean;
  error: string;
}

type WizardAction =
  | {
      type: 'SET_FIELD';
      field: keyof WizardForm;
      value: WizardForm[keyof WizardForm];
    }
  | { type: 'NEXT_STEP' }
  | { type: 'PREV_STEP' }
  | { type: 'PREVIEW_START' }
  | { type: 'PREVIEW_SUCCESS'; preview: DocPreview }
  | { type: 'PREVIEW_ERROR' }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_ERROR'; error: string };

const initialWizardState: WizardState = {
  step: 1,
  form: {
    templateId: 0,
    purposeId: 0,
    addressedTo: '',
    observations: '',
    saveAsDraft: false,
  },
  preview: null,
  previewLoading: false,
  submitting: false,
  error: '',
};

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_FIELD':
      return {
        ...state,
        form: { ...state.form, [action.field]: action.value },
      };
    case 'NEXT_STEP':
      return { ...state, step: Math.min(3, state.step + 1) as 1 | 2 | 3 };
    case 'PREV_STEP':
      return { ...state, step: Math.max(1, state.step - 1) as 1 | 2 | 3 };
    case 'PREVIEW_START':
      return { ...state, previewLoading: true };
    case 'PREVIEW_SUCCESS':
      return { ...state, previewLoading: false, preview: action.preview };
    case 'PREVIEW_ERROR':
      return { ...state, previewLoading: false };
    case 'SUBMIT_START':
      return { ...state, submitting: true, error: '' };
    case 'SUBMIT_ERROR':
      return { ...state, submitting: false, error: action.error };
    default:
      return state;
  }
}

export interface NewDocRequestModalProps {
  templates: Template[];
  purposes: Purpose[];
  onClose: () => void;
  onSuccess: () => void;
}

export function NewDocRequestModal({
  templates,
  purposes,
  onClose,
  onSuccess,
}: NewDocRequestModalProps) {
  const [state, dispatch] = useReducer(wizardReducer, initialWizardState);
  const {
    step,
    form,
    preview,
    previewLoading,
    submitting: loading,
    error,
  } = state;
  const selected = templates.find((t) => t.id === form.templateId);

  const loadPreview = async () => {
    if (!form.templateId) return;
    dispatch({ type: 'PREVIEW_START' });
    try {
      const p = await apiClient.get<DocPreview>(
        `/declarations/documents/templates/${form.templateId}/preview`,
      );
      dispatch({ type: 'PREVIEW_SUCCESS', preview: p });
    } catch {
      dispatch({ type: 'PREVIEW_ERROR' });
    }
  };

  const handleSubmit = async () => {
    dispatch({ type: 'SUBMIT_START' });
    try {
      await apiClient.post('/declarations/documents', {
        ...form,
        purposeId: form.purposeId || undefined,
      });
      onSuccess();
      onClose();
    } catch (e) {
      dispatch({
        type: 'SUBMIT_ERROR',
        error: e instanceof Error ? e.message : String(e),
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-900">Solicitar Declaração</h2>
              <div className="flex gap-1.5 mt-1.5">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`h-1.5 w-8 rounded-full transition-colors ${step >= s ? 'bg-blue-600' : 'bg-gray-200'}`}
                  />
                ))}
                <span className="text-xs text-gray-400 ml-1">
                  Passo {step}/3
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-sm">
              <AlertCircle size={15} />
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">
                Seleccione o tipo de declaração
              </p>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() =>
                      dispatch({
                        type: 'SET_FIELD',
                        field: 'templateId',
                        value: t.id,
                      })
                    }
                    className={`w-full flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${form.templateId === t.id ? 'border-blue-500 bg-blue-50' : 'border-gray-100 hover:border-gray-200'}`}
                  >
                    <div
                      className={`p-2 rounded-xl flex-shrink-0 ${form.templateId === t.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}
                    >
                      <FileText size={16} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {t.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {t.purpose?.name} · v{t.version} · {t.language}
                      </p>
                      {t.requiresApproval && (
                        <span className="text-xs text-amber-600 mt-0.5 flex items-center gap-1">
                          <Clock size={10} />
                          Requer aprovação
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Finalidade
                </label>
                <select
                  value={form.purposeId}
                  onChange={(e) =>
                    dispatch({
                      type: 'SET_FIELD',
                      field: 'purposeId',
                      value: +e.target.value,
                    })
                  }
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value={0}>Seleccionar finalidade...</option>
                  {purposes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Dirigida a (opcional)
                </label>
                <input
                  value={form.addressedTo}
                  onChange={(e) =>
                    dispatch({
                      type: 'SET_FIELD',
                      field: 'addressedTo',
                      value: e.target.value,
                    })
                  }
                  placeholder="Ex: Banco Angolano de Investimentos"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Observações
                </label>
                <textarea
                  value={form.observations}
                  onChange={(e) =>
                    dispatch({
                      type: 'SET_FIELD',
                      field: 'observations',
                      value: e.target.value,
                    })
                  }
                  rows={2}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <button
                onClick={loadPreview}
                className="w-full py-2 text-sm text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
              >
                {previewLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Eye size={14} />
                )}
                {preview ? 'Recarregar Preview' : 'Ver Preview'}
              </button>
              {preview && (
                <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 max-h-48 overflow-y-auto">
                  <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans">
                    {preview.previewHtml.replace(/<[^>]*>/g, ' ').trim()}
                  </pre>
                </div>
              )}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Template</span>
                  <span className="font-medium">{selected?.name}</span>
                </div>
                {form.addressedTo && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Dirigida a</span>
                    <span className="font-medium">{form.addressedTo}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-500">Aprovação</span>
                  <span
                    className={
                      selected?.requiresApproval
                        ? 'text-amber-600'
                        : 'text-emerald-600'
                    }
                  >
                    {selected?.requiresApproval ? 'Necessária' : 'Automática'}
                  </span>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.saveAsDraft}
                  onChange={(e) =>
                    dispatch({
                      type: 'SET_FIELD',
                      field: 'saveAsDraft',
                      value: e.target.checked,
                    })
                  }
                  className="w-4 h-4 rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm text-gray-700">
                  Guardar como rascunho
                </span>
              </label>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-3">
          {step > 1 && (
            <button
              onClick={() => dispatch({ type: 'PREV_STEP' })}
              className="px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
            >
              ← Voltar
            </button>
          )}
          <button
            onClick={onClose}
            className="px-3 py-2.5 text-sm text-gray-500 hover:text-gray-700"
          >
            Cancelar
          </button>
          <div className="flex-1" />
          {step < 3 ? (
            <button
              onClick={() => dispatch({ type: 'NEXT_STEP' })}
              disabled={step === 1 && !form.templateId}
              className="px-5 py-2.5 text-sm text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-40"
            >
              Continuar →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-5 py-2.5 text-sm text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : null}
              {form.saveAsDraft ? 'Guardar' : 'Submeter'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
