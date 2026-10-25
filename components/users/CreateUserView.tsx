// components/users/CreateUserView.tsx
// Vista "Novo Utilizador" (docs/modulo_users.md Ponto 2): formulário de
// criação de utilizador, organizado nas mesmas secções do doc — Dados
// pessoais, Dados profissionais, Dados de contacto, Conta de acesso,
// Academia, RH e Estado do utilizador. Os pickers de organização/acesso/
// academia vêm de ./createUserData (hooks módulo-local, mesmo padrão de
// components/onboarding/planData.ts).
//
// Container: liga o hook (hooks/useCreateUserForm.ts) à vista de apresentação
// em ./createUser/. Regras puras (payload, email do tenant, fotografia) em
// ./createUser/logic.ts.

'use client';

import { useCreateUserForm } from '@/hooks/useCreateUserForm';
import { CreateUserFormView } from './createUser/CreateUserFormView';

interface CreateUserViewProps {
  onBack: () => void;
  onCreated: () => void;
}

export function CreateUserView({ onBack, onCreated }: CreateUserViewProps) {
  const ctl = useCreateUserForm(onCreated);
  return <CreateUserFormView ctl={ctl} onBack={onBack} />;
}
