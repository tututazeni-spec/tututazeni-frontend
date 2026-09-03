// components/events/CreateEventModal.tsx
// Modal "Criar evento" do módulo de eventos corporativos. Antes o botão
// só disparava um toast "Abrir formulário de criação de evento" e nada
// mais — ver memory project_innova_frontend_placeholder_toast_buttons.
//
// Segue o padrão de components/live-classes/CreateLiveClassModal: a page
// só monta o componente quando está aberto, por isso o Modal fica sempre
// `open` e `onOpenChange` delega em `onClose` (X, clique fora, Escape).
//
// Submete em POST /events (@Roles(ADMIN, RH, GESTOR) no backend) — o
// evento nasce como DRAFT. O botão que abre esta modal já está escondido
// para quem não é ADMIN/RH/GESTOR; aqui só blindamos o payload: datas
// locais -> ISO, capacidade -> número, opcionais vazios omitidos.

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
import { MODALITY_CFG, TYPE_CFG } from './constants';
import type { EventModalidade, EventType } from './types';

export interface CreateEventModalProps {
  onClose: () => void;
}

const TYPE_ITEMS = Object.entries(TYPE_CFG).map(([value, cfg]) => ({
  value,
  label: cfg.label,
}));

const MODALITY_ITEMS = Object.entries(MODALITY_CFG).map(([value, cfg]) => ({
  value,
  label: cfg.label,
}));

export function CreateEventModal({ onClose }: CreateEventModalProps) {
  const notify = useToast();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<EventType>('TRAINING');
  const [modalidade, setModalidade] = useState<EventModalidade>('ONLINE');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [location, setLocation] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [maxCapacity, setMaxCapacity] = useState('50');
  const [description, setDescription] = useState('');
  const [submitError, setSubmitError] = useState('');

  const capacityNum = Number(maxCapacity);
  const datesOk =
    startAt.length > 0 &&
    endAt.length > 0 &&
    new Date(endAt).getTime() > new Date(startAt).getTime();
  const canSubmit =
    title.trim().length > 0 &&
    datesOk &&
    Number.isFinite(capacityNum) &&
    capacityNum >= 1;

  const createEvent = useApiMutation(
    (body: Record<string, unknown>) => apiClient.post('/events', body),
    {
      invalidateKeys: [queryKeys.events.all],
      onSuccess: () => {
        notify({
          title: 'Evento criado como rascunho',
          intent: 'success',
        });
        onClose();
      },
      onError: (e) =>
        setSubmitError(e.message || 'Erro ao criar o evento. Tente novamente.'),
    },
  );
  const loading = createEvent.isPending;

  const handleSubmit = () => {
    if (!canSubmit || loading) return;
    const start = new Date(startAt);
    const end = new Date(endAt);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setSubmitError('Datas inválidas.');
      return;
    }
    if (end.getTime() <= start.getTime()) {
      setSubmitError('A data de fim tem de ser depois da data de início.');
      return;
    }
    setSubmitError('');
    createEvent.mutate({
      title: title.trim(),
      type,
      modalidade,
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      maxCapacity: Math.trunc(capacityNum),
      ...(location.trim() ? { location: location.trim() } : {}),
      ...(meetingUrl.trim() ? { meetingUrl: meetingUrl.trim() } : {}),
      ...(description.trim() ? { description: description.trim() } : {}),
    });
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Criar evento"
        description="O evento fica como rascunho até ser publicado."
        className="max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="mt-5 space-y-4">
          {submitError && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              {submitError}
            </div>
          )}

          <FormField label="Título *" htmlFor="ev-title">
            <Input
              id="ev-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Workshop de Inovação Q1"
            />
          </FormField>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Tipo *" htmlFor="ev-type">
              <Select
                items={TYPE_ITEMS}
                value={type}
                onValueChange={(v) => setType(v as EventType)}
              />
            </FormField>

            <FormField label="Modalidade *" htmlFor="ev-modalidade">
              <Select
                items={MODALITY_ITEMS}
                value={modalidade}
                onValueChange={(v) => setModalidade(v as EventModalidade)}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField label="Início *" htmlFor="ev-start">
              <Input
                id="ev-start"
                type="datetime-local"
                value={startAt}
                onChange={(e) => setStartAt(e.target.value)}
              />
            </FormField>

            <FormField label="Fim *" htmlFor="ev-end">
              <Input
                id="ev-end"
                type="datetime-local"
                value={endAt}
                onChange={(e) => setEndAt(e.target.value)}
              />
            </FormField>
          </div>

          <FormField
            label="Local"
            htmlFor="ev-location"
            hint="Opcional — morada ou sala para eventos presenciais."
          >
            <Input
              id="ev-location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Ex.: Auditório, Piso 3"
            />
          </FormField>

          <FormField
            label="Link da reunião"
            htmlFor="ev-meeting"
            hint="Opcional — Zoom, Teams ou Meet para eventos online."
          >
            <Input
              id="ev-meeting"
              value={meetingUrl}
              onChange={(e) => setMeetingUrl(e.target.value)}
              placeholder="https://…"
            />
          </FormField>

          <FormField label="Capacidade máxima *" htmlFor="ev-capacity">
            <Input
              id="ev-capacity"
              type="number"
              min={1}
              value={maxCapacity}
              onChange={(e) => setMaxCapacity(e.target.value)}
            />
          </FormField>

          <FormField
            label="Descrição"
            htmlFor="ev-description"
            hint="Opcional."
          >
            <Textarea
              id="ev-description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Agenda, oradores, pré-requisitos…"
            />
          </FormField>
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
            Criar evento
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
