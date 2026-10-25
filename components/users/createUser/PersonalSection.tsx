// components/users/createUser/PersonalSection.tsx
// Secção «Dados pessoais» do formulário Novo Utilizador (apresentação).

import { COUNTRY_OPTIONS } from '../createUserOptions';
import { GENDER_OPTIONS } from './constants';
import { EnumSelect, Field, ListField, SectionTitle } from './fields';
import { PhotoField } from './PhotoField';
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
      <Field
        label="Número de identificação"
        id="identificationNumber"
        value={form.identificationNumber}
        onChange={handle('identificationNumber')}
      />
      <Field label="NIF" id="nif" value={form.nif} onChange={handle('nif')} />
    </>
  );
}
