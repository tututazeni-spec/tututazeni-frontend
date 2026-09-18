// components/courses-modulos/ModuleModal.tsx
// Modal de criação/edição de módulo. Extraído de
// app/(platform)/courses/modulos/page.tsx; campos alinhados com a secção
// "3. Novo Módulo" de docs/06-modulo-courses.md.
//
// Achado real ao expandir este modal: `POST /modules` e `PUT /modules/:id`
// apontavam para rotas que nunca existiram no backend (courses.controller.ts
// só regista rotas aninhadas sob /courses) — toda a criação/edição de
// módulos rebentava sempre com 404. Corrigido aqui para
// /courses/:courseId/modules[/:moduleId].

'use client';

import { useState } from 'react';
import { Pencil, Package } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { FormField } from '@/components/ui/FormField';
import { Card, CardBody } from '@/components/ui/Card';
import { useToast } from '@/providers/ToastProvider';
import { CourseImageField } from '@/components/courses/CourseImageField';
import type { CourseModule } from './types';

interface CompetencyOption {
  id: number;
  name: string;
}

interface ModuleModalProps {
  courseId: number;
  editing: CourseModule | null;
  /** Outros módulos do curso — para escolher o módulo pré-requisito. */
  otherModules: CourseModule[];
  onClose: () => void;
  onSaved: () => void;
}

const STATUS_ITEMS = [
  { value: 'DRAFT', label: 'Rascunho' },
  { value: 'PUBLISHED', label: 'Publicado' },
  { value: 'PAUSED', label: 'Em pausa' },
  { value: 'ARCHIVED', label: 'Arquivado' },
];

const TYPE_ITEMS = [
  { value: 'THEORETICAL', label: 'Teórico' },
  { value: 'PRACTICAL', label: 'Prático' },
  { value: 'ASSESSMENT', label: 'Avaliação' },
  { value: 'PROJECT', label: 'Projecto' },
];

const PROGRESSION_ITEMS = [
  { value: 'SEQUENTIAL', label: 'Sequencial (ordem obrigatória)' },
  { value: 'FREE', label: 'Livre' },
  { value: 'HYBRID', label: 'Híbrida' },
];

