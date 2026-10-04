// components/leave/RegisterAbsenceModal.tsx
// Modal "Registar ausência" (docs/Modulo_Leave.md §5). O backend associa a
// falta ao registo de assiduidade existente em vez de criar uma segunda
// ocorrência, e recusa dias cobertos por férias/licença aprovadas ou
// sobrepostos a outra ocorrência — os erros são mostrados tal como chegam.

'use client';

import { useState } from 'react';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { Button, IconButton } from '@/components/ui/Button';
import { Combobox } from '@/components/ui/Combobox';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ABSENCE_TYPE_LABELS, TIMED_ABSENCE_TYPES } from './constants';
import {
  CAN_PICK_EMPLOYEE_ABSENCE,
  useEmployeeOptions,
} from './useEmployeeOptions';
import type { AbsenceOccurrenceType } from './types';

interface DocDraft {
  name: string;
  fileUrl: string;
}

const EMPTY_DOC: DocDraft = { name: '', fileUrl: '' };
const TYPE_ITEMS = (
  Object.entries(ABSENCE_TYPE_LABELS) as Array<[AbsenceOccurrenceType, string]>
).map(([value, label]) => ({ value, label }));

export interface RegisterAbsenceModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function RegisterAbsenceModal({
  onClose,
  onSuccess,
}: RegisterAbsenceModalProps) {
  const role = useCurrentRole();
  const canPick = !!role && CAN_PICK_EMPLOYEE_ABSENCE.includes(role);
  const employees = useEmployeeOptions('leave-absence', canPick);

  const [form, setForm] = useState({
    userId: '',
    date: new Date().toISOString().slice(0, 10),
    occurrenceType: '' as AbsenceOccurrenceType | '',
    customCategory: '',
    startTime: '',
    endTime: '',
    justification: '',
  });
  const [docs, setDocs] = useState<DocDraft[]>([{ ...EMPTY_DOC }]);
  const [submitError, setSubmitError] = useState('');
  const set = (patch: Partial<typeof form>) =>
    setForm((f) => ({ ...f, ...patch }));

  const timed =
    !!form.occurrenceType && TIMED_ABSENCE_TYPES.includes(form.occurrenceType);
  const filledDocs = docs.filter((d) => d.name.trim() && d.fileUrl.trim());
  const docsIncomplete = docs.some(
    (d) => !!d.name.trim() !== !!d.fileUrl.trim(),
  );
  const timesPartial = !!form.startTime !== !!form.endTime;
  const timesInvalid =
    !!form.startTime && !!form.endTime && form.endTime <= form.startTime;

  const create = useApiMutation(
    () =>
      apiClient.post('/leave/absences', {
        userId: canPick && form.userId ? Number(form.userId) : undefined,
        date: form.date,
        occurrenceType: form.occurrenceType,
        customCategory:
          form.occurrenceType === 'OTHER'
            ? form.customCategory.trim()
            : undefined,
        startTime: form.startTime || undefined,
        endTime: form.endTime || undefined,
        justification: form.justification.trim() || undefined,
        attachments: filledDocs.length
          ? filledDocs.map((d) => ({
              name: d.name.trim(),
              fileUrl: d.fileUrl.trim(),
            }))
          : undefined,
      }),
    {
      invalidateKeys: [queryKeys.leave.all],
      onSuccess: () => {
        onSuccess();
        onClose();
      },
      onError: (e) => setSubmitError(e.message),
    },
  );

  const missing = !form.date
    ? 'Indique a data da ocorrência.'
    : !form.occurrenceType
      ? 'Seleccione o tipo de ocorrência.'
      : form.occurrenceType === 'OTHER' && !form.customCategory.trim()
        ? 'Indique a categoria da ocorrência.'
        : timed && !(form.startTime && form.endTime)
          ? 'Este tipo exige hora de início e de fim.'
          : timesPartial
            ? 'Indique a hora de início e a hora de fim.'
            : timesInvalid
              ? 'A hora de fim tem de ser posterior ao início.'
              : docsIncomplete
                ? 'Preencha o nome e o endereço (https) de cada comprovativo.'
                : '';

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Registar ausência"
        description="Se a falta já consta da assiduidade, é associada ao registo existente."
        className="max-w-xl max-h-[90vh] overflow-y-auto"
      >
        <div className="mt-4 space-y-4">
          {submitError && (
            <div className="flex items-center gap-2 p-3 bg-danger-subtle text-danger-ink rounded-card text-sm">
              <AlertCircle size={16} strokeWidth={1.75} />
              {submitError}
            </div>
          )}

          {canPick && (
            <FormField label="Colaborador *" htmlFor="abs-user">
              <Combobox
                items={employees}
                value={form.userId}
                onValueChange={(v) => set({ userId: v })}
                placeholder="Eu próprio(a) — ou seleccionar colaborador"
                searchPlaceholder="Procurar colaborador…"
                emptyText="Nenhum colaborador encontrado"
                className="w-full"
              />
            </FormField>
          )}

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Data da ocorrência *" htmlFor="abs-date">
              <Input
                id="abs-date"
                type="date"
                value={form.date}
                onChange={(e) => set({ date: e.target.value })}
                className="w-full"
              />
            </FormField>
            <FormField label="Tipo de ocorrência *" htmlFor="abs-type">
              <Select
                className="w-full"
                value={form.occurrenceType}
                onValueChange={(v) =>
                  set({ occurrenceType: v as AbsenceOccurrenceType })
                }
                placeholder="Seleccionar tipo"
                items={TYPE_ITEMS}
              />
            </FormField>
          </div>

          {form.occurrenceType === 'OTHER' && (
            <FormField label="Categoria *" htmlFor="abs-custom">
              <Input
                id="abs-custom"
                value={form.customCategory}
                maxLength={100}
                onChange={(e) => set({ customCategory: e.target.value })}
                placeholder="Categoria definida pelo RH"
                className="w-full"
              />
            </FormField>
          )}

          <div className="grid grid-cols-2 gap-3">
            <FormField
              label={`Hora de início${timed ? ' *' : ''}`}
              htmlFor="abs-stime"
              hint="Deixe vazio para o dia inteiro"
            >
              <Input
                id="abs-stime"
                type="time"
                value={form.startTime}
                onChange={(e) => set({ startTime: e.target.value })}
                className="w-full"
              />
            </FormField>
            <FormField
              label={`Hora de fim${timed ? ' *' : ''}`}
              htmlFor="abs-etime"
            >
              <Input
                id="abs-etime"
                type="time"
                value={form.endTime}
                onChange={(e) => set({ endTime: e.target.value })}
                className="w-full"
              />
            </FormField>
          </div>

          <FormField
            label="Justificação"
            htmlFor="abs-just"
            hint="Se preencher a justificação ou anexar comprovativo, fica submetida para validação"
          >
            <Textarea
              id="abs-just"
              rows={3}
              value={form.justification}
              onChange={(e) => set({ justification: e.target.value })}
              placeholder="Informação apresentada"
              className="w-full resize-none"
            />
          </FormField>

          <div className="space-y-2">
            <p className="text-sm font-medium text-ink">Comprovativo</p>
            {docs.map((d, i) => (
              <div key={i} className="flex items-start gap-2">
                <Input
                  aria-label={`Nome do comprovativo ${i + 1}`}
                  placeholder="Nome do documento"
                  value={d.name}
                  onChange={(e) =>
                    setDocs((all) =>
                      all.map((x, j) =>
                        j === i ? { ...x, name: e.target.value } : x,
                      ),
                    )
                  }
                  className="w-full"
                />
                <Input
                  aria-label={`Endereço do comprovativo ${i + 1}`}
                  placeholder="https://…"
                  value={d.fileUrl}
                  onChange={(e) =>
                    setDocs((all) =>
                      all.map((x, j) =>
                        j === i ? { ...x, fileUrl: e.target.value } : x,
                      ),
                    )
                  }
                  className="w-full"
                />
                <IconButton
                  icon={Trash2}
                  label="Remover comprovativo"
                  intent="ghost"
                  disabled={docs.length === 1 && !d.name && !d.fileUrl}
                  onClick={() =>
                    setDocs((all) =>
                      all.length === 1
                        ? [{ ...EMPTY_DOC }]
                        : all.filter((_, j) => j !== i),
                    )
                  }
                />
              </div>
            ))}
            {docs.length < 10 && (
              <Button
                intent="ghost"
                size="sm"
                onClick={() => setDocs((all) => [...all, { ...EMPTY_DOC }])}
              >
                <Plus size={13} strokeWidth={1.75} /> Adicionar comprovativo
              </Button>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3 border-t border-border pt-4">
          {missing && <span className="text-xs text-ink-faint">{missing}</span>}
          <div className="flex-1" />
          <Button intent="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            loading={create.isPending}
            disabled={!!missing}
            onClick={() => {
              setSubmitError('');
              create.mutate(undefined);
            }}
          >
            Registar ausência
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
