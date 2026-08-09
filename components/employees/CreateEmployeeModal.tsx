// components/employees/CreateEmployeeModal.tsx
// Modal de criação de colaborador — validação (useFormValidation) + mutação
// (useApiMutation). Extraído de app/(platform)/employees/page.tsx.

'use client';

import { useState } from 'react';
import { AlertCircle, Loader2, X } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { useFormValidation } from '@/hooks/useFormValidation';
import { email as emailValidator, required } from '@/lib/validation';
import {
  CONTRACT_LABELS,
  SENIORITY_LABELS,
  WORKMODE_LABELS,
} from './constants';

export interface CreateEmployeeModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Novo Colaborador
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                Preencha os dados básicos
              </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Fechar"
              className="p-2 rounded-xl hover:bg-gray-100 text-gray-500"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Nome completo <span className="text-red-500">*</span>
              </label>
              <input
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Ana Ferreira"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                E-mail corporativo <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="ana@empresa.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Cargo <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.role}
                  onChange={(e) => setField('role', e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Desenvolvedor"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Departamento
                </label>
                <input
                  value={form.department}
                  onChange={(e) => setField('department', e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ex: Tecnologia"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Data de admissão <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={form.joinedAt}
                onChange={(e) => setField('joinedAt', e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Senioridade
                </label>
                <select
                  value={form.seniority}
                  onChange={(e) => setField('seniority', e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">—</option>
                  {Object.entries(SENIORITY_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Modalidade
                </label>
                <select
                  value={form.workMode}
                  onChange={(e) => setField('workMode', e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">—</option>
                  {Object.entries(WORKMODE_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Contrato
                </label>
                <select
                  value={form.contractType}
                  onChange={(e) => setField('contractType', e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">—</option>
                  {Object.entries(CONTRACT_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-100 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2.5 text-sm text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" /> Criando...
              </>
            ) : (
              'Criar Colaborador'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
