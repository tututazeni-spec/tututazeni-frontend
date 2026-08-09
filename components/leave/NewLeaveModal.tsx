// components/leave/NewLeaveModal.tsx
// Wizard de 3 passos para solicitar uma nova licença — validação
// (useFormValidation) + verificação de conflitos + mutação de criação.
// Extraído de app/(platform)/leave/page.tsx.

'use client';

import { useState } from 'react';
import { AlertCircle, Calendar, Loader2, X } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useFormValidation } from '@/hooks/useFormValidation';
import { required } from '@/lib/validation';
import { CATEGORY_LABELS } from './constants';
import type {
  ConflictCheck,
  DurationMode,
  LeaveBalance,
  LeaveType,
} from './types';

export interface NewLeaveModalProps {
  leaveTypes: LeaveType[];
  balances: LeaveBalance[];
  onClose: () => void;
  onSuccess: () => void;
}

export function NewLeaveModal({
  leaveTypes,
  balances,
  onClose,
  onSuccess,
}: NewLeaveModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const {
    values: form,
    setValues: setForm,
    errorMessage: validationError,
    handleSubmit: withValidation,
  } = useFormValidation(
    {
      leaveTypeCode: '',
      startDate: '',
      endDate: '',
      durationMode: 'FULL_DAY' as DurationMode,
      reason: '',
      saveAsDraft: false,
    },
    {
      leaveTypeCode: [required()],
      startDate: [required()],
      endDate: [required()],
    },
  );
  const [conflicts, setConflicts] = useState<ConflictCheck | null>(null);
  const [submitError, setSubmitError] = useState('');
  const error = validationError || submitError;

  const selectedType = leaveTypes.find((t) => t.code === form.leaveTypeCode);
  const selectedBalance = balances.find(
    (b) => b.leaveTypeCode === form.leaveTypeCode,
  );

  const checkConflicts = async () => {
    if (!form.startDate || !form.endDate) return;
    try {
      const r = await apiClient.get<ConflictCheck>('/leave/conflict-check', {
        params: {
          userId: 'me',
          startDate: form.startDate,
          endDate: form.endDate,
        },
      });
      setConflicts(r);
    } catch {}
  };

  const create = useApiMutation(() => apiClient.post('/leave', form), {
    invalidateKeys: [queryKeys.leave.all],
    onSuccess: () => {
      onSuccess();
      onClose();
    },
    onError: (e) => setSubmitError(e.message),
  });
  const loading = create.isPending;

  const handleSubmit = withValidation(() => {
    setSubmitError('');
    create.mutate(undefined);
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-900">Solicitar Licença</h2>
              <div className="flex items-center gap-2 mt-1">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`h-1.5 w-8 rounded-full transition-colors ${step >= s ? 'bg-blue-600' : 'bg-gray-200'}`}
                  />
                ))}
                <span className="text-xs text-gray-400 ml-1">
                  Passo {step} de 3
                </span>
              </div>
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

          {/* STEP 1: Tipo */}
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">
                Seleccione o tipo de licença
              </p>
              <div className="grid grid-cols-1 gap-2 max-h-72 overflow-y-auto pr-1">
                {leaveTypes.map((lt) => {
                  const bal = balances.find((b) => b.leaveTypeCode === lt.code);
                  return (
                    <button
                      key={lt.code}
                      onClick={() =>
                        setForm((f) => ({ ...f, leaveTypeCode: lt.code }))
                      }
                      className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                        form.leaveTypeCode === lt.code
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                          backgroundColor: lt.color + '20',
                          color: lt.color,
                        }}
                      >
                        <Calendar size={16} />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">
                          {lt.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {CATEGORY_LABELS[lt.category]} ·{' '}
                          {lt.isPaid ? 'Remunerada' : 'Não remunerada'}
                        </p>
                      </div>
                      {bal && (
                        <div className="text-right flex-shrink-0">
                          <p
                            className="text-sm font-bold"
                            style={{ color: lt.color }}
                          >
                            {bal.effectiveBalance}
                          </p>
                          <p className="text-xs text-gray-400">dias</p>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Datas */}
          {step === 2 && (
            <div className="space-y-4">
              {selectedType && (
                <div
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ backgroundColor: selectedType.color + '15' }}
                >
                  <Calendar size={16} style={{ color: selectedType.color }} />
                  <span
                    className="text-sm font-medium"
                    style={{ color: selectedType.color }}
                  >
                    {selectedType.name}
                  </span>
                  {selectedBalance && (
                    <span
                      className="text-xs ml-auto"
                      style={{ color: selectedType.color }}
                    >
                      {selectedBalance.effectiveBalance} dias disponíveis
                    </span>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Início <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, startDate: e.target.value }));
                      setConflicts(null);
                    }}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Fim <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    min={form.startDate}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, endDate: e.target.value }));
                      setConflicts(null);
                    }}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {selectedType?.allowHalfDay && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Duração
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['FULL_DAY', 'HALF_AM', 'HALF_PM'].map((mode) => (
                      <button
                        key={mode}
                        onClick={() =>
                          setForm((f) => ({
                            ...f,
                            durationMode: mode as DurationMode,
                          }))
                        }
                        className={`py-2 text-xs rounded-xl border-2 font-medium transition-colors ${form.durationMode === mode ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                      >
                        {mode === 'FULL_DAY'
                          ? 'Dia inteiro'
                          : mode === 'HALF_AM'
                            ? 'Manhã'
                            : 'Tarde'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {form.startDate && form.endDate && !conflicts && (
                <button
                  onClick={checkConflicts}
                  className="w-full py-2 text-sm text-blue-600 border border-blue-200 rounded-xl hover:bg-blue-50 transition-colors"
                >
                  Verificar conflitos
                </button>
              )}

              {conflicts && (
                <div
                  className={`p-3 rounded-xl text-sm ${conflicts.hasUserConflict || conflicts.isAtRisk ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}
                >
                  {conflicts.hasUserConflict && (
                    <p className="font-medium">
                      ⚠️ Já tem uma ausência neste período
                    </p>
                  )}
                  {!conflicts.hasUserConflict && conflicts.isAtRisk && (
                    <p>
                      ⚠️ {conflicts.teamConflictCount} colega(s) ausente(s) no
                      mesmo período
                    </p>
                  )}
                  {!conflicts.hasUserConflict && !conflicts.isAtRisk && (
                    <p>✓ Sem conflitos detectados</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Motivo{' '}
                  {selectedType?.requiresDocument ? (
                    <span className="text-red-500">*</span>
                  ) : (
                    '(opcional)'
                  )}
                </label>
                <textarea
                  value={form.reason}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, reason: e.target.value }))
                  }
                  rows={3}
                  placeholder="Descreva o motivo da ausência..."
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Confirmação */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                <h3 className="font-semibold text-gray-900 text-sm">
                  Resumo do Pedido
                </h3>
                {[
                  { label: 'Tipo', value: selectedType?.name },
                  {
                    label: 'Período',
                    value: `${form.startDate} → ${form.endDate}`,
                  },
                  {
                    label: 'Duração',
                    value:
                      form.durationMode === 'FULL_DAY'
                        ? 'Dia inteiro'
                        : form.durationMode === 'HALF_AM'
                          ? 'Manhã'
                          : 'Tarde',
                  },
                  { label: 'Motivo', value: form.reason || '—' },
                  {
                    label: 'Remunerada',
                    value: selectedType?.isPaid ? 'Sim' : 'Não',
                  },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between text-sm">
                    <span className="text-gray-500">{row.label}</span>
                    <span className="font-medium text-gray-900">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.saveAsDraft}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, saveAsDraft: e.target.checked }))
                  }
                  className="w-4 h-4 rounded border-gray-300 text-blue-600"
                />
                <span className="text-sm text-gray-700">
                  Guardar como rascunho (não enviar ainda)
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep((s) => Math.max(1, s - 1) as 1 | 2 | 3)}
              className="px-4 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
            >
              ← Voltar
            </button>
          )}
          <button
            onClick={onClose}
            className="px-4 py-2.5 text-sm text-gray-500 hover:text-gray-700"
          >
            Cancelar
          </button>
          <div className="flex-1" />
          {step < 3 ? (
            <button
              onClick={() => setStep((s) => Math.min(3, s + 1) as 1 | 2 | 3)}
              disabled={step === 1 && !form.leaveTypeCode}
              className="px-5 py-2.5 text-sm text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-40 transition-colors"
            >
              Continuar →
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-5 py-2.5 text-sm text-white bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? <Loader2 size={15} className="animate-spin" /> : null}
              {form.saveAsDraft ? 'Guardar Rascunho' : 'Enviar Pedido'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
