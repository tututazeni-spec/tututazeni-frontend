// components/users/createUser/ProfessionalSection.tsx
// Secção «Dados profissionais» do formulário Novo Utilizador (apresentação).

import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { EditOrgListsModal } from './EditOrgListsModal';
import { Combobox } from '@/components/ui/Combobox';
import { FormField } from '@/components/ui/FormField';
import {
  JOB_FUNCTION_OPTIONS,
  PROFESSIONAL_CATEGORY_OPTIONS,
} from '../createUserOptions';
import {
  CONTRACT_TYPE_OPTIONS,
  HR_STATUS_OPTIONS,
  WORK_MODE_OPTIONS,
} from './constants';
import { EnumSelect, Field, ListField, SectionTitle } from './fields';
import { ManagerPicker } from './ManagerPicker';
import type { CreateUserFormController } from '@/hooks/useCreateUserForm';

export function ProfessionalSection({
  ctl,
}: {
  ctl: CreateUserFormController;
}) {
  const {
    form,
    setField,
    handle,
    selectedManager,
    managerSearch,
    setManagerSearch,
    managerResults,
    managersLoading,
    pickManager,
    clearManager,
    selectedMentor,
    mentorSearch,
    setMentorSearch,
    mentorResults,
    mentorsLoading,
    pickMentor,
    clearMentor,
    selectedHr,
    hrSearch,
    setHrSearch,
    hrResults,
    hrLoading,
    pickHr,
    clearHr,
    unitOptions,
    unitsLoading,
    departmentOptions,
    departmentsLoading,
    positionOptions,
    positionsLoading,
    areaOptions,
    org,
    unitValue,
    changeUnit,
    changeDepartment,
  } = ctl;

  const [editingLists, setEditingLists] = useState(false);
  const departmentName =
    departmentOptions.find((d) => d.value === form.departmentId)?.label ?? '';

  return (
    <>
      <SectionTitle>Dados profissionais</SectionTitle>
      <Field
        label="Nº funcionário"
        id="employeeNumber"
        value={form.employeeNumber}
        onChange={handle('employeeNumber')}
      />
      <Field
        label="Empresa"
        id="companyName"
        value={form.companyName}
        onChange={handle('companyName')}
      />
      <FormField label="Unidade" htmlFor="unitId">
        <Combobox
          items={unitOptions}
          value={unitValue || undefined}
          onValueChange={changeUnit}
          allowCustom
          placeholder={unitsLoading ? 'A carregar…' : 'Selecionar unidade'}
          searchPlaceholder="Escreva para filtrar ou indicar outra…"
          disabled={unitsLoading}
        />
      </FormField>
      <FormField label="Departamento" htmlFor="departmentId">
        <Combobox
          items={departmentOptions}
          value={form.departmentId || undefined}
          onValueChange={changeDepartment}
          placeholder={
            departmentsLoading ? 'A carregar…' : 'Selecionar departamento'
          }
          disabled={departmentsLoading}
        />
      </FormField>
      <ListField
        id="area"
        label="Área"
        value={form.area}
        onChange={(v) => setField('area', v)}
        options={areaOptions}
        custom
      />
      {form.departmentId && (
        <div className="col-span-2 -mt-2">
          <Button
            intent="ghost"
            size="sm"
            type="button"
            onClick={() => setEditingLists(true)}
          >
            <Pencil size={14} strokeWidth={1.75} />
            Editar listas de unidades e áreas deste departamento
          </Button>
        </div>
      )}
      {editingLists && (
        <EditOrgListsModal
          key={`${form.departmentId}-${org?.units.length ?? 0}`}
          departmentId={form.departmentId}
          departmentName={departmentName}
          org={org}
          onClose={() => setEditingLists(false)}
        />
      )}
      <FormField label="Cargo" htmlFor="positionId">
        <Combobox
          items={positionOptions}
          value={form.positionId || undefined}
          onValueChange={(v) => setField('positionId', v)}
          placeholder={positionsLoading ? 'A carregar…' : 'Selecionar cargo'}
          disabled={positionsLoading}
        />
      </FormField>
      <ListField
        id="jobFunction"
        label="Função"
        value={form.jobFunction}
        onChange={(v) => setField('jobFunction', v)}
        options={JOB_FUNCTION_OPTIONS}
        custom
      />
      <ListField
        id="professionalCategory"
        label="Categoria profissional"
        value={form.professionalCategory}
        onChange={(v) => setField('professionalCategory', v)}
        options={PROFESSIONAL_CATEGORY_OPTIONS}
        custom
      />

      <ManagerPicker
        selected={selectedManager}
        search={managerSearch}
        onSearch={setManagerSearch}
        results={managerResults}
        loading={managersLoading}
        onPick={pickManager}
        onClear={clearManager}
      />
      <ManagerPicker
        label="Mentor"
        inputId="mentorSearch"
        clearLabel="Remover mentor"
        selected={selectedMentor}
        search={mentorSearch}
        onSearch={setMentorSearch}
        results={mentorResults}
        loading={mentorsLoading}
        onPick={pickMentor}
        onClear={clearMentor}
      />
      <ManagerPicker
        label="RH responsável"
        inputId="hrSearch"
        clearLabel="Remover RH responsável"
        selected={selectedHr}
        search={hrSearch}
        onSearch={setHrSearch}
        results={hrResults}
        loading={hrLoading}
        onPick={pickHr}
        onClear={clearHr}
      />
      <Field
        label="Localização"
        id="workLocation"
        value={form.workLocation}
        onChange={handle('workLocation')}
      />
      <Field
        label="Data de admissão"
        id="hireDate"
        type="date"
        value={form.hireDate}
        onChange={handle('hireDate')}
      />
      <EnumSelect
        id="contractType"
        label="Tipo de contrato"
        value={form.contractType}
        onChange={(v) => setField('contractType', v)}
        options={CONTRACT_TYPE_OPTIONS}
      />
      <EnumSelect
        id="workMode"
        label="Regime de trabalho"
        value={form.workMode}
        onChange={(v) => setField('workMode', v)}
        options={WORK_MODE_OPTIONS}
      />
      <EnumSelect
        id="hrStatus"
        label="Estado do colaborador"
        value={form.hrStatus}
        onChange={(v) => setField('hrStatus', v)}
        options={HR_STATUS_OPTIONS}
      />
    </>
  );
}
