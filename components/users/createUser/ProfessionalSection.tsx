// components/users/createUser/ProfessionalSection.tsx
// Secção «Dados profissionais» do formulário Novo Utilizador (apresentação).

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
    unitOptions,
    unitsLoading,
    departmentOptions,
    departmentsLoading,
    positionOptions,
    positionsLoading,
  } = ctl;

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
          value={form.unitId || undefined}
          onValueChange={(v) => setField('unitId', v)}
          placeholder={unitsLoading ? 'A carregar…' : 'Selecionar unidade'}
          disabled={unitsLoading}
        />
      </FormField>
      <FormField label="Departamento" htmlFor="departmentId">
        <Combobox
          items={departmentOptions}
          value={form.departmentId || undefined}
          onValueChange={(v) => setField('departmentId', v)}
          placeholder={
            departmentsLoading ? 'A carregar…' : 'Selecionar departamento'
          }
          disabled={departmentsLoading}
        />
      </FormField>
      <Field
        label="Área"
        id="area"
        value={form.area}
        onChange={handle('area')}
      />
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
