// components/onboarding/AssignPlanModal.tsx
// Modal "+ Atribuir plano" do separador "Planos". Inicia um processo de
// integração para um colaborador. Só ADMIN/RH — espelha @Roles(ADMIN, RH)
// em onboarding.controller.ts (POST /onboarding e
// POST /onboarding/auto-assign/:userId).
//
// Segue o padrão de components/enrollments/EnrollUserModal: a page só monta
// o componente quando está aberto (Modal sempre `open`, onOpenChange delega
// em onClose). Picker de colaborador por pesquisa livre em GET
// /users/directory; template por Combobox (useTemplateOptions).
//
// Modo "automático" (toggle): em vez de escolher o template, chama
// POST /onboarding/auto-assign/:userId e o backend escolhe o template
// activo mais adequado ao cargo/departamento do colaborador.
//
// 409 = o colaborador já tem um plano NOT_STARTED/IN_PROGRESS activo.

'use client';

import { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { useApiMutation } from '@/hooks/useApiQuery';
import { ApiError, apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useToast } from '@/providers/ToastProvider';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Combobox } from '@/components/ui/Combobox';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { cn } from '@/lib/cn';
import {
  useDirectoryUsers,
  useTemplateOptions,
  type DirectoryUser,
} from './planData';

export interface AssignPlanModalProps {
  onClose: () => void;
}

export function AssignPlanModal({ onClose }: AssignPlanModalProps) {
  const notify = useToast();
  const [userSearch, setUserSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<DirectoryUser | null>(null);
  const [templateId, setTemplateId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [auto, setAuto] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const { options: templateOptions } = useTemplateOptions();
  const { users, loading: usersLoading } = useDirectoryUsers(
    userSearch,
    !selectedUser && userSearch.trim().length > 0,
  );

  const assign = useApiMutation(
    () => {
      const userId = selectedUser!.id;
      if (auto) {
        return apiClient.post(`/onboarding/auto-assign/${userId}`, {});
      }
      return apiClient.post('/onboarding', {
        userId,
        templateId: Number(templateId),
        ...(startDate ? { startDate } : {}),
      });
    },
    {
      invalidateKeys: [queryKeys.onboarding.all],
      onSuccess: () => {
        notify({ title: 'Plano de integração atribuído', intent: 'success' });
        onClose();
      },
      onError: (e) => {
        if (e instanceof ApiError && e.status === 409) {
          setSubmitError(
            'Este colaborador já tem um plano de integração activo.',
          );
        } else if (e instanceof ApiError && e.status === 404 && auto) {
          setSubmitError(
            'Não há nenhum template activo adequado ao cargo/departamento deste colaborador.',
          );
        } else {
          setSubmitError(
            e.message || 'Erro ao atribuir o plano. Tente novamente.',
          );
        }
      },
    },
  );
  const loading = assign.isPending;

  const canSubmit =
    Boolean(selectedUser) && (auto || Boolean(templateId)) && !loading;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setSubmitError('');
    assign.mutate(undefined);
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title="Atribuir plano de integração"
        description="Inicia o onboarding de um colaborador. Ele passa a ver o plano em “O Meu Plano de Integração”."
        className="max-w-lg max-h-[90vh] overflow-y-auto"
      >
        <div className="mt-5 space-y-4">
          {submitError && (
            <div className="flex items-center gap-2 rounded-card bg-danger-subtle p-3 text-sm text-danger-ink">
              <AlertCircle size={16} strokeWidth={1.75} />
              {submitError}
            </div>
          )}

          <FormField label="Colaborador *" htmlFor="ap-user">
            {selectedUser ? (
              <div className="flex items-center gap-2 rounded-control border-[1.5px] border-border-strong bg-surface px-2 py-1.5">
                <Avatar
                  name={selectedUser.fullName}
                  url={selectedUser.avatarUrl ?? undefined}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-ink">
                    {selectedUser.fullName}
                  </div>
                  {selectedUser.email && (
                    <div className="truncate text-xs text-ink-faint">
                      {selectedUser.email}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  aria-label="Remover colaborador"
                  onClick={() => setSelectedUser(null)}
                  className="rounded-control p-1 text-ink-muted hover:bg-surface-sunken hover:text-ink"
                >
                  <X size={16} strokeWidth={1.75} />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  id="ap-user"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="w-full"
                  placeholder="Pesquisar por nome ou email…"
                  autoComplete="off"
                />
                {userSearch.trim().length > 0 && (
                  <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-card border border-border bg-surface shadow-elevated">
                    {usersLoading && (
                      <div className="px-3 py-2 text-sm text-ink-muted">
                        A pesquisar…
                      </div>
                    )}
                    {!usersLoading && users.length === 0 && (
                      <div className="px-3 py-2 text-sm text-ink-muted">
                        Nenhum colaborador encontrado
                      </div>
                    )}
                    {users.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => {
                          setSelectedUser(u);
                          setUserSearch('');
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-primary-subtle"
                      >
                        <Avatar
                          name={u.fullName}
                          url={u.avatarUrl ?? undefined}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <div className="truncate text-sm text-ink">
                            {u.fullName}
                          </div>
                          <div className="truncate text-xs text-ink-faint">
                            {u.department?.name ?? u.email ?? '—'}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </FormField>

          <button
            type="button"
            aria-pressed={auto}
            onClick={() => setAuto((v) => !v)}
            className={cn(
              'rounded-control border px-3 py-1.5 font-body text-xs transition-colors',
              auto
                ? 'border-primary bg-primary-subtle text-primary'
                : 'border-border-strong bg-surface text-ink-muted',
            )}
          >
            Escolher template automaticamente pelo cargo/departamento
          </button>

          {!auto && (
            <FormField label="Template *" htmlFor="ap-template">
              <Combobox
                items={templateOptions}
                value={templateId || undefined}
                onValueChange={setTemplateId}
                placeholder="Selecionar template"
                searchPlaceholder="Escreva para filtrar templates…"
                emptyText="Nenhum template activo encontrado"
              />
            </FormField>
          )}

          <FormField label="Data de início (opcional)" htmlFor="ap-start">
            <Input
              id="ap-start"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full"
            />
          </FormField>
        </div>

        <div className="mt-6 flex gap-3 border-t border-border pt-4">
          <Button
            intent="secondary"
            className="flex-1 justify-center"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            className="flex-1 justify-center"
            onClick={handleSubmit}
            disabled={!canSubmit}
            loading={loading}
          >
            {loading ? 'A atribuir…' : 'Atribuir plano'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}
