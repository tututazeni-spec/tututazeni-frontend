// components/payslips/ComponentFormModal.tsx
// Modal único de criar/editar um SalaryComponent (POST /payroll/components,
// PUT /payroll/components/:code). Só ADMIN/RH — mesmo RBAC de
// SalaryComponentController. Padrão de CompetencyFormModal: a página só monta
// isto quando aberto, por isso o Modal fica sempre `open`.
//
// `code` é imutável: input só em criar, ausente em editar.
// Campo de valor condicional ao calcType espelha o @ValidateIf do
// CreateSalaryComponentDto (FIXED→fixedValue, PERCENT→rate, FORMULA→formula,
// TABLE→nenhum). `rate` é fracção (0.10 = 10%) — ver payroll-engine.service.ts.
// Sem filtro P2002→409 no backend: code duplicado devolve 500; mostramos cru.
'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { useToast } from '@/providers/ToastProvider';
import type {
  SalaryComponent,
  ComponentCalcType,
  ComponentType,
} from './types';

export interface ComponentFormModalProps {
  component?: SalaryComponent | null;
  onClose: () => void;
}

const TYPE_ITEMS = [
  { value: 'EARNING', label: 'Rendimento (EARNING)' },
  { value: 'DEDUCTION', label: 'Desconto (DEDUCTION)' },
];
const CALC_ITEMS = [
  { value: 'FIXED', label: 'Valor fixo (FIXED)' },
  { value: 'PERCENT', label: 'Percentagem (PERCENT)' },
  { value: 'FORMULA', label: 'Fórmula (FORMULA)' },
  { value: 'TABLE', label: 'Tabela / escalões (TABLE)' },
];