export function ModuleModal({
  courseId,
  editing,
  otherModules,
  onClose,
  onSaved,
}: ModuleModalProps) {
  const notify = useToast();
  const [form, setForm] = useState({
    title: editing?.title ?? '',
    code: editing?.code ?? '',
    description: editing?.description ?? '',
    thumbnailUrl: editing?.thumbnailUrl ?? '',
    seq: editing?.seq ?? 1,
    status: editing?.status ?? 'DRAFT',
    type: editing?.type ?? '',
    progressionType: editing?.progressionType ?? 'SEQUENTIAL',
    mandatory: editing?.mandatory ?? true,
    allowSkip: editing?.allowSkip ?? false,
    minCompletionPercent:
      editing?.minCompletionPercent != null ? String(editing.minCompletionPercent) : '100',
    requiresMinScore: editing?.minQuizScore != null,
    minQuizScore: editing?.minQuizScore != null ? String(editing.minQuizScore) : '',
    estimatedDurationMinutes:
      editing?.estimatedDurationMinutes != null ? String(editing.estimatedDurationMinutes) : '',
    learningObjectives: (editing?.learningObjectives ?? []).join('\n'),
    requiredModuleId: editing?.requiredModuleId ? String(editing.requiredModuleId) : '',
  });
  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  const { data: competenciesResp } = useApiQuery<{ data: CompetencyOption[] }>(
    ['courses-modulos', 'competencies-picker'],
    '/competencies',
    { params: { limit: 200 }, staleTime: STALE_TIME.SEMI_STATIC },
  );
  const competencyOptions = competenciesResp?.data ?? [];
  const [competencyIds, setCompetencyIds] = useState<number[]>(
    editing?.competencies?.map((c) => c.competency.id) ?? [],
  );
  function toggleCompetency(id: number) {
    setCompetencyIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]));
  }

  const prerequisiteItems = otherModules
    .filter((m) => m.id !== editing?.id)
    .sort((a, b) => a.seq - b.seq)
    .map((m) => ({ value: String(m.id), label: `${m.seq}. ${m.title}` }));

  const totalLessons = editing?.lessons.length ?? 0;
  const totalWorkloadMinutes = (editing?.lessons ?? []).reduce(
    (sum, l) => sum + (l.durationMinutes ?? 0),
    0,
  );
  const totalMaterials = editing?.materials?.length ?? 0;
  const linkedAssessments = editing?.assessments ?? [];

  const saveModule = useApiMutation(
    () => {
      const payload: Record<string, unknown> = {
        title: form.title,
        code: form.code.trim() || undefined,
        description: form.description.trim() || undefined,
        thumbnailUrl: form.thumbnailUrl || undefined,
        seq: +form.seq,
        status: form.status,
        type: form.type || undefined,
        progressionType: form.progressionType,
        mandatory: form.mandatory,
        allowSkip: form.allowSkip,
        minCompletionPercent:
          form.minCompletionPercent !== '' ? +form.minCompletionPercent : undefined,
        minQuizScore:
          form.requiresMinScore && form.minQuizScore !== '' ? +form.minQuizScore : null,
        estimatedDurationMinutes:
          form.estimatedDurationMinutes !== '' ? +form.estimatedDurationMinutes : undefined,
        learningObjectives: form.learningObjectives
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
        requiredModuleId: form.requiredModuleId ? +form.requiredModuleId : null,
        competencyIds,
      };
      return editing
        ? apiClient.put(`/courses/${courseId}/modules/${editing.id}`, payload)
        : apiClient.post(`/courses/${courseId}/modules`, payload);
    },
    {
      invalidateKeys: [queryKeys.courses.all],
      onSuccess: () => {
        onSaved();
        onClose();
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );
  const saving = saveModule.isPending;
  function submit(e: React.FormEvent) {
    e.preventDefault();
    saveModule.mutate(undefined);
  }
  return (
    <div
      className="fixed inset-0 z-500 bg-black/45 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-elevated"
        onClick={(e) => e.stopPropagation()}
      >
        <CardBody className="flex flex-col gap-5">
          <div className="flex justify-between items-center">
            <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
              {editing ? (
                <>
                  <Pencil size={18} strokeWidth={1.75} /> Editar Módulo
                </>
              ) : (
                <>
                  <Package size={18} strokeWidth={1.75} /> Novo Módulo
                </>
              )}
            </h2>
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="text-2xl text-ink-faint hover:text-ink transition-colors"
            >
              ×
            </button>
          </div>

          <form onSubmit={submit} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Título *" htmlFor="module-title">
                <Input
                  id="module-title"
                  value={form.title}
                  onChange={(e) => set('title', e.target.value)}
                  required
                />
              </FormField>
              <FormField label="Código" htmlFor="module-code">
                <Input
                  id="module-code"
                  value={form.code}
                  onChange={(e) => set('code', e.target.value)}
                  placeholder="Ex: MOD-01"
                />
              </FormField>
            </div>

            <FormField label="Descrição" htmlFor="module-description">
              <Textarea
                id="module-description"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                rows={2}
              />
            </FormField>

            <FormField label="Imagem" htmlFor="module-image">
              <CourseImageField
                value={form.thumbnailUrl || null}
                onChange={(v) => set('thumbnailUrl', v ?? '')}
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Sequência" htmlFor="module-seq">
                <Input
                  id="module-seq"
                  type="number"
                  min={1}
                  value={form.seq}
                  onChange={(e) => set('seq', +e.target.value)}
                />
              </FormField>
              <FormField label="Estado" htmlFor="module-status">
                <Select
                  items={STATUS_ITEMS}
                  value={form.status}
                  onValueChange={(v) => set('status', v as typeof form.status)}
                  className="w-full"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Tipo" htmlFor="module-type">
                <Select
                  items={TYPE_ITEMS}
                  value={form.type || undefined}
                  onValueChange={(v) => set('type', v)}
                  className="w-full"
                  placeholder="Não definido"
                />
              </FormField>
              <FormField label="Progressão" htmlFor="module-progression">
                <Select
                  items={PROGRESSION_ITEMS}
                  value={form.progressionType}
                  onValueChange={(v) => set('progressionType', v as typeof form.progressionType)}
                  className="w-full"
                />
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Duração estimada (min)" htmlFor="module-duration">
                <Input
                  id="module-duration"
                  type="number"
                  min={0}
                  value={form.estimatedDurationMinutes}
                  onChange={(e) => set('estimatedDurationMinutes', e.target.value)}
                />
              </FormField>
              <FormField label="% mínima de conclusão" htmlFor="module-min-completion">
                <Input
                  id="module-min-completion"
                  type="number"
                  min={0}
                  max={100}
                  value={form.minCompletionPercent}
                  onChange={(e) => set('minCompletionPercent', e.target.value)}
                />
              </FormField>
            </div>

            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-xs text-ink-muted">
                <input
                  type="checkbox"
                  checked={form.requiresMinScore}
                  onChange={(e) => set('requiresMinScore', e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-border-strong accent-primary"
                />
                Requer nota mínima
              </label>
              {form.requiresMinScore && (
                <FormField label="Nota mínima do quiz (%)" htmlFor="module-min-quiz">
                  <Input
                    id="module-min-quiz"
                    type="number"
                    min={0}
                    max={100}
                    value={form.minQuizScore}
                    onChange={(e) => set('minQuizScore', e.target.value)}
                  />
                </FormField>
              )}
            </div>

            {prerequisiteItems.length > 0 && (
              <FormField label="Módulo pré-requisito" htmlFor="module-required">
                <Select
                  items={prerequisiteItems}
                  value={form.requiredModuleId || undefined}
                  onValueChange={(v) => set('requiredModuleId', v)}
                  className="w-full"
                  placeholder="Nenhum"
                />
              </FormField>
            )}

            <FormField label="Objectivos de aprendizagem" htmlFor="module-objectives">
              <Textarea
                id="module-objectives"
                value={form.learningObjectives}
                onChange={(e) => set('learningObjectives', e.target.value)}
                rows={3}
                placeholder={'Um objectivo por linha'}
              />
            </FormField>

            <FormField label="Competências associadas" htmlFor="module-competencies">
              <div className="max-h-36 space-y-1 overflow-y-auto rounded-control border border-border p-2">
                {competencyOptions.length === 0 && (
                  <p className="text-xs text-ink-faint">Sem competências cadastradas.</p>
                )}
                {competencyOptions.map((c) => (
                  <label key={c.id} className="flex items-center gap-2 text-xs text-ink-muted">
                    <input
                      type="checkbox"
                      checked={competencyIds.includes(c.id)}
                      onChange={() => toggleCompetency(c.id)}
                      className="h-3.5 w-3.5 rounded border-border-strong accent-primary"
                    />
                    {c.name}
                  </label>
                ))}
              </div>
            </FormField>

            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-xs text-ink-muted">
                <input
                  type="checkbox"
                  checked={form.mandatory}
                  onChange={(e) => set('mandatory', e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-border-strong accent-primary"
                />
                Módulo obrigatório
              </label>
              <label className="flex items-center gap-2 text-xs text-ink-muted">
                <input
                  type="checkbox"
                  checked={form.allowSkip}
                  onChange={(e) => set('allowSkip', e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-border-strong accent-primary"
                />
                Pode avançar sem concluir
              </label>
            </div>

            {editing && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-control border border-border bg-surface-sunken p-3 text-xs text-ink-muted">
                <span>
                  Nº de lições: <strong className="text-ink">{totalLessons}</strong>
                </span>
                <span>
                  Carga horária:{' '}
                  <strong className="text-ink">
                    {totalWorkloadMinutes > 0 ? `${totalWorkloadMinutes} min` : '—'}
                  </strong>
                </span>
                <span>
                  Recursos: <strong className="text-ink">{totalMaterials}</strong>
                </span>
                <span>
                  Avaliação associada:{' '}
                  <strong className="text-ink">
                    {linkedAssessments.length > 0
                      ? linkedAssessments.map((a) => a.title).join(', ')
                      : '—'}
                  </strong>
                </span>
              </div>
            )}

            <div className="flex gap-2 justify-end pt-2 border-t border-border">
              <Button type="button" onClick={onClose} intent="ghost">
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={saving}
                intent="primary"
                loading={saving}
              >
                {saving ? 'A guardar...' : editing ? 'Guardar' : 'Criar'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
