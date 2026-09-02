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

  // O backend faz SOFT-DELETE de um componente (active=false) exactamente quando
  // ele passa a estar referenciado por uma compensação — por isso um código que
  // aparece legitimamente em record.components pode não vir em `options`. Sem
  // isto o Select desse row mostrava só o placeholder (valor preservado em
  // estado, mas o admin não via o que a linha era). Une-se aqui os códigos
  // referenciados-mas-inactivos, rotulados "(inactivo)".
  const missingCodes = Array.from(
    new Set(
      record.components
        .map((c) => c.componentCode)
        .filter((code) => code && !options.some((o) => o.value === code)),
    ),
  );
  const allOptions = [
    ...options,
    ...missingCodes.map((code) => ({
      value: code,
      label: `${code} — (inactivo)`,
    })),
  ];

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
    // Uma linha com valor preenchido mas sem componente escolhido não pode ser
    // descartada em silêncio num endpoint de substituição integral. Linhas
    // totalmente em branco continuam a ser removidas (path "limpar linha").
    if (rows.some((r) => r.componentCode === '' && r.value.trim() !== '')) {
      setFormError('Cada linha precisa de um componente seleccionado.');
      return;
    }
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
                  items={allOptions}
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
