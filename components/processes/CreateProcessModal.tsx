// components/processes/CreateProcessModal.tsx
// Modal "Novo processo" — separador Biblioteca do módulo de Processos. A
// página só monta o componente quando aberto, por isso o Modal fica sempre
// `open` e delega o fecho em `onClose` (X, Escape, clique fora).
//
// Backend: POST /processes exige @Roles(ADMIN, RH) e espelha CreateProcessDto
// — `title` + `code` obrigatórios, `steps` obrigatório com pelo menos uma
// etapa (cada etapa precisa de `type` + `title` + `order`). O `order` é
// atribuído automaticamente pelo índice da linha ao submeter. O processo é
// criado como DRAFT (default do serviço).
//
// Invalida queryKeys.processes.all para a lista da Biblioteca apanhar o
// processo novo sem refresh.

'use client';

import { useState } from 'react';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/providers/ToastProvider';
import type { DepartmentNode } from '@/components/departments/types';
import { RISK_LEVEL_MAP, STEP_TYPE_MAP } from './constants';
import type { RiskLevel, StepType } from './types';

export interface CreateProcessModalProps {
  onClose: () => void;
}

const NO_DEPT = 'NONE';

const RISK_ITEMS = (Object.keys(RISK_LEVEL_MAP) as RiskLevel[]).map((r) => ({
  value: r,
  label: RISK_LEVEL_MAP[r].label,
}));

const STEP_TYPE_ITEMS = (Object.keys(STEP_TYPE_MAP) as StepType[]).map((t) => ({
  value: t,
  label: STEP_TYPE_MAP[t].label,
}));

interface StepDraft {
  type: StepType;
  title: string;
  description: string;
  responsibleRole: string;
}

const emptyStep = (): StepDraft => ({
  type: 'TASK',
  title: '',
  description: '',
  responsibleRole: '',
});

function flattenTree(
  nodes: DepartmentNode[],
  depth = 0,
): Array<{ value: string; label: string }> {
  return nodes.flatMap((n) => [
    { value: String(n.id), label: `${'— '.repeat(depth)}${n.name}` },
    ...flattenTree(n.children ?? [], depth + 1),
  ]);
}

