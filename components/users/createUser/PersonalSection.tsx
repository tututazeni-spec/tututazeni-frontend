// components/users/createUser/PersonalSection.tsx
// Secção «Dados pessoais» do formulário Novo Utilizador (apresentação).

import { BANK_OPTIONS, COUNTRY_OPTIONS } from '../createUserOptions';
import { GENDER_OPTIONS, IDENTIFICATION_TYPE_OPTIONS } from './constants';
import { EnumSelect, Field, ListField, SectionTitle } from './fields';
import { PhotoField } from './PhotoField';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import type { CreateUserFormController } from '@/hooks/useCreateUserForm';

export function PersonalSection({ ctl }: { ctl: CreateUserFormController }) {
  const {
    form,
    setField,
    handle,
    photoInputRef,
    photoProcessing,
    onPhotoChange,
    openPhotoPicker,
    clearPhoto,
  } = ctl;

  return (
    <>
      <SectionTitle>Dados pessoais</SectionTitle>
      <Field
        label="Nome completo"
        id="fullName"
        required
        value={form.fullName}
        onChange={handle('fullName')}
      />
      <Field
        label="Nome preferencial"
        id="preferredName"
        value={form.preferredName}
        onChange={handle('preferredName')}
      />
      <PhotoField
        avatarUrl={form.avatarUrl}
        fullName={form.fullName}
        processing={photoProcessing}
        inputRef={photoInputRef}
        onFileChange={onPhotoChange}
        onOpenPicker={openPhotoPicker}
        onUrlChange={handle('avatarUrl')}
        onClear={clearPhoto}
      />
      <EnumSelect
        id="gender"
        label="Género"
        value={form.gender}
        onChange={(v) => setField('gender', v)}
        options={GENDER_OPTIONS}
      />
      <Field
        label="Data de nascimento"
        id="birthDate"
        type="date"
        value={form.birthDate}
        onChange={handle('birthDate')}
      />
      <ListField
        id="nationality"
        label="Nacionalidade"
        value={form.nationality}
        onChange={(v) => setField('nationality', v)}
        options={COUNTRY_OPTIONS}
      />
      <ListField
        id="country"
        label="País de residência"
        value={form.country}
        onChange={(v) => setField('country', v)}
        options={COUNTRY_OPTIONS}
      />
      <EnumSelect
        id="identificationType"
        label="Tipo de documento"
        value={form.identificationType}
        onChange={(v) => setField('identificationType', v)}
        options={IDENTIFICATION_TYPE_OPTIONS}
      />
      <Field
        label="Número de identificação"
        id="identificationNumber"
        value={form.identificationNumber}
        onChange={handle('identificationNumber')}
      />
      <Field label="NIF" id="nif" value={form.nif} onChange={handle('nif')} />
      <ListField
        id="salaryBankName"
        label="Banco que recebe o salário"
        value={form.salaryBankName}
        onChange={(v) => setField('salaryBankName', v)}
        options={BANK_OPTIONS}
        custom
      />
      <FormField
        label="IBAN"
        htmlFor="iban"
        hint="Só os 23 dígitos; o AO já está preenchido"
      >
        <div className="relative">
          <span
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-body text-sm font-semibold text-ink"
          >
            AO
          </span>
          <Input
            id="iban"
            inputMode="numeric"
            maxLength={23}
            placeholder="23 dígitos"
            className="w-full pl-10"
            value={form.iban.replace(/^AO/i, '')}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '').slice(0, 23);
              setField('iban', digits ? `AO${digits}` : '');
            }}
          />
        </div>
      </FormField>
    </>
  );
}
