// components/users/createUser/AccountSections.tsx
// Secções «Conta de acesso», «Academia» e «RH» do formulário Novo Utilizador (apresentação).

import { Combobox } from '@/components/ui/Combobox';
import { FormField } from '@/components/ui/FormField';
import {
  CONTENT_ACCESS_LEVEL_OPTIONS,
  COST_CENTER_OPTIONS,
  LEARNING_PROFILE_OPTIONS,
  SYSTEM_FUNCTION_OPTIONS,
  WORK_SCHEDULE_OPTIONS,
} from '../createUserOptions';
import { ACCOUNT_STATUS_OPTIONS, LANGUAGE_OPTIONS } from './constants';
import {
  EnumSelect,
  Field,
  ListField,
  MultiPicker,
  SectionTitle,
} from './fields';
import type { CreateUserFormController } from '@/hooks/useCreateUserForm';
import { Checkbox } from '@/components/ui/Checkbox';

export function AccessSection({ ctl }: { ctl: CreateUserFormController }) {
  const {
    form,
    setField,
    handle,
    roleOptions,
    rolesLoading,
    permissionOptions,
    permissionsLoading,
  } = ctl;

  return (
    <>
      <SectionTitle>Conta de acesso</SectionTitle>
      <Field
        label="Username"
        id="username"
        value={form.username}
        onChange={handle('username')}
      />
      <FormField label="Perfil de acesso" htmlFor="roleId">
        <Combobox
          items={roleOptions}
          value={form.roleId || undefined}
          onValueChange={(v) => setField('roleId', v)}
          placeholder={rolesLoading ? 'A carregar…' : 'Selecionar perfil'}
          disabled={rolesLoading}
        />
      </FormField>
      <ListField
        id="systemFunction"
        label="Função no sistema"
        value={form.systemFunction}
        onChange={(v) => setField('systemFunction', v)}
        options={SYSTEM_FUNCTION_OPTIONS}
      />
      <EnumSelect
        id="accountStatus"
        label="Estado da conta"
        value={form.accountStatus}
        onChange={(v) => setField('accountStatus', v)}
        options={ACCOUNT_STATUS_OPTIONS}
      />
      <EnumSelect
        id="language"
        label="Idioma"
        value={form.language}
        onChange={(v) => setField('language', v)}
        options={LANGUAGE_OPTIONS}
      />
      <Field
        label="Fuso horário"
        id="timezone"
        value={form.timezone}
        onChange={handle('timezone')}
      />
      <label className="flex items-center gap-2 pb-2.5 text-sm text-ink-muted">
        <Checkbox
          checked={form.mfaEnabled}
          onChange={(e) => setField('mfaEnabled', e.target.checked)}
        />
        Autenticação multifator (MFA)
      </label>
      <div className="col-span-2">
        <MultiPicker
          id="additionalPermissionIds"
          label="Permissões adicionais"
          options={permissionOptions}
          loading={permissionsLoading}
          selected={form.additionalPermissionIds}
          onChange={(ids) => setField('additionalPermissionIds', ids)}
          placeholder="Adicionar permissão…"
        />
      </div>
    </>
  );
}

export function AcademySection({ ctl }: { ctl: CreateUserFormController }) {
  const {
    form,
    setField,
    courseOptions,
    coursesLoading,
    learningPathOptions,
    learningPathsLoading,
    competencyOptions,
    competenciesLoading,
  } = ctl;

  return (
    <>
      <SectionTitle>Academia</SectionTitle>
      <ListField
        id="learningProfile"
        label="Perfil de aprendizagem"
        value={form.learningProfile}
        onChange={(v) => setField('learningProfile', v)}
        options={LEARNING_PROFILE_OPTIONS}
      />
      <ListField
        id="contentAccessLevel"
        label="Nível de acesso aos conteúdos"
        value={form.contentAccessLevel}
        onChange={(v) => setField('contentAccessLevel', v)}
        options={CONTENT_ACCESS_LEVEL_OPTIONS}
      />
      <label className="col-span-2 flex items-center gap-2 pb-1 text-sm text-ink-muted">
        <Checkbox
          checked={form.isInstructor}
          onChange={(e) => setField('isInstructor', e.target.checked)}
        />
        É formador/instrutor
      </label>
      <div className="col-span-2">
        <MultiPicker
          id="courseIds"
          label="Cursos atribuídos"
          options={courseOptions}
          loading={coursesLoading}
          selected={form.courseIds}
          onChange={(ids) => setField('courseIds', ids)}
          placeholder="Adicionar curso…"
        />
      </div>
      <div className="col-span-2">
        <MultiPicker
          id="learningPathIds"
          label="Percursos atribuídos"
          options={learningPathOptions}
          loading={learningPathsLoading}
          selected={form.learningPathIds}
          onChange={(ids) => setField('learningPathIds', ids)}
          placeholder="Adicionar percurso…"
        />
      </div>
      <div className="col-span-2">
        <MultiPicker
          id="competencyIds"
          label="Competências"
          options={competencyOptions}
          loading={competenciesLoading}
          selected={form.competencyIds}
          onChange={(ids) => setField('competencyIds', ids)}
          placeholder="Adicionar competência…"
        />
      </div>
    </>
  );
}

export function HrSection({ ctl }: { ctl: CreateUserFormController }) {
  const { form, setField, handle } = ctl;

  return (
    <>
      <SectionTitle>RH</SectionTitle>
      <ListField
        id="costCenter"
        label="Centro de custo"
        value={form.costCenter}
        onChange={(v) => setField('costCenter', v)}
        options={COST_CENTER_OPTIONS}
      />
      <Field
        label="Data de fim"
        id="exitDate"
        type="date"
        value={form.exitDate}
        onChange={handle('exitDate')}
      />
      <ListField
        id="workSchedule"
        label="Horário"
        value={form.workSchedule}
        onChange={(v) => setField('workSchedule', v)}
        options={WORK_SCHEDULE_OPTIONS}
      />
    </>
  );
}
