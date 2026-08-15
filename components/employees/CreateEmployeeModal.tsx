// components/employees/CreateEmployeeModal.tsx
// Modal de criação de colaborador — validação (useFormValidation) + mutação
// (useApiMutation). Extraído de app/(platform)/employees/page.tsx. Backdrop
// + painel bespoke passam a Modal/ModalContent (Radix Dialog,
// components/ui/Modal) — já traz título, botão fechar e overlay/backdrop-
// click de série. O page.tsx só monta <CreateEmployeeModal> quando
// showCreate é true, por isso o Modal fica sempre `open`; onOpenChange
// chama onClose (cobre tanto o X como o clique fora / Escape).

'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { useFormValidation } from '@/hooks/useFormValidation';
import { email as emailValidator, required } from '@/lib/validation';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import {
  CONTRACT_LABELS,
  SENIORITY_LABELS,
  WORKMODE_LABELS,
} from './constants';

export interface CreateEmployeeModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const SENIORITY_ITEMS = Object.entries(SENIORITY_LABELS).map(([k, v]) => ({
  value: k,
  label: v,
}));
const WORKMODE_ITEMS = Object.entries(WORKMODE_LABELS).map(([k, v]) => ({
  value: k,
  label: v,
}));
const CONTRACT_ITEMS = Object.entries(CONTRACT_LABELS).map(([k, v]) => ({
  value: k,
  label: v,
}));

export function CreateEmployeeModal({
  onClose,
  onSuccess,
}: CreateEmployeeModalProps) {
  const {
    values: form,
    setField,
    errorMessage: validationError,
    handleSubmit: withValidation,
  } = useFormValidation(
    {
      name: '',
      email: '',
      role: '',
      department: '',
      joinedAt: '',
      seniority: '',
      workMode: '',
      contractType: '',
    },
    {
      name: [required()],
      email: [required(), emailValidator()],
      role: [required()],
      joinedAt: [required()],
    },
  );
  const [submitError, setSubmitError] = useState('');
  const error = validationError || submitError;

  const createEmployee = useApiMutation(
    () => apiClient.post('/employees', form),
    {
      onSuccess: () => {
        onSuccess();
        onClose();
      },
      onError: () =>
        setSubmitError('Erro ao criar colaborador. Verifique os dados.'),
    },
  );
  const loading = createEmployee.isPending;

  const handleSubmit = withValidation(() => {
    setSubmitError('');
    createEmployee.mutate(undefined);
  });

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Novo Colaborador"
        description="Preencha os dados básicos"
        className="max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="mt-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-danger-subtle text-danger-ink rounded-card text-sm">
              <AlertCircle size={16} strokeWidth={1.75} />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <FormField label="Nome completo *" htmlFor="ce-name">
              <Input
                id="ce-name"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                className="w-full"
                placeholder="Ex: Ana Ferreira"
              />
            </FormField>

            <FormField label="E-mail corporativo *" htmlFor="ce-email">
              <Input
                id="ce-email"
                type="email"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                className="w-full"
                placeholder="ana@empresa.com"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Cargo *" htmlFor="ce-role">
                <Input
                  id="ce-role"
                  value={form.role}
                  onChange={(e) => setField('role', e.target.value)}
                  className="w-full"
                  placeholder="Ex: Desenvolvedor"
                />
              </FormField>
              <FormField label="Departamento" htmlFor="ce-department">
                <Input
                  id="ce-department"
                  value={form.department}
                  onChange={(e) => setField('department', e.target.value)}
                  className="w-full"
                  placeholder="Ex: Tecnologia"
                />
              </FormField>
            </div>

            <FormField label="Data de admissão *" htmlFor="ce-joinedAt">
              <Input
                id="ce-joinedAt"
                type="date"
                value={form.joinedAt}
                onChange={(e) => setField('joinedAt', e.target.value)}
                className="w-full"
              />
            </FormField>

            <div className="grid grid-cols-3 gap-3">
              <FormField label="Senioridade" htmlFor="ce-seniority">
                <Select
                  items={SENIORITY_ITEMS}
                  value={form.seniority || undefined}
                  onValueChange={(v) => setField('seniority', v)}
                  className="w-full"
                />
              </FormField>
              <FormField label="Modalidade" htmlFor="ce-workMode">
                <Select
                  items={WORKMODE_ITEMS}
                  value={form.workMode || undefined}
                  onValueChange={(v) => setField('workMode', v)}
                  className="w-full"
                />
              </FormField>
              <FormField label="Contrato" htmlFor="ce-contractType">
                <Select
                  items={CONTRACT_ITEMS}
                  value={form.contractType || undefined}
                  onValueChange={(v) => setField('contractType', v)}
                  className="w-full"
                />
              </FormField>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <Button intent="secondary" className="flex-1 justify-center" onClick={onClose}>
            Cancelar
          </Button>
          <Button className="flex-1 justify-center" onClick={handleSubmit} loading={loading}>
            {loading ? 'Criando...' : 'Criar Colaborador'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
