// components/reports/SaveReportModal.tsx
// Modal do botão "Criar Relatório" — grava um relatório personalizado via
// POST /reports/saved. Segue o padrão de components/employees/CreateEmployeeModal
// (Modal/ModalContent + useFormValidation + useApiMutation com invalidateKeys).
//
// O utilizador escolhe um template base (REPORT_TEMPLATES, espelho dos
// built-in do backend) que fixa `reportKey` + `category`; o intervalo de
// datas é serializado para `params` como JSON string. O resultado aparece
// na aba "Meus Relatórios" (SavedReportsTab).

'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useFormValidation } from '@/hooks/useFormValidation';
import { required } from '@/lib/validation';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { CAT_CONFIG, REPORT_TEMPLATES } from './constants';
import { defaultRange } from './utils';

export interface SaveReportModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const TEMPLATE_ITEMS = REPORT_TEMPLATES.map((t) => ({
  value: t.reportKey,
  label: `${t.name} · ${CAT_CONFIG[t.category]?.label ?? t.category}`,
}));

export function SaveReportModal({ onClose, onSuccess }: SaveReportModalProps) {
  const range = defaultRange(1);
  const {
    values: form,
    setField,
    errorMessage: validationError,
    handleSubmit: withValidation,
  } = useFormValidation(
    {
      name: '',
      description: '',
      reportKey: '',
      from: range.from,
      to: range.to,
    },
    {
      name: [required()],
      reportKey: [required('Escolha um template base')],
    },
  );
  const [submitError, setSubmitError] = useState('');
  const error = validationError || submitError;

  const saveReport = useApiMutation(
    () => {
      const tpl = REPORT_TEMPLATES.find((t) => t.reportKey === form.reportKey);
      return apiClient.post('/reports/saved', {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        category: tpl?.category,
        reportKey: form.reportKey,
        params: JSON.stringify({ from: form.from, to: form.to }),
      });
    },
    {
      invalidateKeys: [queryKeys.reports.saved()],
      onSuccess: () => {
        onSuccess();
        onClose();
      },
      onError: () =>
        setSubmitError('Erro ao guardar relatório. Verifique os dados.'),
    },
  );
  const loading = saveReport.isPending;

  const handleSubmit = withValidation(() => {
    setSubmitError('');
    saveReport.mutate(undefined);
  });

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Criar Relatório"
        description="Guarda um relatório personalizado com um template base e um intervalo de datas."
        className="max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="mt-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            <FormField label="Nome *" htmlFor="sr-name">
              <Input
                id="sr-name"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                className="w-full"
                placeholder="Ex: Headcount Tecnologia — Q1"
              />
            </FormField>

            <FormField label="Descrição" htmlFor="sr-description">
              <Textarea
                id="sr-description"
                value={form.description}
                onChange={(e) => setField('description', e.target.value)}
                className="w-full"
                rows={2}
                placeholder="Para que serve este relatório"
              />
            </FormField>

            <FormField label="Template base *" htmlFor="sr-reportKey">
              <Select
                items={TEMPLATE_ITEMS}
                value={form.reportKey || undefined}
                onValueChange={(v) => setField('reportKey', v)}
                className="w-full"
                placeholder="Selecionar template"
              />
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="De" htmlFor="sr-from">
                <Input
                  id="sr-from"
                  type="date"
                  value={form.from}
                  onChange={(e) => setField('from', e.target.value)}
                  className="w-full"
                />
              </FormField>
              <FormField label="Até" htmlFor="sr-to">
                <Input
                  id="sr-to"
                  type="date"
                  value={form.to}
                  onChange={(e) => setField('to', e.target.value)}
                  className="w-full"
                />
              </FormField>
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <Button
            intent="secondary"
            className="flex-1 justify-center"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 justify-center"
            onClick={handleSubmit}
            loading={loading}
          >
            {loading ? 'A guardar...' : 'Guardar Relatório'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