export function ComponentFormModal({
  component,
  onClose,
}: ComponentFormModalProps) {
  const editing = component != null;
  const notify = useToast();

  const [code, setCode] = useState(component?.code ?? '');
  const [name, setName] = useState(component?.name ?? '');
  const [description, setDescription] = useState(component?.description ?? '');
  const [type, setType] = useState<string>(component?.type ?? '');
  const [calcType, setCalcType] = useState<string>(component?.calcType ?? '');
  const [fixedValue, setFixedValue] = useState(
    component?.fixedValue != null ? String(component.fixedValue) : '',
  );
  const [rate, setRate] = useState(
    component?.rate != null ? String(component.rate) : '',
  );
  const [formula, setFormula] = useState(component?.formula ?? '');
  const [isTaxable, setIsTaxable] = useState(component?.isTaxable ?? true);
  const [isMandatory, setIsMandatory] = useState(
    component?.isMandatory ?? false,
  );
  const [order, setOrder] = useState(
    component?.order != null ? String(component.order) : '0',
  );
  const [countryCode, setCountryCode] = useState(
    component?.countryCode ?? 'AO',
  );
  const [submitError, setSubmitError] = useState('');
  const [condError, setCondError] = useState('');

  const save = useApiMutation(
    (body: Record<string, unknown>) =>
      editing
        ? apiClient.put(`/payroll/components/${component!.code}`, body)
        : apiClient.post('/payroll/components', body),
    {
      invalidateKeys: [queryKeys.payslips.all],
      onSuccess: () => {
        notify({
          title: editing ? 'Componente actualizado' : 'Componente criado',
          intent: 'success',
        });
        onClose();
      },
      onError: (e: Error) =>
        setSubmitError(e.message || 'Erro ao guardar. Tente novamente.'),
    },
  );
  const loading = save.isPending;

  const condLabel =
    calcType === 'FIXED'
      ? 'Valor fixo (Kz)'
      : calcType === 'PERCENT'
        ? 'Taxa'
        : calcType === 'FORMULA'
          ? 'Fórmula'
          : '';

  const baseValid =
    (editing || code.trim().length > 0) &&
    name.trim().length > 0 &&
    type !== '' &&
    calcType !== '';

  const handleSubmit = () => {
    if (loading) return;
    setSubmitError('');
    setCondError('');
    if (!baseValid) return;
    if (calcType === 'FIXED' && fixedValue.trim() === '') {
      setCondError('Valor fixo é obrigatório quando o cálculo é FIXED.');
      return;
    }
    if (calcType === 'PERCENT' && rate.trim() === '') {
      setCondError('Taxa é obrigatória quando o cálculo é PERCENT.');
      return;
    }
    if (calcType === 'FORMULA' && formula.trim() === '') {
      setCondError('Fórmula é obrigatória quando o cálculo é FORMULA.');
      return;
    }

    const body: Record<string, unknown> = {
      name: name.trim(),
      description: description.trim() || null,
      type: type as ComponentType,
      calcType: calcType as ComponentCalcType,
      isTaxable,
      isMandatory,
      order: Number(order) || 0,
      countryCode: countryCode.trim() || 'AO',
    };
    if (!editing) body.code = code.trim().toUpperCase();
    if (calcType === 'FIXED') body.fixedValue = Number(fixedValue);
    if (calcType === 'PERCENT') body.rate = Number(rate);
    if (calcType === 'FORMULA') body.formula = formula.trim();

    save.mutate(body);
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={editing ? 'Editar componente' : 'Novo componente'}
        description={
          editing
            ? 'Actualiza o componente. As alterações aplicam-se de imediato.'
            : 'Cria um componente no catálogo salarial.'
        }
        className="max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="mt-5 space-y-4">
          {submitError && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              {submitError}
            </div>
          )}

          {!editing && (
            <FormField
              label="Código *"
              htmlFor="cf-code"
              hint="Identificador único, imutável (ex.: BASE, TRANSPORT)."
            >
              <Input
                id="cf-code"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="BASE"
                className="w-full font-mono"
              />
            </FormField>
          )}

          <FormField label="Nome *" htmlFor="cf-name">
            <Input
              id="cf-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full"
            />
          </FormField>

          <FormField label="Descrição" htmlFor="cf-description">
            <Textarea
              id="cf-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Tipo *" htmlFor="cf-type">
              <Select
                items={TYPE_ITEMS}
                value={type || undefined}
                onValueChange={setType}
                placeholder="Selecionar"
                className="w-full"
              />
            </FormField>
            <FormField label="Tipo de cálculo *" htmlFor="cf-calc">
              <Select
                items={CALC_ITEMS}
                value={calcType || undefined}
                onValueChange={(v) => {
                  setCalcType(v);
                  setCondError('');
                }}
                placeholder="Selecionar"
                className="w-full"
              />
            </FormField>
          </div>

          {condLabel && (
            <FormField
              label={condLabel}
              htmlFor="cf-cond"
              hint={
                calcType === 'PERCENT'
                  ? 'Fracção: 0.10 = 10% (mesma convenção do motor de cálculo).'
                  : calcType === 'FORMULA'
                    ? 'Expressão avaliada pelo motor de cálculo.'
                    : undefined
              }
            >
              {calcType === 'FORMULA' ? (
                <Input
                  id="cf-cond"
                  value={formula}
                  onChange={(e) => setFormula(e.target.value)}
                  className="w-full font-mono"
                />
              ) : (
                <Input
                  id="cf-cond"
                  type="number"
                  step="any"
                  value={calcType === 'FIXED' ? fixedValue : rate}
                  onChange={(e) =>
                    calcType === 'FIXED'
                      ? setFixedValue(e.target.value)
                      : setRate(e.target.value)
                  }
                  className="w-full"
                />
              )}
            </FormField>
          )}
          {calcType === 'TABLE' && (
            <p className="font-body text-xs text-ink-faint">
              Os escalões são geridos na configuração do país.
            </p>
          )}
          {condError && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              {condError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-2 text-sm text-ink-muted">
              <input
                type="checkbox"
                checked={isTaxable}
                onChange={(e) => setIsTaxable(e.target.checked)}
                className="h-4 w-4 rounded border-border-strong accent-primary"
              />
              Tributável
            </label>
            <label className="flex items-center gap-2 text-sm text-ink-muted">
              <input
                type="checkbox"
                checked={isMandatory}
                onChange={(e) => setIsMandatory(e.target.checked)}
                className="h-4 w-4 rounded border-border-strong accent-primary"
              />
              Obrigatório
            </label>
            <FormField label="Ordem" htmlFor="cf-order">
              <Input
                id="cf-order"
                type="number"
                value={order}
                onChange={(e) => setOrder(e.target.value)}
                className="w-full"
              />
            </FormField>
            <FormField label="País" htmlFor="cf-country">
              <Input
                id="cf-country"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                className="w-full"
              />
            </FormField>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button intent="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!baseValid}
            loading={loading}
          >
            {editing ? 'Guardar' : 'Criar'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
