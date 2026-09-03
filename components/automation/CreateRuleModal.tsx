// components/automation/CreateRuleModal.tsx
// Modal "Nova Regra" — separador Automações do módulo de Automação. A página
// só monta o componente quando aberto, por isso o Modal fica sempre `open` e
// delega o fecho em `onClose` (X, Escape, clique fora).
//
// Backend: POST /automation/rules exige @Roles(ADMIN, RH) e espelha
// CreateRuleDto — `name` + `trigger` + `action` obrigatórios; `description`,
// `category` e `active` opcionais. Os campos avançados do DTO (condition,
// actionParams, priority, cronExpression, maxRetries) ficam de fora desta
// versão essencial — editam-se via API. `active` default true no serviço,
// mas enviamos sempre o valor escolhido no formulário.
//
// Invalida queryKeys.automation.rules() (lista) e .stats() (dashboard) para
// apanharem a regra nova sem refresh.

'use client';

import { useState } from 'react';
import { AlertCircle } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/providers/ToastProvider';

export interface CreateRuleModalProps {
  onClose: () => void;
}

const NO_CATEGORY = 'NONE';

// Espelha TriggerType em src/automation/automation.dto.ts.
const TRIGGER_ITEMS: { value: string; label: string }[] = [
  { value: 'employee.created', label: 'Novo colaborador' },
  { value: 'employee.updated', label: 'Colaborador actualizado' },
  { value: 'employee.deactivated', label: 'Colaborador desactivado' },
  { value: 'course.completed', label: 'Curso concluído' },
  { value: 'course.enrolled', label: 'Inscrição em curso' },
  { value: 'pdi.approved', label: 'PDI aprovado' },
  { value: 'pdi.completed', label: 'PDI concluído' },
  { value: 'evaluation.submitted', label: 'Avaliação submetida' },
  { value: 'badge.awarded', label: 'Badge atribuído' },
  { value: 'cron.daily', label: 'Agendado — diário' },
  { value: 'cron.weekly', label: 'Agendado — semanal' },
  { value: 'cron.monthly', label: 'Agendado — mensal' },
  { value: 'BIRTHDAY_TODAY', label: 'Aniversário hoje' },
  { value: 'PENDING_LEAVE_3_DAYS', label: 'Licença pendente há 3 dias' },
  { value: 'ENROLLMENT_EXPIRING', label: 'Formação a expirar' },
  { value: 'PAYSLIP_DUE', label: 'Recibos pendentes' },
  { value: 'manual', label: 'Manual' },
];

// Espelha ActionType em src/automation/automation.dto.ts.
const ACTION_ITEMS: { value: string; label: string }[] = [
  { value: 'send_notification', label: 'Enviar notificação' },
  { value: 'send_email', label: 'Enviar email' },
  { value: 'assign_course', label: 'Atribuir curso' },
  { value: 'create_pdi', label: 'Criar PDI' },
  { value: 'approve_pdi', label: 'Aprovar PDI' },
  { value: 'award_badge', label: 'Atribuir badge' },
  { value: 'award_points', label: 'Atribuir pontos' },
  { value: 'update_employee', label: 'Actualizar colaborador' },
  { value: 'webhook', label: 'Webhook' },
  { value: 'http_request', label: 'Pedido HTTP' },
  { value: 'log', label: 'Registar (log)' },
  { value: 'wait', label: 'Aguardar' },
  { value: 'NOTIFY_MANAGER', label: 'Notificar gestor' },
  { value: 'NOTIFY_LEARNER', label: 'Notificar formando' },
  { value: 'NOTIFY_HR', label: 'Notificar RH' },
];

// Espelha o enum AutomationCategory em prisma/schema.prisma.
const CATEGORY_ITEMS: { value: string; label: string }[] = [
  { value: NO_CATEGORY, label: 'Sem categoria' },
  { value: 'HR', label: 'RH' },
  { value: 'LMS', label: 'LMS' },
  { value: 'PERFORMANCE', label: 'Desempenho' },
  { value: 'ENGAGEMENT', label: 'Envolvimento' },
  { value: 'GAMIFICATION', label: 'Gamificação' },
  { value: 'OPERATIONAL', label: 'Operacional' },
  { value: 'CUSTOM', label: 'Personalizado' },
];

export function CreateRuleModal({ onClose }: CreateRuleModalProps) {
  const notify = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [trigger, setTrigger] = useState(TRIGGER_ITEMS[0].value);
  const [action, setAction] = useState(ACTION_ITEMS[0].value);
  const [category, setCategory] = useState(NO_CATEGORY);
  const [active, setActive] = useState(true);
  const [submitError, setSubmitError] = useState('');

  const canSubmit = name.trim().length > 0 && !!trigger && !!action;

  const createRule = useApiMutation(
    (body: Record<string, unknown>) =>
      apiClient.post('/automation/rules', body),
    {
      invalidateKeys: [
        queryKeys.automation.rules(),
        queryKeys.automation.stats(),
      ],
      onSuccess: () => {
        notify({ title: 'Regra criada', intent: 'success' });
        onClose();
      },
      onError: (e: Error) =>
        setSubmitError(e.message || 'Erro ao criar a regra. Tente novamente.'),
    },
  );
  const loading = createRule.isPending;

  const handleSubmit = () => {
    if (!canSubmit || loading) return;
    setSubmitError('');

    createRule.mutate({
      name: name.trim(),
      trigger,
      action,
      active,
      ...(description.trim() ? { description: description.trim() } : {}),
      ...(category !== NO_CATEGORY ? { category } : {}),
    });
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Nova Regra"
        description="Define um gatilho e a acção a executar quando ele ocorrer."
        className="max-w-xl max-h-[90vh] overflow-y-auto"
      >
        <div className="mt-5 space-y-4">
          {submitError && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              {submitError}
            </div>
          )}

          <FormField label="Nome *" htmlFor="cr-name">
            <Input
              id="cr-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Notificar RH quando entra colaborador"
              maxLength={200}
            />
          </FormField>

          <FormField
            label="Descrição"
            htmlFor="cr-description"
            hint="Opcional."
          >
            <Textarea
              id="cr-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Opcional — o que esta regra faz e porquê."
              rows={2}
              className="w-full"
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Gatilho *" htmlFor="cr-trigger">
              <Select
                items={TRIGGER_ITEMS}
                value={trigger}
                onValueChange={setTrigger}
                className="w-full"
              />
            </FormField>

            <FormField label="Acção *" htmlFor="cr-action">
              <Select
                items={ACTION_ITEMS}
                value={action}
                onValueChange={setAction}
                className="w-full"
              />
            </FormField>
          </div>

          <FormField label="Categoria" htmlFor="cr-category" hint="Opcional.">
            <Select
              items={CATEGORY_ITEMS}
              value={category}
              onValueChange={setCategory}
              className="w-full"
            />
          </FormField>

          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-4 w-4 rounded border-border-strong accent-primary"
            />
            Activar a regra imediatamente
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button intent="ghost" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!canSubmit}
            loading={loading}
          >
            Criar regra
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
