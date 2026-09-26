// components/users/CreateUserView.tsx
// Vista "Novo Utilizador" (docs/modulo_users.md Ponto 2): formulário de
// criação de utilizador, organizado nas mesmas secções do doc — Dados
// pessoais, Dados profissionais, Dados de contacto, Conta de acesso,
// Academia, RH e Estado do utilizador. Os pickers de organização/acesso/
// academia vêm de ./createUserData (hooks módulo-local, mesmo padrão de
// components/onboarding/planData.ts).

'use client';

import { useState } from 'react';
import { ArrowLeft, X } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useFormValidation } from '@/hooks/useFormValidation';
import {
  email as emailValidator,
  required as requiredRule,
} from '@/lib/validation';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Combobox, type ComboboxOption } from '@/components/ui/Combobox';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  CONTRACT_LABELS,
  WORKMODE_LABELS,
} from '@/components/employees/constants';
import {
  ACCOUNT_STATUS_MAP,
  HR_STATUS_MAP,
  type DirectoryUser,
} from './types';
import {
  useCompetencyOptions,
  useCourseOptions,
  useDepartmentOptions,
  useDirectoryUsers,
  useLearningPathOptions,
  usePermissionOptions,
  usePositionOptions,
  useRoleOptions,
  useUnitOptions,
  type Option,
} from './createUserData';

interface CreateUserViewProps {
  onBack: () => void;
  onCreated: () => void;
}

interface UserFormValues {
  // Dados pessoais
  fullName: string;
  preferredName: string;
  avatarUrl: string;
  gender: string;
  birthDate: string;
  nationality: string;
  country: string;
  identificationNumber: string;
  nif: string;
  // Dados profissionais
  employeeNumber: string;
  companyName: string;
  unitId: string;
  departmentId: string;
  area: string;
  positionId: string;
  jobFunction: string;
  professionalCategory: string;
  workLocation: string;
  hireDate: string;
  contractType: string;
  workMode: string;
  hrStatus: string;
  // Dados de contacto
  email: string;
  personalEmail: string;
  phone: string;
  alternatePhone: string;
  address: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  // Conta de acesso
  password: string;
  username: string;
  roleId: string;
  systemFunction: string;
  accountStatus: string;
  mfaEnabled: boolean;
  language: string;
  timezone: string;
  // Academia
  learningProfile: string;
  isInstructor: boolean;
  contentAccessLevel: string;
  courseIds: number[];
  learningPathIds: number[];
  competencyIds: number[];
  additionalPermissionIds: number[];
  // RH
  costCenter: string;
  exitDate: string;
  workSchedule: string;
}

interface FieldProps {
  label: string;
  id: string;
  type?: string;
  required?: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

// Hoisted fora de CreateUserView: definir um componente dentro doutro
// componente cria uma nova identidade de tipo a cada render — React
// desmonta e remonta toda a subárvore a cada keystroke em qualquer campo.
function Field({
  label,
  id,
  type = 'text',
  required = false,
  value,
  onChange,
}: FieldProps) {
  return (
    <FormField label={required ? `${label} *` : label} htmlFor={id}>
      <Input id={id} type={type} value={value} onChange={onChange} className="w-full" />
    </FormField>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="col-span-2 mt-2">
      <div className="text-xs font-medium text-ink-faint uppercase tracking-wide mb-3 pb-2 border-b border-border">
        {children}
      </div>
    </div>
  );
}

function EnumSelect({
  id,
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
}) {
  return (
    <FormField label={label} htmlFor={id}>
      <Select
        items={options}
        value={value || undefined}
        onValueChange={onChange}
        placeholder={placeholder ?? 'Selecionar…'}
        className="w-full"
      />
    </FormField>
  );
}

/** Picker de múltiplas entidades (cursos/percursos/competências/permissões):
 *  Combobox para adicionar + chips removíveis. Usado 4× nesta vista. */
function MultiPicker({
  id,
  label,
  options,
  loading,
  selected,
  onChange,
  placeholder = 'Adicionar…',
}: {
  id: string;
  label: string;
  options: Option[];
  loading?: boolean;
  selected: number[];
  onChange: (ids: number[]) => void;
  placeholder?: string;
}) {
  const selectedSet = new Set(selected);
  const available = options.filter((o) => !selectedSet.has(Number(o.value)));
  const labelFor = (pid: number) =>
    options.find((o) => Number(o.value) === pid)?.label ?? `#${pid}`;

  return (
    <FormField label={label} htmlFor={id}>
      <Combobox
        items={available}
        value={undefined}
        onValueChange={(v) => {
          const pid = Number(v);
          if (!Number.isNaN(pid)) onChange([...selected, pid]);
        }}
        placeholder={loading ? 'A carregar…' : placeholder}
        disabled={loading}
      />
      {selected.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selected.map((pid) => (
            <span
              key={pid}
              className="inline-flex items-center gap-1 rounded-control bg-surface-sunken px-2 py-1 text-xs text-ink"
            >
              {labelFor(pid)}
              <button
                type="button"
                aria-label="Remover"
                onClick={() => onChange(selected.filter((s) => s !== pid))}
                className="text-ink-muted hover:text-ink"
              >
                <X size={12} strokeWidth={2} />
              </button>
            </span>
          ))}
        </div>
      )}
    </FormField>
  );
}

