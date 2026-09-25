// components/roi-impact/NewImpactRecordModal.tsx
// "Novo Registo de Impacto" (docs/roi-impact.md §3) — liga uma iniciativa a
// um indicador de negócio real. Um único formulário (o spec não pede um
// wizard aqui, ao contrário de "Nova Análise de ROI" em §2). A iniciativa
// nunca é copiada — só initiativeType+initiativeId, resolvidos pelo backend.

'use client';

import { useMemo, useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { DepartmentUserPicker } from '@/components/departments/DepartmentUserPicker';
import type { DirectoryUser } from '@/components/departments/departmentFormData';
import { INITIATIVE_TYPE_LABELS, IMPACT_CATEGORY_LABELS, IMPACT_SUBJECT_TYPE_LABELS } from './utils';
import type {
  ImpactCategory,
  ImpactSubjectType,
  InitiativeOption,
  RoiInitiativeType,
} from './types';

const SUBJECT_TYPE_ITEMS = Object.entries(IMPACT_SUBJECT_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));
const INITIATIVE_TYPE_ITEMS = Object.entries(INITIATIVE_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));
const CATEGORY_ITEMS = Object.entries(IMPACT_CATEGORY_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export interface NewImpactRecordModalProps {
  onClose: () => void;
}

export function NewImpactRecordModal({ onClose }: NewImpactRecordModalProps) {
  const notify = useToast();
  const [error, setError] = useState('');

  const [subjectType, setSubjectType] = useState<ImpactSubjectType>('DEPARTAMENTO');
  const [userSubject, setUserSubject] = useState<DirectoryUser | null>(null);
  const [team, setTeam] = useState('');
  const [subjectDepartmentId, setSubjectDepartmentId] = useState('');

  const [initiativeType, setInitiativeType] = useState<RoiInitiativeType>('FORMACAO');
  const [initiativeId, setInitiativeId] = useState('');

  const [category, setCategory] = useState<ImpactCategory>('SATISFACAO_CLIENTE');
  const [indicatorName, setIndicatorName] = useState('');
  const [valueBefore, setValueBefore] = useState('');
  const [valueAfter, setValueAfter] = useState('');
  const [observationPeriodStart, setObservationPeriodStart] = useState('');
  const [observationPeriodEnd, setObservationPeriodEnd] = useState('');
  const [attributionPercent, setAttributionPercent] = useState('');
  const [dataSource, setDataSource] = useState('');

  const { data: deptTree } = useApiQuery<{ id: number; name: string; children?: unknown[] }[]>(
    queryKeys.departments.tree(),
    '/departments/tree',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const departments = useMemo(() => {
    const flat: { id: number; name: string }[] = [];
    const walk = (nodes: typeof deptTree) => {
      for (const n of nodes ?? []) {
        flat.push({ id: n.id, name: n.name });
        walk(n.children as typeof deptTree);
      }
    };
    walk(deptTree);
    return flat;
  }, [deptTree]);

  const { data: initiativeOptions } = useApiQuery<InitiativeOption[]>(
    queryKeys.roiImpact.initiativeOptions(initiativeType),
    '/roi-impact/analyses/initiative-options',
    { params: { type: initiativeType }, staleTime: STALE_TIME.SEMI_STATIC },
  );

  const create = useApiMutation(
    () =>
      apiClient.post('/roi-impact/impact-records', {
        subjectType,
        userId: subjectType === 'COLABORADOR' ? userSubject?.id : undefined,
        team: subjectType === 'EQUIPA' ? team.trim() || undefined : undefined,
        departmentId: subjectType === 'DEPARTAMENTO' ? Number(subjectDepartmentId) : undefined,
        initiativeType,
        initiativeId: initiativeId ? Number(initiativeId) : undefined,
        category,
        indicatorName: indicatorName.trim(),
        valueBefore: valueBefore ? Number(valueBefore) : undefined,
        valueAfter: valueAfter ? Number(valueAfter) : undefined,
        observationPeriodStart: observationPeriodStart || undefined,
        observationPeriodEnd: observationPeriodEnd || undefined,
        attributionPercent: attributionPercent ? Number(attributionPercent) : undefined,
        dataSource: dataSource.trim() || undefined,
      }),
    {
      invalidateKeys: [
        queryKeys.roiImpact.impactRecords(),
        queryKeys.roiImpact.impactByCategory(),
      ],
      onSuccess: () => {
        notify({ title: 'Registo de impacto guardado', intent: 'success' });
        onClose();
      },
      onError: (e) => setError(e.message || 'Erro ao guardar o registo de impacto.'),
    },
  );

  const missing: string[] = [];
  if (!indicatorName.trim()) missing.push('indicador');
  if (subjectType === 'COLABORADOR' && !userSubject) missing.push('colaborador');
  if (subjectType === 'EQUIPA' && !team.trim()) missing.push('equipa');
  if (subjectType === 'DEPARTAMENTO' && !subjectDepartmentId) missing.push('departamento');
  const canSave = missing.length === 0;

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Novo Registo de Impacto"
        description="Liga uma iniciativa a um indicador de negócio real (docs/roi-impact.md §3)"
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
      >
        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
            <AlertCircle size={16} strokeWidth={1.75} />
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Sujeito do impacto" htmlFor="ir-subject-type">
              <Select
                items={SUBJECT_TYPE_ITEMS}
                value={subjectType}
                onValueChange={(v) => setSubjectType(v as ImpactSubjectType)}
                className="w-full"
              />
            </FormField>
            <FormField label="Categoria de impacto" htmlFor="ir-category">
              <Select
                items={CATEGORY_ITEMS}
                value={category}
                onValueChange={(v) => setCategory(v as ImpactCategory)}
                className="w-full"
              />
            </FormField>
          </div>

          {subjectType === 'COLABORADOR' && (
            <DepartmentUserPicker
              label="Colaborador *"
              htmlFor="ir-user"
              value={userSubject}
              onChange={setUserSubject}
            />
          )}
          {subjectType === 'EQUIPA' && (
            <FormField label="Equipa *" htmlFor="ir-team">
              <Input id="ir-team" value={team} onChange={(e) => setTeam(e.target.value)} className="w-full" />
            </FormField>
          )}
          {subjectType === 'DEPARTAMENTO' && (
            <FormField label="Departamento *" htmlFor="ir-dept">
              <Select
                items={departments.map((d) => ({ value: String(d.id), label: d.name }))}
                value={subjectDepartmentId}
                onValueChange={setSubjectDepartmentId}
                placeholder="Selecionar…"
                className="w-full"
              />
            </FormField>
          )}

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Tipo de iniciativa" htmlFor="ir-init-type">
              <Select
                items={INITIATIVE_TYPE_ITEMS}
                value={initiativeType}
                onValueChange={(v) => {
                  setInitiativeType(v as RoiInitiativeType);
                  setInitiativeId('');
                }}
                className="w-full"
              />
            </FormField>
            <FormField label="Iniciativa" htmlFor="ir-init">
              <Select
                items={(initiativeOptions ?? []).map((o) => ({ value: String(o.id), label: o.label }))}
                value={initiativeId}
                onValueChange={setInitiativeId}
                placeholder="Selecionar…"
                className="w-full"
              />
            </FormField>
          </div>

          <FormField label="Indicador de negócio afetado *" htmlFor="ir-indicator">
            <Input
              id="ir-indicator"
              placeholder="ex.: NPS, taxa de erro, produção/hora…"
              value={indicatorName}
              onChange={(e) => setIndicatorName(e.target.value)}
              className="w-full"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Valor antes" htmlFor="ir-before">
              <Input
                id="ir-before"
                type="number"
                value={valueBefore}
                onChange={(e) => setValueBefore(e.target.value)}
                className="w-full"
              />
            </FormField>
            <FormField label="Valor depois" htmlFor="ir-after">
              <Input
                id="ir-after"
                type="number"
                value={valueAfter}
                onChange={(e) => setValueAfter(e.target.value)}
                className="w-full"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Período de observação — início" htmlFor="ir-obs-start">
              <Input
                id="ir-obs-start"
                type="date"
                value={observationPeriodStart}
                onChange={(e) => setObservationPeriodStart(e.target.value)}
                className="w-full"
              />
            </FormField>
            <FormField label="Período de observação — fim" htmlFor="ir-obs-end">
              <Input
                id="ir-obs-end"
                type="date"
                value={observationPeriodEnd}
                onChange={(e) => setObservationPeriodEnd(e.target.value)}
                className="w-full"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Grau de atribuição — % atribuível" htmlFor="ir-attribution">
              <Input
                id="ir-attribution"
                type="number"
                min={0}
                max={100}
                value={attributionPercent}
                onChange={(e) => setAttributionPercent(e.target.value)}
                className="w-full"
              />
            </FormField>
            <FormField label="Fonte do dado" htmlFor="ir-source">
              <Input
                id="ir-source"
                value={dataSource}
                onChange={(e) => setDataSource(e.target.value)}
                className="w-full"
              />
            </FormField>
          </div>
        </div>

        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <Button intent="secondary" className="justify-center" onClick={onClose} disabled={create.isPending}>
            Cancelar
          </Button>
          <Button
            className="flex-1 justify-center"
            onClick={() => create.mutate(undefined)}
            loading={create.isPending}
            disabled={!canSave}
          >
            Guardar registo
          </Button>
        </div>
        {!canSave && (
          <p className="mt-2 text-xs text-ink-faint">Falta preencher: {missing.join(', ')}</p>
        )}
      </ModalContent>
    </Modal>
  );
}
