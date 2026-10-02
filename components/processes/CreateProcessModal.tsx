// components/processes/CreateProcessModal.tsx
// Modal de criação/edição de MODELO de processo (docs/Modulo_Processes.md §5).
// Sem `initial` cria (POST /processes, fica DRAFT); com `initial` edita o
// rascunho (PUT /processes/:id — o backend só permite DRAFT e recusa trocar
// etapas que já tenham instâncias com progresso).
//
// Etapas: ordem = posição na lista (0-based). `dependsOnOrders` referencia
// essas ordens; sem dependências, a etapa é sequencial (depende da anterior)
// ou, se marcada «paralela», arranca logo com a instância.

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
import { SOURCE_MODULES } from './StartProcessModal';
import { UserPicker } from './UserPicker';
import type { Process, RiskLevel, StepType } from './types';

export interface CreateProcessModalProps {
  /** Modelo a editar (só rascunhos). Omitido → criação. */
  initial?: Process;
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

const CONFIDENTIALITY_ITEMS = [
  { value: 'PUBLIC', label: 'Público' },
  { value: 'INTERNAL', label: 'Interno' },
  { value: 'CONFIDENTIAL', label: 'Confidencial' },
  { value: 'RESTRICTED', label: 'Restrito' },
];

interface StepDraft {
  type: StepType;
  title: string;
  description: string;
  responsibleRole: string;
  responsibleId: string;
  reviewerId: string;
  slaHours: string;
  checklist: string;
  requiresUpload: boolean;
  parallel: boolean;
  dependsOnOrders: number[];
  /** Preservados tal como vieram do servidor (não editáveis aqui). */
  formSchema: string | null;
  exitConditions: string | null;
}

const emptyStep = (): StepDraft => ({
  type: 'TASK',
  title: '',
  description: '',
  responsibleRole: '',
  responsibleId: '',
  reviewerId: '',
  slaHours: '',
  checklist: '',
  requiresUpload: false,
  parallel: false,
  dependsOnOrders: [],
  formSchema: null,
  exitConditions: null,
});

const toDateInput = (iso: string | null | undefined) => (iso ? iso.slice(0, 10) : '');
const lines = (v: string) => v.split('\n').map((l) => l.trim()).filter(Boolean);
const csv = (v: string) => v.split(',').map((l) => l.trim()).filter(Boolean);
const parseJson = (raw: string | null) => {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return undefined;
  }
};

function flattenTree(
  nodes: DepartmentNode[],
  depth = 0,
): Array<{ value: string; label: string }> {
  return nodes.flatMap((n) => [
    { value: String(n.id), label: `${'— '.repeat(depth)}${n.name}` },
    ...flattenTree(n.children ?? [], depth + 1),
  ]);
}

