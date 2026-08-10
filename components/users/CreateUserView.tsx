// components/users/CreateUserView.tsx
// Vista "Novo Colaborador": formulário de criação de utilizador.
// Extraído de app/(platform)/users/page.tsx.

'use client';

import { useId, useState } from 'react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useFormValidation } from '@/hooks/useFormValidation';
import {
  email as emailValidator,
  required as requiredRule,
} from '@/lib/validation';

interface CreateUserViewProps {
  onBack: () => void;
  onCreated: () => void;
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

  interface FieldProps {
    label: string;
    id: keyof typeof form;
    type?: string;
    required?: boolean;
  }

  const Field = ({
    label,
    id,
    type = 'text',
    required = false,
  }: FieldProps) => {
    const fieldId = useId();
    return (
      <div>
        <label
          htmlFor={fieldId}
          className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5"
        >
          {label}
          {required && ' *'}
        </label>
        <input
          id={fieldId}
          type={type}
          value={form[id]}
          onChange={handle(id)}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    );
  };

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-5"
      >
        ← Cancelar
      </button>
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="text-base font-semibold text-gray-900 mb-5">
          Novo colaborador
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-5 mb-6">
          <div className="col-span-2">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3 pb-2 border-b border-gray-100">
              Dados básicos
            </div>
          </div>
          <Field label="Nome completo" id="fullName" required />
          <Field label="Email" id="email" type="email" required />
          <Field label="Password provisória" id="password" type="password" />
          <Field label="Nº funcionário" id="employeeNumber" />
          <Field label="Telefone" id="phone" type="tel" />
          <Field label="Data de admissão" id="hireDate" type="date" />

          <div className="col-span-2 mt-2">
            <div className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3 pb-2 border-b border-gray-100">
              Organização
            </div>
          </div>
          <Field label="ID Departamento" id="departmentId" type="number" />
          <Field label="ID Cargo / Posição" id="positionId" type="number" />

          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1.5">
              Estado inicial
            </label>
            <select
              value={form.accountStatus}
              onChange={handle('accountStatus')}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="PENDING">Pendente (convite enviado)</option>
              <option value="ACTIVE">Activo</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-5 py-2.5 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 disabled:opacity-50"
          >
            {saving ? 'A criar…' : 'Criar colaborador'}
          </button>
          <button
            onClick={onBack}
            className="px-5 py-2.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
