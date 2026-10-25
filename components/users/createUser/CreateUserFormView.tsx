// components/users/createUser/CreateUserFormView.tsx
// Formulário «Novo Utilizador» (apresentação): compõe as secções do doc
// docs/modulo_users.md Ponto 2. Estado e submissão: hooks/useCreateUserForm.ts.

import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import type { CreateUserFormController } from '@/hooks/useCreateUserForm';
import { AccessSection, AcademySection, HrSection } from './AccountSections';
import { ContactSection } from './ContactSection';
import { PersonalSection } from './PersonalSection';
import { ProfessionalSection } from './ProfessionalSection';

interface CreateUserFormViewProps {
  ctl: CreateUserFormController;
  onBack: () => void;
}

export function CreateUserFormView({ ctl, onBack }: CreateUserFormViewProps) {
  const { error, submit, saving } = ctl;

  return (
    <div>
      <Button intent="ghost" size="sm" className="mb-5" onClick={onBack}>
        <ArrowLeft size={14} strokeWidth={1.75} />
        Cancelar
      </Button>
      <Card className="p-6">
        <div className="text-base font-semibold text-ink mb-5">
          Novo utilizador
        </div>

        {error && (
          <div className="bg-danger-subtle border border-danger/30 text-danger-ink rounded-control p-3 text-sm mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-5 mb-6">
          <PersonalSection ctl={ctl} />
          <ProfessionalSection ctl={ctl} />
          <ContactSection ctl={ctl} />
          <AccessSection ctl={ctl} />
          <AcademySection ctl={ctl} />
          <HrSection ctl={ctl} />
        </div>

        <div className="flex gap-3">
          <Button onClick={submit} disabled={saving} loading={saving}>
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
