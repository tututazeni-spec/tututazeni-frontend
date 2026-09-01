// components/departments/CreateDepartmentModal.tsx
// Modal "Novo departamento" — partilhado pelo módulo Departamentos
// (app/(platform)/departments) e pelo separador Departamentos do Organograma
// (app/(platform)/organization). A página só monta o componente quando está
// aberto, por isso o Modal fica sempre `open` e delega o fecho em `onClose`.
//
// Os dois módulos têm endpoints distintos (`/departments` vs
// `/organization/departments`) mas operam sobre a mesma tabela `department` e
// ambos os DTOs de criação (CreateDepartmentDto / CreateOrgDepartmentDto)
// aceitam exactamente { name, code, description?, parentId?, color? } — o campo
// comum enxuto que este formulário submete. Campos específicos de cada módulo
// (icon/costCenter/trainingBudget; unitId/annualBudget/status) ficam de fora.
//
// Backend: POST exige @Roles(ADMIN, RH) nos dois módulos. Código único →
// 409 (mostrado inline). A lista de pais vem de /departments/tree (apenas
// activos, acessível a qualquer autenticado).

'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import type { QueryKey } from '@tanstack/react-query';
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
import type { DepartmentNode } from './types';

export interface CreateDepartmentModalProps {
  onClose: () => void;
  /** Endpoint de criação — difere entre os dois módulos. */
  endpoint: '/departments' | '/organization/departments';
  /** Keys a invalidar após criar (lista/árvore de cada módulo). */
  invalidateKeys: QueryKey[];
}

const NO_PARENT = 'NONE';
const DEFAULT_COLOR = '#1a4bb5';

function flattenTree(
  nodes: DepartmentNode[],
  depth = 0,
): Array<{ value: string; label: string }> {
  return nodes.flatMap((n) => [
    { value: String(n.id), label: `${'— '.repeat(depth)}${n.name}` },
    ...flattenTree(n.children ?? [], depth + 1),
  ]);
}

export function CreateDepartmentModal({
  onClose,
  endpoint,
  invalidateKeys,
}: CreateDepartmentModalProps) {
  const notify = useToast();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [parentId, setParentId] = useState(NO_PARENT);
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [submitError, setSubmitError] = useState('');

  const { data: tree } = useApiQuery<DepartmentNode[]>(
    queryKeys.departments.tree(),
    '/departments/tree',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  const parentItems = [
    { value: NO_PARENT, label: 'Sem departamento pai (raiz)' },
    ...flattenTree(tree ?? []),
  ];

  const canSubmit = name.trim().length > 0 && code.trim().length > 0;

  const createDept = useApiMutation(
    (body: Record<string, unknown>) => apiClient.post(endpoint, body),
    {
      invalidateKeys,
      onSuccess: () => {
        notify({ title: 'Departamento criado', intent: 'success' });
        onClose();
      },
      onError: (e) =>
        setSubmitError(
          e.message || 'Erro ao criar o departamento. Tente novamente.',
        ),
    },
  );
  const loading = createDept.isPending;

  const handleSubmit = () => {
    if (!canSubmit || loading) return;
    setSubmitError('');
    createDept.mutate({
      name: name.trim(),
      code: code.trim(),
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(parentId !== NO_PARENT ? { parentId: Number(parentId) } : {}),
      ...(color ? { color } : {}),
    });
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Novo departamento"
        description="Cria um departamento. Podes associá-lo a um departamento pai para formar a hierarquia."
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
            <FormField label="Nome *" htmlFor="cd-name">
              <Input
                id="cd-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Recursos Humanos"
                maxLength={120}
              />
            </FormField>

            <FormField label="Código *" htmlFor="cd-code" hint="Único.">
              <Input
                id="cd-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Ex.: RH-001"
                maxLength={20}
              />
            </FormField>
          </div>

          <FormField label="Descrição" htmlFor="cd-description">
            <Textarea
              id="cd-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opcional — uma ou duas frases sobre o departamento."
              rows={2}
              className="w-full"
            />
          </FormField>

          <FormField label="Departamento pai" htmlFor="cd-parent">
            <Select
              items={parentItems}
              value={parentId}
              onValueChange={setParentId}
              className="w-full"
            />
          </FormField>

          <FormField label="Cor" htmlFor="cd-color">
            <div className="flex items-center gap-3">
              <input
                id="cd-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-9 w-14 cursor-pointer rounded-control border border-border-strong bg-surface"
              />
              <Input
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="#1a4bb5"
                className="max-w-[140px] font-mono"
              />
            </div>
          </FormField>
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
            Criar departamento
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
