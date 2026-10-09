// components/courses/CohortInfoEditor.tsx
// Edição dos dados de uma turma já criada (nome, local, sala, horário e
// datas) — PATCH /courses/cohorts/:id. Vagas e formador têm edição própria.

'use client';

import { useState } from 'react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import type { CohortDetail } from './types';

export interface CohortInfoEditorProps {
  cohort: CohortDetail;
  invalidateKeys: readonly (readonly unknown[])[];
  onDone: () => void;
}

function toDateInput(iso: string | null): string {
  return iso ? iso.slice(0, 10) : '';
}

export function CohortInfoEditor({
  cohort,
  invalidateKeys,
  onDone,
}: CohortInfoEditorProps) {
  const toast = useToast();
  const [name, setName] = useState(cohort.name);
  const [location, setLocation] = useState(cohort.location ?? '');
  const [room, setRoom] = useState(cohort.room ?? '');
  const [schedule, setSchedule] = useState(cohort.schedule ?? '');
  const [startDate, setStartDate] = useState(toDateInput(cohort.startDate));
  const [endDate, setEndDate] = useState(toDateInput(cohort.endDate));

  const save = useApiMutation(
    (body: Record<string, unknown>) =>
      apiClient.patch(`/courses/cohorts/${cohort.id}`, body),
    {
      invalidateKeys: invalidateKeys as never,
      onSuccess: () => {
        toast({ title: 'Turma actualizada', intent: 'success' });
        onDone();
      },
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  const canSave = Boolean(name.trim() && startDate) && !save.isPending;

  function handleSave() {
    if (!canSave) return;
    save.mutate({
      name: name.trim(),
      location: location.trim(),
      room: room.trim(),
      schedule: schedule.trim(),
      startDate,
      endDate: endDate || undefined,
    });
  }

  return (
    <div className="space-y-3 rounded-card border border-border p-3">
      <FormField label="Nome da turma *" htmlFor="ced-name">
        <Input
          id="ced-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full"
          autoComplete="off"
        />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Local" htmlFor="ced-location">
          <Input
            id="ced-location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full"
            autoComplete="off"
          />
        </FormField>
        <FormField label="Sala" htmlFor="ced-room">
          <Input
            id="ced-room"
            value={room}
            onChange={(e) => setRoom(e.target.value)}
            className="w-full"
            autoComplete="off"
          />
        </FormField>
      </div>
      <FormField label="Horário" htmlFor="ced-schedule">
        <Input
          id="ced-schedule"
          value={schedule}
          onChange={(e) => setSchedule(e.target.value)}
          className="w-full"
          placeholder="Ex: Seg/Qua 18h-20h"
          autoComplete="off"
        />
      </FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Data de início *" htmlFor="ced-start">
          <Input
            id="ced-start"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full"
          />
        </FormField>
        <FormField label="Data de fim" htmlFor="ced-end">
          <Input
            id="ced-end"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full"
          />
        </FormField>
      </div>
      <div className="flex justify-end gap-2">
        <Button size="sm" intent="secondary" onClick={onDone}>
          Cancelar
        </Button>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={!canSave}
          loading={save.isPending}
        >
          Guardar
        </Button>
      </div>
    </div>
  );
}
