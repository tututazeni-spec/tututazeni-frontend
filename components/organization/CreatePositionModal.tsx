// components/organization/CreatePositionModal.tsx
// Modal "Novo cargo" — separador Cargos do módulo Organização. A página só
// monta o componente quando aberto, por isso o Modal fica sempre `open` e
// delega o fecho em `onClose`.
//
// Backend: POST /organization/positions exige @Roles(ADMIN, RH). Os campos
// espelham CreateOrgPositionDto — nome + nível obrigatórios, o resto opcional.
// competencyIds fica de fora (não há picker de competências neste módulo).
//
// Invalida queryKeys.organization.all (lista de cargos) e
// queryKeys.career.positions() para o Simulador de Carreira apanhar o cargo
// novo sem refresh. A lista de departamentos vem de /departments/tree (apenas
// activos, acessível a qualquer autenticado), tal como no CreateDepartmentModal.

'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
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
import { LEVEL_CFG } from './constants';
import type { PosLevel } from './types';

export interface CreatePositionModalProps {
  onClose: () => void;
}

const NO_DEPT = 'NONE';

const LEVEL_ITEMS = (Object.keys(LEVEL_CFG) as PosLevel[]).map((lvl) => ({
  value: lvl,
  label: LEVEL_CFG[lvl].label,
}));

function flattenTree(
  nodes: DepartmentNode[],
  depth = 0,
): Array<{ value: string; label: string }> {
  return nodes.flatMap((n) => [
    { value: String(n.id), label: `${'— '.repeat(depth)}${n.name}` },
    ...flattenTree(n.children ?? [], depth + 1),
  ]);
}

export function CreatePositionModal({ onClose }: CreatePositionModalProps) {
  const notify = useToast();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [level, setLevel] = useState<PosLevel | ''>('');
  const [departmentId, setDepartmentId] = useState(NO_DEPT);
  const [description, setDescription] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [headcountPlanned, setHeadcountPlanned] = useState('');
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

  const min = salaryMin.trim() ? Number(salaryMin) : null;
  const max = salaryMax.trim() ? Number(salaryMax) : null;
  const headcount = headcountPlanned.trim() ? Number(headcountPlanned) : null;

  const salaryInvalid =
    min != null &&
    max != null &&
    !Number.isNaN(min) &&
    !Number.isNaN(max) &&
    min > max;

  const canSubmit = name.trim().length > 0 && level !== '' && !salaryInvalid;

  const createPos = useApiMutation(
    (body: Record<string, unknown>) =>
      apiClient.post('/organization/positions', body),
    {
      invalidateKeys: [
        queryKeys.organization.all,
        queryKeys.career.positions(),
      ],
      onSuccess: () => {
        notify({ title: 'Cargo criado', intent: 'success' });
        onClose();
      },
      onError: (e) =>
        setSubmitError(e.message || 'Erro ao criar o cargo. Tente novamente.'),
    },
  );
  const loading = createPos.isPending;

  const handleSubmit = () => {
    if (!canSubmit || loading) return;
    setSubmitError('');
    createPos.mutate({
      name: name.trim(),
      level,
      ...(code.trim() ? { code: code.trim() } : {}),
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(departmentId !== NO_DEPT
        ? { departmentId: Number(departmentId) }
        : {}),
      ...(min != null && !Number.isNaN(min) ? { salaryMin: min } : {}),
      ...(max != null && !Number.isNaN(max) ? { salaryMax: max } : {}),
      ...(headcount != null && !Number.isNaN(headcount)
        ? { headcountPlanned: headcount }
        : {}),
    });
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Novo cargo"
        description="Cria um cargo do catálogo organizacional. Fica disponível no Simulador de Carreira."
        className="max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="mt-5 space-y-4">
          {submitError && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              {submitError}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Nome *" htmlFor="cp-name">
              <Input
                id="cp-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Analista de Recursos Humanos"
                maxLength={150}
              />
            </FormField>

            <FormField label="Código" htmlFor="cp-code" hint="Opcional.">
              <Input
                id="cp-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ex.: RH-AN-01"
                maxLength={30}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Nível *" htmlFor="cp-level">
              <Select
                items={LEVEL_ITEMS}
                value={level || undefined}
                onValueChange={(v) => setLevel(v as PosLevel)}
                placeholder="Seleccionar…"
                className="w-full"
              />
            </FormField>

            <FormField label="Departamento" htmlFor="cp-dept">
              <Select
                items={deptItems}
                value={departmentId}
                onValueChange={setDepartmentId}
                className="w-full"
              />
            </FormField>
          </div>

          <FormField label="Descrição" htmlFor="cp-description">
            <Textarea
              id="cp-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opcional — uma ou duas frases sobre o cargo."
              rows={2}
              className="w-full"
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <FormField
              label="Salário mín."
              htmlFor="cp-salary-min"
              error={salaryInvalid ? 'Deve ser ≤ ao máx.' : undefined}
            >
              <Input
                id="cp-salary-min"
                type="number"
                min={0}
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                placeholder="Kz"
                invalid={salaryInvalid}
              />
            </FormField>

            <FormField label="Salário máx." htmlFor="cp-salary-max">
              <Input
                id="cp-salary-max"
                type="number"
                min={0}
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
                placeholder="Kz"
              />
            </FormField>

            <FormField label="Headcount" htmlFor="cp-headcount">
              <Input
                id="cp-headcount"
                type="number"
                min={0}
                value={headcountPlanned}
                onChange={(e) => setHeadcountPlanned(e.target.value)}
                placeholder="1"
              />
            </FormField>
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
            Criar cargo
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
