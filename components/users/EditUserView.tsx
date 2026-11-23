// components/users/EditUserView.tsx
// Edição de um utilizador já criado (ADMIN e RH), aberta a partir do perfil.
// Reutiliza o formulário de criação: vem pré-preenchido e grava só o que
// mudou (PUT /users/:id). Ver hooks/useCreateUserForm.ts.

'use client';

import { useCreateUserForm } from '@/hooks/useCreateUserForm';
import { CreateUserFormView } from './createUser/CreateUserFormView';
import type { User } from './types';

interface EditUserViewProps {
  user: User;
  onBack: () => void;
  onSaved: () => void;
}

export function EditUserView({ user, onBack, onSaved }: EditUserViewProps) {
  const ctl = useCreateUserForm(onSaved, user);
  return <CreateUserFormView ctl={ctl} onBack={onBack} />;
}
