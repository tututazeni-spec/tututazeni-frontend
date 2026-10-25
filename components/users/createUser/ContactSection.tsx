// components/users/createUser/ContactSection.tsx
// Secção «Dados de contacto» do formulário Novo Utilizador (apresentação).

import { AlertCard } from '@/components/ui/AlertCard';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Field, SectionTitle } from './fields';
import { takenEmailMessage } from './logic';
import type { CreateUserFormController } from '@/hooks/useCreateUserForm';

export function ContactSection({ ctl }: { ctl: CreateUserFormController }) {
  const {
    form,
    handle,
    changeEmail,
    emailHint,
    emailError,
    emailTaken,
    emailAlternatives,
  } = ctl;

  return (
    <>
      <SectionTitle>Dados de contacto</SectionTitle>
      <div>
        <FormField
          label="Email profissional *"
          htmlFor="email"
          hint={emailHint}
          error={emailError}
        >
          <Input
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => changeEmail(e.target.value)}
            className="w-full"
          />
        </FormField>
      </div>
      <Field
        label="Email pessoal"
        id="personalEmail"
        type="email"
        value={form.personalEmail}
        onChange={handle('personalEmail')}
      />
      {emailTaken && (
        <div className="col-span-2 space-y-2">
          <AlertCard
            variant="warning"
            title="Este email já está em uso"
            message={takenEmailMessage(emailAlternatives)}
          />
          {emailAlternatives.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {emailAlternatives.map((alt) => (
                <Button
                  key={alt}
                  type="button"
                  intent="secondary"
                  size="sm"
                  onClick={() => changeEmail(alt)}
                >
                  {alt}
                </Button>
              ))}
            </div>
          )}
        </div>
      )}
      <Field
        label="Telefone"
        id="phone"
        type="tel"
        value={form.phone}
        onChange={handle('phone')}
      />
      <Field
        label="Telefone alternativo"
        id="alternatePhone"
        type="tel"
        value={form.alternatePhone}
        onChange={handle('alternatePhone')}
      />
      <Field
        label="Endereço"
        id="address"
        value={form.address}
        onChange={handle('address')}
      />
      <Field
        label="Contacto de emergência (nome)"
        id="emergencyContactName"
        value={form.emergencyContactName}
        onChange={handle('emergencyContactName')}
      />
      <Field
        label="Contacto de emergência (telefone)"
        id="emergencyContactPhone"
        type="tel"
        value={form.emergencyContactPhone}
        onChange={handle('emergencyContactPhone')}
      />
    </>
  );
}
