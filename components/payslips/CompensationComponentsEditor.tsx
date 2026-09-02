// components/payslips/CompensationComponentsEditor.tsx
// Editor da lista de overrides de componentes de UM registo de compensação.
// POST /payroll/compensation/:id/components substitui a lista inteira — por
// isso o editor envia sempre o array completo. `override` fica registado mas o
// motor de cálculo actual soma todos os componentes como rendimento extra
// independentemente desta opção (ver payroll-calculation/engine service).
'use client';

import { useState } from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { Button, IconButton } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { useToast } from '@/providers/ToastProvider';
import { useSalaryComponentOptions } from './compensationData';
import type { EmployeeCompensation } from './types';

export interface CompensationComponentsEditorProps {
  record: EmployeeCompensation;
  onClose: () => void;
}

interface Row {
  key: string;
  componentCode: string;
  value: string;
  override: boolean;
}

interface ComponentItem {
  componentCode: string;
  value: number;
  override: boolean;
}

let seq = 0;
const newRow = (): Row => ({
  key: `r${(seq += 1)}`,
  componentCode: '',
  value: '',
  override: false,
});

export function CompensationComponentsEditor({
  record,
  onClose,
}: CompensationComponentsEditorProps) {
  const notify = useToast();
  const { options, loading: optionsLoading } = useSalaryComponentOptions(true);

  const [rows, setRows] = useState<Row[]>(
    record.components.length > 0
      ? record.components.map((c) => ({
          key: `r${(seq += 1)}`,
          componentCode: c.componentCode,
          value: String(c.value),
          override: c.override,
        }))
      : [newRow()],
  );
  const [formError, setFormError] = useState('');

  const patch = (key: string, p: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...p } : r)));

  const save = useApiMutation<unknown, ComponentItem[]>(
    (items) =>
      apiClient.post(`/payroll/compensation/${record.id}/components`, {
        items,
      }),
    {
      invalidateKeys: [queryKeys.payslips.all],
      onSuccess: () => {
        notify({ title: 'Componentes actualizados', intent: 'success' });
        onClose();
      },
      onError: (e: Error) => setFormError(e.message || 'Erro ao guardar.'),
    },
  );
  const loading = save.isPending;

  const handleSave = () => {
    if (loading) return;
    setFormError('');
    const filled = rows.filter((r) => r.componentCode !== '');
    const codes = filled.map((r) => r.componentCode);
    if (new Set(codes).size !== codes.length) {
      setFormError(
        'Há um componente duplicado — cada código só pode aparecer uma vez.',
      );
      return;
    }
    if (
      filled.some((r) => r.value.trim() === '' || Number.isNaN(Number(r.value)))
    ) {
      setFormError('Cada linha precisa de um valor numérico.');
      return;
    }
    save.mutate(
      filled.map((r) => ({
        componentCode: r.componentCode,
        value: Number(r.value),
        override: r.override,
      })),
    );
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Gerir componentes da compensação"
        description="Estes valores substituem integralmente a lista de overrides deste registo."
        className="max-w-xl max-h-[90vh] overflow-y-auto"
      >
        <div className="mt-5 space-y-3">
          {formError && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              {formError}
            </div>
          )}

          {rows.map((r) => (
            <div key={r.key} className="flex items-center gap-2">
              <div className="flex-1">
                <Select
                  items={options}
                  value={r.componentCode || undefined}
                  onValueChange={(v) => patch(r.key, { componentCode: v })}
                  placeholder={optionsLoading ? 'A carregar…' : 'Componente'}
                  className="w-full"
                />
              </div>
              <Input
                aria-label="Valor"
                type="number"
                step="any"
                value={r.value}
                onChange={(e) => patch(r.key, { value: e.target.value })}
                className="w-32"
              />
              <label
                className="flex items-center gap-1 text-xs text-ink-muted"
                title="Marca este valor como substituição explícita do valor de catálogo. Registado para uso futuro — o cálculo actual soma todos os componentes como rendimento extra independentemente desta opção."
              >
                <input
                  type="checkbox"
                  checked={r.override}
                  onChange={(e) => patch(r.key, { override: e.target.checked })}
                  className="h-4 w-4 rounded border-border-strong accent-primary"
                />
                override
              </label>
              <IconButton
                icon={Trash2}
                label="Remover linha"
                intent="ghost"
                size="sm"
                onClick={() =>
                  setRows((rs) => rs.filter((x) => x.key !== r.key))
                }
              />
            </div>
          ))}

          <Button
            intent="ghost"
            size="sm"
            onClick={() => setRows((rs) => [...rs, newRow()])}
          >
            <Plus size={14} strokeWidth={1.75} />
            Adicionar linha
          </Button>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button intent="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSave} loading={loading}>
            Guardar
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
