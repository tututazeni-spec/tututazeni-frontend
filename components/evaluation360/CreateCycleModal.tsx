// components/evaluation360/CreateCycleModal.tsx
// Modal "Novo Ciclo" do separador "Ciclos" da Avaliação 360º.
//
// NOTA: o módulo evaluation360 corre 100% sobre dados mock (ver
// hooks/useEvaluation360.ts) — não há endpoint POST /evaluation360/cycles.
// Este modal valida os campos e devolve um CycleInfo via `onCreate`, que a
// vista acrescenta à lista localmente (mesmo padrão local-state-only usado em
// components/scalability/LoadTestModal.tsx). Ligar ao backend real fica para
// quando o módulo deixar o mock.

'use client';

import { useState } from 'react';
import type { CycleInfo } from './types';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { useToast } from '@/providers/ToastProvider';

export interface CreateCycleModalProps {
  onClose: () => void;
  onCreate: (cycle: CycleInfo) => void;
}

const MODEL_ITEMS = [
  { value: 'DEG_360', label: '360° — todas as fontes' },
  { value: 'DEG_180', label: '180° — gestor + auto' },
  { value: 'DEG_90', label: '90° — só gestor' },
  { value: 'CONTINUOUS', label: 'Contínuo' },
];

export function CreateCycleModal({ onClose, onCreate }: CreateCycleModalProps) {
  const notify = useToast();
  const [name, setName] = useState('');
  const [model, setModel] = useState('DEG_360');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [participants, setParticipants] = useState('');

  const participantsValid =
    participants.trim() === '' || /^\d+$/.test(participants.trim());
  const datesValid = !startDate || !endDate || endDate >= startDate;

  const canSubmit =
    name.trim().length > 0 &&
    startDate !== '' &&
    endDate !== '' &&
    datesValid &&
    participantsValid;

  const handleSubmit = () => {
    if (!canSubmit) return;
    const cycle: CycleInfo = {
      id: `local-${Date.now()}`,
      name: name.trim(),
      model,
      status: 'DRAFT',
      startDate,
      endDate,
      participantsCount:
        participants.trim() === '' ? 0 : Number(participants.trim()),
      completedCount: 0,
    };
    onCreate(cycle);
    notify({
      title: `Ciclo "${cycle.name}" criado como rascunho.`,
      intent: 'success',
    });
    onClose();
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Novo Ciclo de Avaliação"
        description="O ciclo é criado como rascunho. As datas e o número de participantes podem ser ajustados depois."
        className="max-w-lg"
      >
        <div className="mt-5 space-y-4">
          <FormField label="Nome *" htmlFor="cyc-name">
            <Input
              id="cyc-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Avaliação Semestral 2026 — S1"
            />
          </FormField>

          <FormField label="Modelo *" htmlFor="cyc-model">
            <Select
              items={MODEL_ITEMS}
              value={model}
              onValueChange={setModel}
              className="w-full"
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Início *" htmlFor="cyc-start">
              <Input
                id="cyc-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </FormField>
            <FormField
              label="Fim *"
              htmlFor="cyc-end"
              error={
                !datesValid
                  ? 'A data de fim não pode ser anterior à de início.'
                  : undefined
              }
            >
              <Input
                id="cyc-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </FormField>
          </div>

          <FormField
            label="Participantes"
            htmlFor="cyc-participants"
            hint="Opcional — número de colaboradores no ciclo."
            error={!participantsValid ? 'Indica um número inteiro.' : undefined}
          >
            <Input
              id="cyc-participants"
              inputMode="numeric"
              value={participants}
              onChange={(e) => setParticipants(e.target.value)}
              placeholder="0"
            />
          </FormField>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <Button intent="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            Criar Ciclo
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