export function CreateProcessModal({ initial, onClose }: CreateProcessModalProps) {
  const notify = useToast();
  const editing = !!initial;

  const [title, setTitle] = useState(initial?.title ?? '');
  const [code, setCode] = useState(initial?.code ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [objective, setObjective] = useState(initial?.objective ?? '');
  const [category, setCategory] = useState(initial?.category ?? '');
  const [departmentId, setDepartmentId] = useState(
    initial?.department ? String(initial.department.id) : NO_DEPT,
  );
  const [ownerId, setOwnerId] = useState(initial ? String(initial.owner.id) : '');
  const [riskLevel, setRiskLevel] = useState<RiskLevel>(initial?.riskLevel ?? 'LOW');
  const [tags, setTags] = useState(initial?.tags.join(', ') ?? '');
  const [modules, setModules] = useState<string[]>(initial?.involvedModules ?? []);
  const [defaultSla, setDefaultSla] = useState(
    initial?.defaultSlaHours ? String(initial.defaultSlaHours) : '',
  );
  const [effectiveFrom, setEffectiveFrom] = useState(toDateInput(initial?.effectiveFrom));
  const [nextReview, setNextReview] = useState(toDateInput(initial?.nextReviewDate));
  const [reviewPolicy, setReviewPolicy] = useState(initial?.reviewPolicy ?? '');
  const [confidentiality, setConfidentiality] = useState(initial?.confidentiality ?? 'INTERNAL');
  const [accessRoles, setAccessRoles] = useState(initial?.accessRoles.join(', ') ?? '');
  const [requiredDocs, setRequiredDocs] = useState(initial?.requiredDocuments.join('\n') ?? '');
  const [approvalRules, setApprovalRules] = useState(initial?.approvalRules ?? '');
  const [startConditions, setStartConditions] = useState(initial?.startConditions ?? '');
  const [completionConditions, setCompletionConditions] = useState(
    initial?.completionConditions ?? '',
  );
  const [steps, setSteps] = useState<StepDraft[]>(
    initial && initial.steps.length
      ? [...initial.steps]
          .sort((a, b) => a.order - b.order)
          .map((s) => ({
            type: s.type,
            title: s.title,
            description: s.description ?? '',
            responsibleRole: s.responsibleRole ?? '',
            responsibleId: s.responsible ? String(s.responsible.id) : '',
            reviewerId: s.reviewer ? String(s.reviewer.id) : '',
            slaHours: s.slaHours ? String(s.slaHours) : '',
            checklist: s.checklist.join('\n'),
            requiresUpload: s.requiresUpload,
            parallel: s.parallel,
            dependsOnOrders: s.dependsOnOrders ?? [],
            formSchema: s.formSchema ?? null,
            exitConditions: s.exitConditions ?? null,
          }))
      : [emptyStep()],
  );
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
    setSteps((prev) => prev.map((s, i) => (i === idx ? { ...s, ...patch } : s)));
  const addStep = () => setSteps((prev) => [...prev, emptyStep()]);
  // Ao remover uma etapa, as ordens seguintes recuam: as dependências são
  // reescritas para continuarem a apontar para as mesmas etapas.
  const removeStep = (idx: number) =>
    setSteps((prev) =>
      prev
        .filter((_, i) => i !== idx)
        .map((s) => ({
          ...s,
          dependsOnOrders: s.dependsOnOrders
            .filter((o) => o !== idx)
            .map((o) => (o > idx ? o - 1 : o)),
        })),
    );
  const toggleDep = (idx: number, order: number) =>
    patchStep(idx, {
      dependsOnOrders: steps[idx].dependsOnOrders.includes(order)
        ? steps[idx].dependsOnOrders.filter((o) => o !== order)
        : [...steps[idx].dependsOnOrders, order],
    });
  const toggleModule = (m: string) =>
    setModules((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));

  const canSubmit =
    title.trim().length > 0 &&
    code.trim().length > 0 &&
    steps.length > 0 &&
    steps.every((s) => s.title.trim().length > 0);

  const save = useApiMutation(
    (body: Record<string, unknown>) =>
      editing
        ? apiClient.put(`/processes/${initial.id}`, body)
        : apiClient.post('/processes', body),
    {
      invalidateKeys: [queryKeys.processes.all],
      onSuccess: () => {
        notify({
          title: editing ? 'Modelo actualizado' : 'Modelo criado',
          intent: 'success',
        });
        onClose();
      },
      onError: (e) => setSubmitError(e.message || 'Erro ao guardar o modelo.'),
    },
  );
  const loading = save.isPending;

  const handleSubmit = () => {
    if (!canSubmit || loading) return;
    setSubmitError('');
    save.mutate({
      title: title.trim(),
      code: code.trim(),
      riskLevel,
      description: description.trim() || undefined,
      objective: objective.trim() || undefined,
      category: category.trim() || undefined,
      departmentId: departmentId !== NO_DEPT ? Number(departmentId) : undefined,
      ownerId: ownerId ? Number(ownerId) : undefined,
      tags: csv(tags),
      involvedModules: modules,
      defaultSlaHours: defaultSla ? Number(defaultSla) : undefined,
      effectiveFrom: effectiveFrom || undefined,
      nextReviewDate: nextReview || undefined,
      reviewPolicy: reviewPolicy.trim() || undefined,
      confidentiality,
      accessRoles: csv(accessRoles),
      requiredDocuments: lines(requiredDocs),
      approvalRules: approvalRules.trim() || undefined,
      startConditions: startConditions.trim() || undefined,
      completionConditions: completionConditions.trim() || undefined,
      steps: steps.map((s, idx) => ({
        type: s.type,
        title: s.title.trim(),
        order: idx,
        description: s.description.trim() || undefined,
        responsibleRole: s.responsibleRole.trim() || undefined,
        responsibleId: s.responsibleId ? Number(s.responsibleId) : undefined,
        reviewerId: s.reviewerId ? Number(s.reviewerId) : undefined,
        slaHours: s.slaHours ? Number(s.slaHours) : undefined,
        checklist: lines(s.checklist),
        requiresUpload: s.requiresUpload,
        parallel: s.parallel,
        dependsOnOrders: s.dependsOnOrders,
        formSchema: parseJson(s.formSchema),
        exitConditions: parseJson(s.exitConditions),
      })),
    });
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={editing ? `Editar modelo ${initial.code}` : 'Novo modelo de processo'}
        description="Fica como rascunho até ser submetido para revisão e publicado."
        className="max-h-[90vh] max-w-3xl overflow-y-auto"
      >
        <div className="mt-5 space-y-4">
          {submitError && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              {submitError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Nome do modelo *" htmlFor="cp-title">
              <Input id="cp-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Admissão de Colaborador" maxLength={150} />
            </FormField>
            <FormField label="Código do modelo *" htmlFor="cp-code" hint="Identificador único.">
              <Input id="cp-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ex.: RH-ADM-001" maxLength={40} />
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Categoria / tipo" htmlFor="cp-cat" hint="Ex.: RH, Formação, Financeiro, Documental.">
              <Input id="cp-cat" value={category} onChange={(e) => setCategory(e.target.value)} maxLength={60} />
            </FormField>
            <FormField label="Departamento proprietário" htmlFor="cp-dept">
              <Select items={deptItems} value={departmentId} onValueChange={setDepartmentId} className="w-full" />
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Responsável pelo modelo" htmlFor="cp-owner" hint="Por defeito, quem o cria.">
              <UserPicker value={ownerId} onChange={setOwnerId} placeholder="Seleccionar responsável" />
            </FormField>
            <FormField label="Risco" htmlFor="cp-risk">
              <Select items={RISK_ITEMS} value={riskLevel} onValueChange={(v) => setRiskLevel(v as RiskLevel)} className="w-full" />
            </FormField>
          </div>

          <FormField label="Descrição" htmlFor="cp-description">
            <Textarea id="cp-description" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full" />
          </FormField>
          <FormField label="Finalidade" htmlFor="cp-objective">
            <Textarea id="cp-objective" value={objective} onChange={(e) => setObjective(e.target.value)} rows={2} className="w-full" />
          </FormField>

          <FormField label="Módulos envolvidos" htmlFor="cp-modules">
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {SOURCE_MODULES.map((m) => (
                <label key={m} className="flex items-center gap-1.5 font-body text-sm text-ink">
                  <input type="checkbox" checked={modules.includes(m)} onChange={() => toggleModule(m)} />
                  {m}
                </label>
              ))}
            </div>
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField label="Prazo padrão (horas)" htmlFor="cp-sla">
              <Input id="cp-sla" type="number" min={0} value={defaultSla} onChange={(e) => setDefaultSla(e.target.value)} />
            </FormField>
            <FormField label="Entrada em vigor" htmlFor="cp-eff">
              <Input id="cp-eff" type="date" value={effectiveFrom} onChange={(e) => setEffectiveFrom(e.target.value)} />
            </FormField>
            <FormField label="Próxima revisão" htmlFor="cp-rev">
              <Input id="cp-rev" type="date" value={nextReview} onChange={(e) => setNextReview(e.target.value)} />
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Política de revisão" htmlFor="cp-revpol" hint="Ex.: revisão anual pelo RH.">
              <Input id="cp-revpol" value={reviewPolicy} onChange={(e) => setReviewPolicy(e.target.value)} />
            </FormField>
            <FormField label="Nível de confidencialidade" htmlFor="cp-conf">
              <Select items={CONFIDENTIALITY_ITEMS} value={confidentiality} onValueChange={setConfidentiality} className="w-full" />
            </FormField>
          </div>

          <FormField label="Regras de acesso" htmlFor="cp-access" hint="Funções que podem iniciar/ver o modelo, separadas por vírgula (vazio = todas). Ex.: GESTOR, RH.">
            <Input id="cp-access" value={accessRoles} onChange={(e) => setAccessRoles(e.target.value)} />
          </FormField>
          <FormField label="Documentos e formulários necessários" htmlFor="cp-docs" hint="Um por linha.">
            <Textarea id="cp-docs" value={requiredDocs} onChange={(e) => setRequiredDocs(e.target.value)} rows={2} className="w-full" />
          </FormField>
          <FormField label="Regras de aprovação" htmlFor="cp-appr">
            <Textarea id="cp-appr" value={approvalRules} onChange={(e) => setApprovalRules(e.target.value)} rows={2} className="w-full" />
          </FormField>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Condições para iniciar" htmlFor="cp-start">
              <Textarea id="cp-start" value={startConditions} onChange={(e) => setStartConditions(e.target.value)} rows={2} className="w-full" />
            </FormField>
            <FormField label="Condições para concluir" htmlFor="cp-end">
              <Textarea id="cp-end" value={completionConditions} onChange={(e) => setCompletionConditions(e.target.value)} rows={2} className="w-full" />
            </FormField>
          </div>
          <FormField label="Tags" htmlFor="cp-tags" hint="Separadas por vírgula.">
            <Input id="cp-tags" value={tags} onChange={(e) => setTags(e.target.value)} />
          </FormField>

          {/* Etapas */}
          <div className="rounded-card border border-border bg-surface-sunken p-3">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-body text-sm font-medium text-ink">Etapas *</span>
              <Button intent="ghost" size="sm" onClick={addStep}>
                <Plus size={14} strokeWidth={1.75} />
                Adicionar etapa
              </Button>
            </div>

            <div className="space-y-3">
              {steps.map((step, idx) => (
                <div key={idx} className="rounded-card border border-border bg-surface p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-body text-xs font-medium text-ink-faint">Etapa {idx + 1}</span>
                    <Button intent="ghost" size="sm" onClick={() => removeStep(idx)} disabled={steps.length === 1} aria-label={`Remover etapa ${idx + 1}`}>
                      <Trash2 size={14} strokeWidth={1.75} />
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FormField label="Tipo" htmlFor={`cp-step-type-${idx}`}>
                      <Select items={STEP_TYPE_ITEMS} value={step.type} onValueChange={(v) => patchStep(idx, { type: v as StepType })} className="w-full" />
                    </FormField>
                    <FormField label="Título *" htmlFor={`cp-step-title-${idx}`}>
                      <Input id={`cp-step-title-${idx}`} value={step.title} onChange={(e) => patchStep(idx, { title: e.target.value })} placeholder="Ex.: Validar documentação" maxLength={150} />
                    </FormField>
                  </div>

                  <div className="mt-3">
                    <FormField label="Descrição / instruções" htmlFor={`cp-step-desc-${idx}`}>
                      <Input id={`cp-step-desc-${idx}`} value={step.description} onChange={(e) => patchStep(idx, { description: e.target.value })} maxLength={300} />
                    </FormField>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <FormField label="Responsável" htmlFor={`cp-step-resp-${idx}`}>
                      <UserPicker value={step.responsibleId} onChange={(v) => patchStep(idx, { responsibleId: v })} />
                    </FormField>
                    <FormField label="Ou função" htmlFor={`cp-step-role-${idx}`} hint="Atribuição automática à pessoa com menos carga.">
                      <Input id={`cp-step-role-${idx}`} value={step.responsibleRole} onChange={(e) => patchStep(idx, { responsibleRole: e.target.value })} placeholder="Ex.: GESTOR" maxLength={40} />
                    </FormField>
                    <FormField label="Revisor" htmlFor={`cp-step-rev-${idx}`}>
                      <UserPicker value={step.reviewerId} onChange={(v) => patchStep(idx, { reviewerId: v })} />
                    </FormField>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FormField label="Prazo da etapa (horas)" htmlFor={`cp-step-sla-${idx}`}>
                      <Input id={`cp-step-sla-${idx}`} type="number" min={0} value={step.slaHours} onChange={(e) => patchStep(idx, { slaHours: e.target.value })} />
                    </FormField>
                    <FormField label="Lista de verificação / subtarefas" htmlFor={`cp-step-chk-${idx}`} hint="Um item por linha.">
                      <Textarea id={`cp-step-chk-${idx}`} rows={2} value={step.checklist} onChange={(e) => patchStep(idx, { checklist: e.target.value })} className="w-full" />
                    </FormField>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 font-body text-sm text-ink">
                    <label className="flex items-center gap-1.5">
                      <input type="checkbox" checked={step.requiresUpload} onChange={(e) => patchStep(idx, { requiresUpload: e.target.checked })} />
                      Evidência obrigatória
                    </label>
                    <label className="flex items-center gap-1.5">
                      <input type="checkbox" checked={step.parallel} onChange={(e) => patchStep(idx, { parallel: e.target.checked })} />
                      Paralela (arranca logo com o processo)
                    </label>
                    {idx > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-ink-muted">Depende de:</span>
                        {steps.slice(0, idx).map((_, o) => (
                          <label key={o} className="flex items-center gap-1">
                            <input type="checkbox" checked={step.dependsOnOrders.includes(o)} onChange={() => toggleDep(idx, o)} />
                            {o + 1}
                          </label>
                        ))}
                        {step.dependsOnOrders.length === 0 && !step.parallel && (
                          <span className="text-xs text-ink-faint">(sequencial: depende da etapa anterior)</span>
                        )}
                      </div>
                    )}
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
          <Button onClick={handleSubmit} disabled={!canSubmit} loading={loading}>
            {editing ? 'Guardar rascunho' : 'Criar modelo'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
