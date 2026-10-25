// components/audit/audits/NewAuditForm.tsx
// Formulário «Nova auditoria» (apresentação). O estado e a submissão vivem em
// hooks/useCreateInternalAudit.ts.

import { AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { DepartmentUserPicker } from '@/components/departments/DepartmentUserPicker';
import type { CreateInternalAuditController } from '@/hooks/useCreateInternalAudit';
import { TYPES } from './constants';
import type { InternalAuditType } from '../types';

interface NewAuditFormProps {
  ctl: CreateInternalAuditController;
  onClose: () => void;
}

export function NewAuditForm({ ctl, onClose }: NewAuditFormProps) {
  const {
    form,
    set,
    lead,
    setLead,
    team,
    member,
    pickMember,
    removeMember,
    error,
    submit,
    isPending,
  } = ctl;

  return (
    <Modal open onOpenChange={(o) => !o && onClose()}>
      <ModalContent
        title="Nova auditoria"
        className="max-h-[90vh] max-w-2xl overflow-y-auto"
      >
        <div className="mt-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              {error}
            </div>
          )}
          <div className="grid grid-cols-[1fr_180px] gap-3">
            <FormField label="Título *" htmlFor="aud-title">
              <Input
                id="aud-title"
                value={form.title}
                onChange={(e) => set({ title: e.target.value })}
              />
            </FormField>
            <FormField label="Tipo *" htmlFor="aud-type">
              <Select
                items={TYPES}
                value={form.type}
                onValueChange={(v) => set({ type: v as InternalAuditType })}
              />
            </FormField>
          </div>
          <FormField label="Objetivo" htmlFor="aud-obj">
            <Textarea
              id="aud-obj"
              rows={2}
              className="w-full"
              value={form.objective}
              onChange={(e) => set({ objective: e.target.value })}
            />
          </FormField>
          <FormField label="Âmbito" htmlFor="aud-scope">
            <Textarea
              id="aud-scope"
              rows={2}
              className="w-full"
              value={form.scope}
              onChange={(e) => set({ scope: e.target.value })}
            />
          </FormField>
          <FormField
            label="Módulos abrangidos"
            htmlFor="aud-mods"
            hint="Separados por vírgula (ex.: Payroll, Assiduidade)"
          >
            <Input
              id="aud-mods"
              value={form.modules}
              onChange={(e) => set({ modules: e.target.value })}
            />
          </FormField>
          <FormField
            label="Critérios e políticas aplicáveis"
            htmlFor="aud-crit"
          >
            <Textarea
              id="aud-crit"
              rows={2}
              className="w-full"
              value={form.criteria}
              onChange={(e) => set({ criteria: e.target.value })}
            />
          </FormField>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <FormField label="Período de" htmlFor="aud-pf">
              <Input
                id="aud-pf"
                type="date"
                value={form.periodFrom}
                onChange={(e) => set({ periodFrom: e.target.value })}
              />
            </FormField>
            <FormField label="Período até" htmlFor="aud-pt">
              <Input
                id="aud-pt"
                type="date"
                value={form.periodTo}
                onChange={(e) => set({ periodTo: e.target.value })}
              />
            </FormField>
            <FormField label="Data de início" htmlFor="aud-sd">
              <Input
                id="aud-sd"
                type="date"
                value={form.startDate}
                onChange={(e) => set({ startDate: e.target.value })}
              />
            </FormField>
            <FormField label="Prazo" htmlFor="aud-dd">
              <Input
                id="aud-dd"
                type="date"
                value={form.dueDate}
                onChange={(e) => set({ dueDate: e.target.value })}
              />
            </FormField>
          </div>
          <DepartmentUserPicker
            label="Auditor responsável"
            htmlFor="aud-lead"
            value={lead}
            onChange={setLead}
          />
          <div>
            <DepartmentUserPicker
              label="Equipa de auditoria"
              htmlFor="aud-team"
              value={member}
              onChange={pickMember}
            />
            <div className="mt-2 flex flex-wrap gap-2">
              {team.map((t) => (
                <span
                  key={t.id}
                  className="inline-flex items-center gap-1 rounded-pill bg-surface-sunken px-2.5 py-0.5 font-body text-xs text-ink"
                >
                  {t.fullName}
                  <button
                    aria-label={`Remover ${t.fullName}`}
                    onClick={() => removeMember(t.id)}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button intent="secondary" onClick={onClose}>
              Cancelar
            </Button>
            <Button loading={isPending} onClick={submit}>
              Criar auditoria
            </Button>
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
