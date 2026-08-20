// components/declarations/NewDocRequestModal.tsx
// Wizard de 3 passos para solicitar uma declaração/documento. Migrado para a
// fundação de design: backdrop+painel bespoke passam a Modal/ModalContent
// (Radix Dialog, components/ui/Modal) — já traz título, botão fechar e
// overlay/backdrop-click de série; inputs/select/textarea passam a
// FormField+Input/Select/Textarea (components/ui/*); botões passam a Button
// (components/ui/Button). O checkbox "Guardar como rascunho" fica como
// workaround nativo (`accent-primary`) — `components/ui/` não tem
// `Checkbox` (ver constraint do rollout). Extraído de
// app/(platform)/declarations/page.tsx.
//
// Wizard de 3 passos: step/form avançam juntos e preview/previewLoading só
// fazem sentido no passo 3. Um reducer com acções por passo torna as
// transições explícitas e evita estados impossíveis (ex: previewLoading=true
// no passo 1) que useState soltos não impediam.

'use client';

import { useReducer } from 'react';
import { AlertCircle, Clock, Eye, FileText, Loader2 } from 'lucide-react';
import { reportError } from '@/lib/errorReporting';
import { apiClient } from '@/lib/apiClient';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
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
    } catch (e) {
      reportError(e, { source: 'NewDocRequestModal.loadPreview' });
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
      reportError(e, { source: 'NewDocRequestModal.handleSubmit' });
      dispatch({
        type: 'SUBMIT_ERROR',
        error: e instanceof Error ? e.message : String(e),
      });
    }
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Solicitar Declaração"
        className="max-h-[90vh] max-w-xl overflow-y-auto"
      >
        <div className="mt-1.5 flex items-center gap-1.5">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                'h-1.5 w-8 rounded-full transition-colors',
                step >= s ? 'bg-primary' : 'bg-surface-sunken',
              )}
            />
          ))}
          <span className="ml-1 font-body text-xs text-ink-faint">
            Passo {step}/3
          </span>
        </div>

        <div className="mt-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 font-body text-sm text-danger-ink">
              <AlertCircle size={15} strokeWidth={1.75} />
              {error}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <p className="font-body text-sm font-medium text-ink">
                Seleccione o tipo de declaração
              </p>
              <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
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
                    className={cn(
                      'flex w-full items-start gap-3 rounded-card border-2 p-3 text-left transition-all',
                      form.templateId === t.id
                        ? 'border-primary bg-primary-subtle'
                        : 'border-border hover:border-border-strong',
                    )}
                  >
                    <div
                      className={cn(
                        'flex-shrink-0 rounded-control p-2',
                        form.templateId === t.id
                          ? 'bg-primary text-canvas'
                          : 'bg-surface-sunken text-ink-muted',
                      )}
                    >
                      <FileText size={16} strokeWidth={1.75} />
                    </div>
                    <div>
                      <p className="font-body text-sm font-semibold text-ink">
                        {t.name}
                      </p>
                      <p className="mt-0.5 font-body text-xs text-ink-faint">
                        {t.purpose?.name} · v{t.version} · {t.language}
                      </p>
                      {t.requiresApproval && (
                        <span className="mt-0.5 flex items-center gap-1 font-body text-xs text-warning-ink">
                          <Clock size={10} strokeWidth={1.75} />
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
              <FormField label="Finalidade" htmlFor="doc-purpose">
                <Select
                  items={purposes.map((p) => ({
                    value: String(p.id),
                    label: p.name,
                  }))}
                  placeholder="Seleccionar finalidade..."
                  value={form.purposeId ? String(form.purposeId) : undefined}
                  onValueChange={(v) =>
                    dispatch({
                      type: 'SET_FIELD',
                      field: 'purposeId',
                      value: Number(v),
                    })
                  }
                  className="w-full"
                />
              </FormField>
              <FormField
                label="Dirigida a (opcional)"
                htmlFor="doc-addressed-to"
              >
                <Input
                  id="doc-addressed-to"
                  value={form.addressedTo}
                  onChange={(e) =>
                    dispatch({
                      type: 'SET_FIELD',
                      field: 'addressedTo',
                      value: e.target.value,
                    })
                  }
                  placeholder="Ex: Banco Angolano de Investimentos"
                  className="w-full"
                />
              </FormField>
              <FormField label="Observações" htmlFor="doc-observations">
                <Textarea
                  id="doc-observations"
                  value={form.observations}
                  onChange={(e) =>
                    dispatch({
                      type: 'SET_FIELD',
                      field: 'observations',
                      value: e.target.value,
                    })
                  }
                  rows={2}
                  className="w-full resize-none"
                />
              </FormField>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <Button
                intent="secondary"
                size="sm"
                className="w-full"
                onClick={loadPreview}
              >
                {previewLoading ? (
                  <Loader2
                    size={14}
                    strokeWidth={1.75}
                    className="animate-spin"
                  />
                ) : (
                  <Eye size={14} strokeWidth={1.75} />
                )}
                {preview ? 'Recarregar Preview' : 'Ver Preview'}
              </Button>
              {preview && (
                <div className="max-h-48 overflow-y-auto rounded-card border border-border bg-surface-sunken p-4">
                  <pre className="whitespace-pre-wrap font-body text-xs text-ink-muted">
                    {preview.previewHtml.replace(/<[^>]*>/g, ' ').trim()}
                  </pre>
                </div>
              )}
              <div className="space-y-2 rounded-card bg-surface-sunken p-4 font-body text-sm">
                <div className="flex justify-between">
                  <span className="text-ink-muted">Template</span>
                  <span className="font-medium text-ink">{selected?.name}</span>
                </div>
                {form.addressedTo && (
                  <div className="flex justify-between">
                    <span className="text-ink-muted">Dirigida a</span>
                    <span className="font-medium text-ink">
                      {form.addressedTo}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-ink-muted">Aprovação</span>
                  <span
                    className={
                      selected?.requiresApproval
                        ? 'text-warning-ink'
                        : 'text-success-ink'
                    }
                  >
                    {selected?.requiresApproval ? 'Necessária' : 'Automática'}
                  </span>
                </div>
              </div>
              <label className="flex cursor-pointer items-center gap-2">
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
                  className="h-4 w-4 rounded border-border-strong accent-primary"
                />
                <span className="font-body text-sm text-ink">
                  Guardar como rascunho
                </span>
              </label>
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          {step > 1 && (
            <Button
              intent="secondary"
              onClick={() => dispatch({ type: 'PREV_STEP' })}
            >
              ← Voltar
            </Button>
          )}
          <Button intent="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <div className="flex-1" />
          {step < 3 ? (
            <Button
              onClick={() => dispatch({ type: 'NEXT_STEP' })}
              disabled={step === 1 && !form.templateId}
            >
              Continuar →
            </Button>
          ) : (
            <Button onClick={handleSubmit} loading={loading}>
              {form.saveAsDraft ? 'Guardar' : 'Submeter'}
            </Button>
          )}
        </div>
      </ModalContent>
    </Modal>
  );
}
