// components/users/CreateUserView.tsx
// Vista "Novo Colaborador": formulário de criação de utilizador.
// Extraído de app/(platform)/users/page.tsx.

'use client';

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useFormValidation } from '@/hooks/useFormValidation';
import {
  email as emailValidator,
  required as requiredRule,
} from '@/lib/validation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';

interface CreateUserViewProps {
  onBack: () => void;
  onCreated: () => void;
}

interface UserFormValues {
  fullName: string;
  email: string;
  password: string;
  employeeNumber: string;
  phone: string;
  departmentId: string;
  positionId: string;
  hireDate: string;
  accountStatus: string;
}

interface FieldProps {
  label: string;
  id: keyof UserFormValues;
  type?: string;
  required?: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

// Hoisted fora de CreateUserView: definir um componente dentro doutro
// componente cria uma nova identidade de tipo a cada render — React
// desmonta e remonta toda a subárvore (todos os <Field>) a cada keystroke
// em qualquer campo do formulário. Também é por isto que o React Compiler
// saltava a optimização deste ficheiro (violação das Regras do React).
function Field({
  label,
  id,
  type = 'text',
  required = false,
  value,
  onChange,
}: FieldProps) {
  return (
    <FormField label={required ? `${label} *` : label} htmlFor={id}>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={onChange}
        className="w-full"
      />
    </FormField>
  );
}

export function CreateUserView({ onBack, onCreated }: CreateUserViewProps) {
  const {
    values: form,
    setField,
    errorMessage: validationError,
    handleSubmit: withValidation,
  } = useFormValidation(
    {
      fullName: '',
      email: '',
      password: '',
      employeeNumber: '',
      phone: '',
      departmentId: '',
      positionId: '',
      hireDate: '',
      accountStatus: 'PENDING',
    },
    {
      fullName: [requiredRule()],
      email: [requiredRule(), emailValidator()],
    },
  );
  const [submitError, setSubmitError] = useState('');
  const error = validationError || submitError;

  const handle =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setField(k, e.target.value);

  const create = useApiMutation(
    () =>
      apiClient.post('/users', {
        ...form,
        departmentId: form.departmentId
          ? parseInt(form.departmentId)
          : undefined,
        positionId: form.positionId ? parseInt(form.positionId) : undefined,
        hireDate: form.hireDate || undefined,
        password: form.password || undefined,
        // Campos opcionais em branco vão como undefined, nunca "". Um "" em
        // employeeNumber (String? @unique no backend) colide no 2.º colaborador
        // criado sem nº de funcionário.
        employeeNumber: form.employeeNumber || undefined,
        phone: form.phone || undefined,
      }),
    {
      invalidateKeys: [queryKeys.users.lists()],
      onSuccess: () => onCreated(),
      onError: (e) => setSubmitError(e.message),
    },
  );
  const saving = create.isPending;

  const handleSubmit = withValidation(() => {
    setSubmitError('');
    create.mutate(undefined);
  });

  return (
    <div>
      <Button intent="ghost" size="sm" className="mb-5" onClick={onBack}>
        <ArrowLeft size={14} strokeWidth={1.75} />
        Cancelar
      </Button>
      <Card className="p-6">
        <div className="text-base font-semibold text-ink mb-5">
          Novo colaborador
        </div>

        {error && (
          <div className="bg-danger-subtle border border-danger/30 text-danger-ink rounded-control p-3 text-sm mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-5 mb-6">
          <div className="col-span-2">
            <div className="text-xs font-medium text-ink-faint uppercase tracking-wide mb-3 pb-2 border-b border-border">
              Dados básicos
            </div>
          </div>
          <Field
            label="Nome completo"
            id="fullName"
            required
            value={form.fullName}
            onChange={handle('fullName')}
          />
          <Field
            label="Email"
            id="email"
            type="email"
            required
            value={form.email}
            onChange={handle('email')}
          />
          <Field
            label="Password provisória"
            id="password"
            type="password"
            value={form.password}
            onChange={handle('password')}
          />
          <Field
            label="Nº funcionário"
            id="employeeNumber"
            value={form.employeeNumber}
            onChange={handle('employeeNumber')}
          />
          <Field
            label="Telefone"
            id="phone"
            type="tel"
            value={form.phone}
            onChange={handle('phone')}
          />
          <Field
            label="Data de admissão"
            id="hireDate"
            type="date"
            value={form.hireDate}
            onChange={handle('hireDate')}
          />

          <div className="col-span-2 mt-2">
            <div className="text-xs font-medium text-ink-faint uppercase tracking-wide mb-3 pb-2 border-b border-border">
              Organização
            </div>
          </div>
          <Field
            label="ID Departamento"
            id="departmentId"
            type="number"
            value={form.departmentId}
            onChange={handle('departmentId')}
          />
          <Field
            label="ID Cargo / Posição"
            id="positionId"
            type="number"
            value={form.positionId}
            onChange={handle('positionId')}
          />

          <div>
            <label className="block text-xs font-medium text-ink uppercase tracking-wide mb-1.5">
              Estado inicial
            </label>
            <select
              value={form.accountStatus}
              onChange={handle('accountStatus')}
              className="w-full rounded-control border-[1.5px] border-border-strong bg-surface px-3 py-[9px] font-body text-sm text-ink focus:border-accent focus:outline-none focus:ring-[3px] focus:ring-accent-subtle"
            >
              <option value="PENDING">Pendente (convite enviado)</option>
              <option value="ACTIVE">Activo</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={handleSubmit} disabled={saving} loading={saving}>
            {saving ? 'A criar…' : 'Criar colaborador'}
          </Button>
          <Button intent="secondary" onClick={onBack}>
            Cancelar
          </Button>
        </div>
      </Card>
    </div>
  );
}