const GENDER_OPTIONS: ComboboxOption[] = [
  { value: 'MALE', label: 'Masculino' },
  { value: 'FEMALE', label: 'Feminino' },
  { value: 'OTHER', label: 'Outro' },
];

const CONTRACT_TYPE_OPTIONS: ComboboxOption[] = Object.entries(CONTRACT_LABELS).map(
  ([value, label]) => ({ value, label }),
);
const WORK_MODE_OPTIONS: ComboboxOption[] = Object.entries(WORKMODE_LABELS).map(
  ([value, label]) => ({ value, label }),
);
const HR_STATUS_OPTIONS: ComboboxOption[] = Object.entries(HR_STATUS_MAP).map(
  ([value, cfg]) => ({ value, label: cfg.label }),
);
const ACCOUNT_STATUS_OPTIONS: ComboboxOption[] = Object.entries(ACCOUNT_STATUS_MAP).map(
  ([value, cfg]) => ({ value, label: cfg.label }),
);
const LANGUAGE_OPTIONS: ComboboxOption[] = [
  { value: 'pt', label: 'Português' },
  { value: 'en', label: 'English' },
];

function numOrUndefined(v: string): number | undefined {
  return v ? parseInt(v, 10) : undefined;
}

/** Chaves de UserFormValues cujo valor é string — as únicas que `handle()`
 *  (usado pelos <Field>/<input>) pode escrever com segurança. */
type StringKeys = {
  [K in keyof UserFormValues]: UserFormValues[K] extends string ? K : never;
}[keyof UserFormValues];