export function CreateProcessModal({ onClose }: CreateProcessModalProps) {
  const notify = useToast();

  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [departmentId, setDepartmentId] = useState(NO_DEPT);
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('LOW');
  const [tags, setTags] = useState('');
  const [steps, setSteps] = useState<StepDraft[]>([emptyStep()]);
  const [submitError, setSubmitError] = useState('');

  const { data: tree } = useApiQuery<DepartmentNode[]>(
    queryKeys.departments.tree(),
    '/departments/tree',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  const deptItems = [
    { value: NO_DEPT, label: 'Sem departamento' },
    ...flattenTree(tree ?? []),
  ];

  const patchStep = (idx: number, patch: Partial<StepDraft>) =>
    setSteps((prev) =>
      prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)),
    );
  const addStep = () => setSteps((prev) => [...prev, emptyStep()]);
  const removeStep = (idx: number) =>
    setSteps((prev) => prev.filter((_, i) => i !== idx));

  const canSubmit =
    title.trim().length > 0 &&
    code.trim().length > 0 &&
    steps.length > 0 &&
    steps.every((s) => s.title.trim().length > 0);

  const createProcess = useApiMutation(
    (body: Record<string, unknown>) => apiClient.post('/processes', body),
    {
      invalidateKeys: [queryKeys.processes.all],
      onSuccess: () => {
        notify({ title: 'Processo criado', intent: 'success' });
        onClose();
      },
      onError: (e) =>
        setSubmitError(
          e.message || 'Erro ao criar o processo. Tente novamente.',
        ),
    },
  );
  const loading = createProcess.isPending;

  const handleSubmit = () => {
    if (!canSubmit || loading) return;
    setSubmitError('');

    const tagList = tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    createProcess.mutate({
      title: title.trim(),
      code: code.trim(),
      riskLevel,
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(departmentId !== NO_DEPT
        ? { departmentId: Number(departmentId) }
        : {}),
      ...(tagList.length ? { tags: tagList } : {}),
      steps: steps.map((s, idx) => ({
        type: s.type,
        title: s.title.trim(),
        order: idx,
        ...(s.description.trim() ? { description: s.description.trim() } : {}),
        ...(s.responsibleRole.trim()
          ? { responsibleRole: s.responsibleRole.trim() }
          : {}),
      })),
    });
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Novo processo"
        description="Cria um processo standard (BPM/SOP). Fica como rascunho até ser submetido para revisão."
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        <div className="mt-5 space-y-4">
          {submitError && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              {submitError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Título *" htmlFor="cp-title">
              <Input
                id="cp-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex.: Admissão de Colaborador"
                maxLength={150}
              />
            </FormField>

            <FormField
              label="Código *"
              htmlFor="cp-code"
              hint="Identificador único do processo."
            >
              <Input
                id="cp-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ex.: RH-ADM-001"
                maxLength={40}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Departamento" htmlFor="cp-dept">
              <Select
                items={deptItems}
                value={departmentId}
                onValueChange={setDepartmentId}
                className="w-full"
              />
            </FormField>

            <FormField label="Risco" htmlFor="cp-risk">
              <Select
                items={RISK_ITEMS}
                value={riskLevel}
                onValueChange={(v) => setRiskLevel(v as RiskLevel)}
                className="w-full"
              />
            </FormField>
          </div>

          <FormField label="Descrição" htmlFor="cp-description">
            <Textarea
              id="cp-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opcional — uma ou duas frases sobre o processo."
              rows={2}
              className="w-full"
            />
          </FormField>

          <FormField
            label="Tags"
            htmlFor="cp-tags"
            hint="Opcional — separadas por vírgula."
          >
            <Input
              id="cp-tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Ex.: onboarding, rh, compliance"
            />
          </FormField>

          {/* Etapas */}
          <div className="rounded-card border border-border bg-surface-sunken p-3">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-body text-sm font-medium text-ink">
                Etapas *
              </span>
              <Button intent="ghost" size="sm" onClick={addStep}>
                <Plus size={14} strokeWidth={1.75} />
                Adicionar etapa
              </Button>
            </div>

            <div className="space-y-3">
              {steps.map((step, idx) => (
                <div
                  key={idx}
                  className="rounded-card border border-border bg-surface p-3"
                >
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-body text-xs font-medium text-ink-faint">
                      Etapa {idx + 1}
                    </span>
                    <Button
                      intent="ghost"
                      size="sm"
                      onClick={() => removeStep(idx)}
                      disabled={steps.length === 1}
                      aria-label={`Remover etapa ${idx + 1}`}
                    >
                      <Trash2 size={14} strokeWidth={1.75} />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FormField label="Tipo" htmlFor={`cp-step-type-${idx}`}>
                      <Select
                        items={STEP_TYPE_ITEMS}
                        value={step.type}
                        onValueChange={(v) =>
                          patchStep(idx, { type: v as StepType })
                        }
                        className="w-full"
                      />
                    </FormField>

                    <FormField
                      label="Título *"
                      htmlFor={`cp-step-title-${idx}`}
                    >
                      <Input
                        id={`cp-step-title-${idx}`}
                        value={step.title}
                        onChange={(e) =>
                          patchStep(idx, { title: e.target.value })
                        }
                        placeholder="Ex.: Validar documentação"
                        maxLength={150}
                      />
                    </FormField>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FormField
                      label="Papel responsável"
                      htmlFor={`cp-step-role-${idx}`}
                      hint="Opcional."
                    >
                      <Input
                        id={`cp-step-role-${idx}`}
                        value={step.responsibleRole}
                        onChange={(e) =>
                          patchStep(idx, { responsibleRole: e.target.value })
                        }
                        placeholder="Ex.: GESTOR"
                        maxLength={40}
                      />
                    </FormField>

                    <FormField
                      label="Descrição"
                      htmlFor={`cp-step-desc-${idx}`}
                      hint="Opcional."
                    >
                      <Input
                        id={`cp-step-desc-${idx}`}
                        value={step.description}
                        onChange={(e) =>
                          patchStep(idx, { description: e.target.value })
                        }
                        placeholder="O que acontece nesta etapa."
                        maxLength={200}
                      />
                    </FormField>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button intent="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            loading={loading}
          >
            Criar processo
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
