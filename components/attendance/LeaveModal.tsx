// components/attendance/LeaveModal.tsx
// Modal de solicitação de licença. Extraído de
// app/(platform)/attendance/page.tsx.

'use client';

import { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Button, IconButton } from '@/components/ui/Button';
import { useApiMutation } from '@/hooks/useApiQuery';
import { useFormValidation } from '@/hooks/useFormValidation';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { required } from '@/lib/validation';
import { LEAVE_LABELS } from './constants';

interface LeaveModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function LeaveModal({ onClose, onSuccess }: LeaveModalProps) {
  const {
    values: form,
    setValues: setForm,
    errorMessage: validationError,
    handleSubmit: withValidation,
  } = useFormValidation(
    {
      type: 'VACATION',
      startDate: '',
      endDate: '',
      reason: '',
      halfDay: false,
    },
    {
      startDate: [required()],
      endDate: [required()],
      reason: [required()],
    },
  );
  const [submitError, setSubmitError] = useState('');
  const error = validationError || submitError;

  const submit = useApiMutation(
    () => apiClient.post('/attendance/leaves', form),
    {
      invalidateKeys: [queryKeys.attendance.all],
      onSuccess: () => {
        onSuccess();
        onClose();
      },
      onError: (e) => setSubmitError(e.message),
    },
  );
  const loading = submit.isPending;

  const handleSubmit = withValidation(() => {
    setSubmitError('');
    submit.mutate(undefined);
  });

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-surface rounded-panel shadow-elevated w-full max-w-md">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div>
            <h2 className="font-bold text-ink">Solicitar Licença</h2>
            <p className="text-sm text-ink-muted mt-0.5">
              Preencha os dados da solicitação
            </p>
          </div>
          <IconButton
            icon={X}
            label="Fechar"
            intent="ghost"
            onClick={onClose}
          />
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-danger-subtle text-danger-ink rounded-control text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">
              Tipo de Licença
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
              className="w-full px-3 py-2.5 text-sm border border-border rounded-control focus:outline-none focus:ring-2 focus:ring-primary bg-surface"
            >
              {Object.entries(LEAVE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">
                Início <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, startDate: e.target.value }))
                }
                className="w-full px-3 py-2.5 text-sm border border-border rounded-control focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-muted mb-1">
                Fim <span className="text-danger">*</span>
              </label>
              <input
                type="date"
                value={form.endDate}
                onChange={(e) =>
                  setForm((f) => ({ ...f, endDate: e.target.value }))
                }
                className="w-full px-3 py-2.5 text-sm border border-border rounded-control focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-ink-muted mb-1">
              Motivo <span className="text-danger">*</span>
            </label>
            <textarea
              value={form.reason}
              onChange={(e) =>
                setForm((f) => ({ ...f, reason: e.target.value }))
              }
              rows={3}
              placeholder="Descreva brevemente o motivo..."
              className="w-full px-3 py-2.5 text-sm border border-border rounded-control focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.halfDay}
              onChange={(e) =>
                setForm((f) => ({ ...f, halfDay: e.target.checked }))
              }
              className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
            />
            <span className="text-sm text-ink">Meio período</span>
          </label>
        </div>

        <div className="p-6 border-t border-border flex gap-3">
          <Button
            intent="secondary"
            onClick={onClose}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            intent="primary"
            onClick={handleSubmit}
            disabled={loading}
            loading={loading}
            className="flex-1"
          >
            Enviar Pedido
          </Button>
        </div>
      </div>
    </div>
  );
}