export function CreateUserView({ onBack, onCreated }: CreateUserViewProps) {
  const {
    values: form,
    setField,
    errorMessage: validationError,
    handleSubmit: withValidation,
  } = useFormValidation(
    {
      fullName: '',
      preferredName: '',
      avatarUrl: '',
      gender: '',
      birthDate: '',
      nationality: '',
      country: '',
      identificationNumber: '',
      nif: '',
      employeeNumber: '',
      companyName: '',
      unitId: '',
      departmentId: '',
      area: '',
      positionId: '',
      jobFunction: '',
      professionalCategory: '',
      workLocation: '',
      hireDate: '',
      contractType: '',
      workMode: '',
      hrStatus: 'ACTIVE',
      email: '',
      personalEmail: '',
      phone: '',
      alternatePhone: '',
      address: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      password: '',
      username: '',
      roleId: '',
      systemFunction: '',
      accountStatus: 'PENDING',
      mfaEnabled: false,
      language: 'pt',
      timezone: 'Africa/Luanda',
      learningProfile: '',
      isInstructor: false,
      contentAccessLevel: '',
      courseIds: [] as number[],
      learningPathIds: [] as number[],
      competencyIds: [] as number[],
      additionalPermissionIds: [] as number[],
      costCenter: '',
      exitDate: '',
      workSchedule: '',
    },
    {
      fullName: [requiredRule()],
      email: [requiredRule(), emailValidator()],
    },
  );
  const [submitError, setSubmitError] = useState('');
  const error = validationError || submitError;

  const handle =
    <K extends StringKeys>(k: K) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setField(k, e.target.value as UserFormValues[K]);

  // Gestor direto — pesquisa no diretório interno, mesmo padrão de
  // EnrollUserModal para o picker de colaborador.
  const [managerSearch, setManagerSearch] = useState('');
  const [selectedManager, setSelectedManager] = useState<DirectoryUser | null>(null);
  const { users: managerResults, loading: managersLoading } = useDirectoryUsers(
    managerSearch,
    !selectedManager && managerSearch.trim().length > 0,
  );

  const { options: departmentOptions, loading: departmentsLoading } = useDepartmentOptions();
  const { options: positionOptions, loading: positionsLoading } = usePositionOptions();
  const { options: unitOptions, loading: unitsLoading } = useUnitOptions();
  const { options: roleOptions, loading: rolesLoading } = useRoleOptions();
  const { options: permissionOptions, loading: permissionsLoading } = usePermissionOptions();
  const { options: courseOptions, loading: coursesLoading } = useCourseOptions();
  const { options: learningPathOptions, loading: learningPathsLoading } =
    useLearningPathOptions();
  const { options: competencyOptions, loading: competenciesLoading } = useCompetencyOptions();

  const create = useApiMutation(
    () =>
      apiClient.post('/users', {
        fullName: form.fullName,
        email: form.email,
        password: form.password || undefined,
        preferredName: form.preferredName || undefined,
        avatarUrl: form.avatarUrl || undefined,
        gender: form.gender || undefined,
        birthDate: form.birthDate || undefined,
        nationality: form.nationality || undefined,
        country: form.country || undefined,
        identificationNumber: form.identificationNumber || undefined,
        nif: form.nif || undefined,
        // Campos opcionais em branco vão como undefined, nunca "". Um "" em
        // employeeNumber/username (String? @unique no backend) colide no 2.º
        // utilizador criado sem esse campo.
        employeeNumber: form.employeeNumber || undefined,
        companyName: form.companyName || undefined,
        unitId: numOrUndefined(form.unitId),
        departmentId: numOrUndefined(form.departmentId),
        area: form.area || undefined,
        positionId: numOrUndefined(form.positionId),
        jobFunction: form.jobFunction || undefined,
        professionalCategory: form.professionalCategory || undefined,
        workLocation: form.workLocation || undefined,
        hireDate: form.hireDate || undefined,
        contractType: form.contractType || undefined,
        workMode: form.workMode || undefined,
        hrStatus: form.hrStatus || undefined,
        managerId: selectedManager?.id,
        phone: form.phone || undefined,
        personalEmail: form.personalEmail || undefined,
        alternatePhone: form.alternatePhone || undefined,
        address: form.address || undefined,
        emergencyContactName: form.emergencyContactName || undefined,
        emergencyContactPhone: form.emergencyContactPhone || undefined,
        username: form.username || undefined,
        roleId: numOrUndefined(form.roleId),
        systemFunction: form.systemFunction || undefined,
        accountStatus: form.accountStatus || undefined,
        mfaEnabled: form.mfaEnabled,
        language: form.language || undefined,
        timezone: form.timezone || undefined,
        learningProfile: form.learningProfile || undefined,
        isInstructor: form.isInstructor,
        contentAccessLevel: form.contentAccessLevel || undefined,
        courseIds: form.courseIds.length ? form.courseIds : undefined,
        learningPathIds: form.learningPathIds.length ? form.learningPathIds : undefined,
        competencyIds: form.competencyIds.length ? form.competencyIds : undefined,
        additionalPermissionIds: form.additionalPermissionIds.length
          ? form.additionalPermissionIds
          : undefined,
        costCenter: form.costCenter || undefined,
        exitDate: form.exitDate || undefined,
        workSchedule: form.workSchedule || undefined,
      }),
    {
      invalidateKeys: [queryKeys.users.lists()],
      onSuccess: () => onCreated(),
      onError: (e) => setSubmitError(e.message),
    },
  );
  const saving = create.isPending;

  const handleSubmit = withValidation(() => {
    setSubmitError('');
    create.mutate(undefined);
  });

  return (
    <div>
      <Button intent="ghost" size="sm" className="mb-5" onClick={onBack}>
        <ArrowLeft size={14} strokeWidth={1.75} />
        Cancelar
      </Button>
      <Card className="p-6">
        <div className="text-base font-semibold text-ink mb-5">Novo utilizador</div>

        {error && (
          <div className="bg-danger-subtle border border-danger/30 text-danger-ink rounded-control p-3 text-sm mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-5 mb-6">
          <SectionTitle>Dados pessoais</SectionTitle>
          <Field label="Nome completo" id="fullName" required value={form.fullName} onChange={handle('fullName')} />
          <Field label="Nome preferencial" id="preferredName" value={form.preferredName} onChange={handle('preferredName')} />
          <Field label="Fotografia (URL)" id="avatarUrl" value={form.avatarUrl} onChange={handle('avatarUrl')} />
          <EnumSelect id="gender" label="Género" value={form.gender} onChange={(v) => setField('gender', v)} options={GENDER_OPTIONS} />
          <Field label="Data de nascimento" id="birthDate" type="date" value={form.birthDate} onChange={handle('birthDate')} />
          <Field label="Nacionalidade" id="nationality" value={form.nationality} onChange={handle('nationality')} />
          <Field label="País de residência" id="country" value={form.country} onChange={handle('country')} />
          <Field label="Número de identificação" id="identificationNumber" value={form.identificationNumber} onChange={handle('identificationNumber')} />
          <Field label="NIF" id="nif" value={form.nif} onChange={handle('nif')} />

          <SectionTitle>Dados profissionais</SectionTitle>
          <Field label="Nº funcionário" id="employeeNumber" value={form.employeeNumber} onChange={handle('employeeNumber')} />
          <Field label="Empresa" id="companyName" value={form.companyName} onChange={handle('companyName')} />
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
              placeholder={departmentsLoading ? 'A carregar…' : 'Selecionar departamento'}
              disabled={departmentsLoading}
            />
          </FormField>
          <Field label="Área" id="area" value={form.area} onChange={handle('area')} />
          <FormField label="Cargo" htmlFor="positionId">
            <Combobox
              items={positionOptions}
              value={form.positionId || undefined}
              onValueChange={(v) => setField('positionId', v)}
              placeholder={positionsLoading ? 'A carregar…' : 'Selecionar cargo'}
              disabled={positionsLoading}
            />
          </FormField>
          <Field label="Função" id="jobFunction" value={form.jobFunction} onChange={handle('jobFunction')} />
          <Field label="Categoria profissional" id="professionalCategory" value={form.professionalCategory} onChange={handle('professionalCategory')} />

          <FormField label="Gestor direto" htmlFor="managerSearch">
            {selectedManager ? (
              <div className="flex items-center gap-2 rounded-control border-[1.5px] border-border-strong bg-surface px-2 py-1.5">
                <Avatar name={selectedManager.fullName} url={selectedManager.avatarUrl ?? undefined} size="sm" />
                <div className="min-w-0 flex-1 truncate text-sm text-ink">{selectedManager.fullName}</div>
                <button
                  type="button"
                  aria-label="Remover gestor"
                  onClick={() => setSelectedManager(null)}
                  className="rounded-control p-1 text-ink-muted hover:bg-surface-sunken hover:text-ink"
                >
                  <X size={16} strokeWidth={1.75} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  id="managerSearch"
                  value={managerSearch}
                  onChange={(e) => setManagerSearch(e.target.value)}
                  className="w-full"
                  placeholder="Pesquisar por nome ou email…"
                  autoComplete="off"
                />
                {managerSearch.trim().length > 0 && (
                  <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-card border border-border bg-surface shadow-elevated">
                    {managersLoading && (
                      <div className="px-3 py-2 text-sm text-ink-muted">A pesquisar…</div>
                    )}
                    {!managersLoading && managerResults.length === 0 && (
                      <div className="px-3 py-2 text-sm text-ink-muted">Nenhum colaborador encontrado</div>
                    )}
                    {managerResults.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setSelectedManager(u);
                          setManagerSearch('');
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-primary-subtle"
                      >
                        <Avatar name={u.fullName} url={u.avatarUrl ?? undefined} size="sm" />
                        <div className="min-w-0">
                          <div className="truncate text-sm text-ink">{u.fullName}</div>
                          <div className="truncate text-xs text-ink-faint">{u.department?.name ?? u.email ?? '—'}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </FormField>
          <Field label="Localização" id="workLocation" value={form.workLocation} onChange={handle('workLocation')} />
          <Field label="Data de admissão" id="hireDate" type="date" value={form.hireDate} onChange={handle('hireDate')} />
          <EnumSelect id="contractType" label="Tipo de contrato" value={form.contractType} onChange={(v) => setField('contractType', v)} options={CONTRACT_TYPE_OPTIONS} />
          <EnumSelect id="workMode" label="Regime de trabalho" value={form.workMode} onChange={(v) => setField('workMode', v)} options={WORK_MODE_OPTIONS} />
          <EnumSelect id="hrStatus" label="Estado do colaborador" value={form.hrStatus} onChange={(v) => setField('hrStatus', v)} options={HR_STATUS_OPTIONS} />

          <SectionTitle>Dados de contacto</SectionTitle>
          <Field label="Email profissional" id="email" type="email" required value={form.email} onChange={handle('email')} />
          <Field label="Email pessoal" id="personalEmail" type="email" value={form.personalEmail} onChange={handle('personalEmail')} />
          <Field label="Telefone" id="phone" type="tel" value={form.phone} onChange={handle('phone')} />
          <Field label="Telefone alternativo" id="alternatePhone" type="tel" value={form.alternatePhone} onChange={handle('alternatePhone')} />
          <Field label="Endereço" id="address" value={form.address} onChange={handle('address')} />
          <Field label="Contacto de emergência (nome)" id="emergencyContactName" value={form.emergencyContactName} onChange={handle('emergencyContactName')} />
          <Field label="Contacto de emergência (telefone)" id="emergencyContactPhone" type="tel" value={form.emergencyContactPhone} onChange={handle('emergencyContactPhone')} />

          <SectionTitle>Conta de acesso</SectionTitle>
          <Field label="Password provisória" id="password" type="password" value={form.password} onChange={handle('password')} />
          <Field label="Username" id="username" value={form.username} onChange={handle('username')} />
          <FormField label="Perfil de acesso" htmlFor="roleId">
            <Combobox
              items={roleOptions}
              value={form.roleId || undefined}
              onValueChange={(v) => setField('roleId', v)}
              placeholder={rolesLoading ? 'A carregar…' : 'Selecionar perfil'}
              disabled={rolesLoading}
            />
          </FormField>
          <Field label="Função no sistema" id="systemFunction" value={form.systemFunction} onChange={handle('systemFunction')} />
          <EnumSelect id="accountStatus" label="Estado da conta" value={form.accountStatus} onChange={(v) => setField('accountStatus', v)} options={ACCOUNT_STATUS_OPTIONS} />
          <EnumSelect id="language" label="Idioma" value={form.language} onChange={(v) => setField('language', v)} options={LANGUAGE_OPTIONS} />
          <Field label="Fuso horário" id="timezone" value={form.timezone} onChange={handle('timezone')} />
          <label className="flex items-center gap-2 pb-2.5 text-sm text-ink-muted">
            <input
              type="checkbox"
              checked={form.mfaEnabled}
              onChange={(e) => setField('mfaEnabled', e.target.checked)}
              className="h-4 w-4 rounded border-border-strong accent-primary"
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

          <SectionTitle>Academia</SectionTitle>
          <Field label="Perfil de aprendizagem" id="learningProfile" value={form.learningProfile} onChange={handle('learningProfile')} />
          <Field label="Nível de acesso aos conteúdos" id="contentAccessLevel" value={form.contentAccessLevel} onChange={handle('contentAccessLevel')} />
          <label className="col-span-2 flex items-center gap-2 pb-1 text-sm text-ink-muted">
            <input
              type="checkbox"
              checked={form.isInstructor}
              onChange={(e) => setField('isInstructor', e.target.checked)}
              className="h-4 w-4 rounded border-border-strong accent-primary"
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

          <SectionTitle>RH</SectionTitle>
          <Field label="Centro de custo" id="costCenter" value={form.costCenter} onChange={handle('costCenter')} />
          <Field label="Data de fim" id="exitDate" type="date" value={form.exitDate} onChange={handle('exitDate')} />
          <Field label="Horário" id="workSchedule" value={form.workSchedule} onChange={handle('workSchedule')} />
        </div>

        <div className="flex gap-3">
          <Button onClick={handleSubmit} disabled={saving} loading={saving}>
            {saving ? 'A criar…' : 'Criar utilizador'}
          </Button>
          <Button intent="secondary" onClick={onBack}>
            Cancelar
          </Button>
        </div>
      </Card>
    </div>
  );
}
