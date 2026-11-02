'use client';

// Separador "Instrutores externos" (ADMIN/RH): convites com link de uso único e prazo de acesso.
// O instrutor recebe o link por email, define a senha e a conta desativa-se sozinha no fim do prazo.

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { ApiError } from '@/lib/apiClient';
import { useConfirm } from '@/providers/ConfirmProvider';
import {
  useInstructorInvites,
  type InstructorInvite,
  type InviteStatus,
} from '@/hooks/useInstructorInvites';
import { AlertCard } from '@/components/ui/AlertCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataTable, type DataTableColumn } from '@/components/ui/DataTable';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalClose, ModalContent } from '@/components/ui/Modal';
import { PeriodPills } from '@/components/ui/Pills';

type Filter = 'ALL' | InviteStatus;

const FILTERS = [
  { value: 'ALL', label: 'Todos' },
  { value: 'PENDING', label: 'Pendentes' },
  { value: 'ACCEPTED', label: 'Aceites' },
  { value: 'EXPIRED', label: 'Link expirado' },
  { value: 'REVOKED', label: 'Revogados' },
] as const;

const STATUS_LABEL: Record<
  InviteStatus,
  { label: string; intent: 'success' | 'warning' | 'danger' | 'neutral' }
> = {
  PENDING: { label: 'Pendente', intent: 'warning' },
  ACCEPTED: { label: 'Aceite', intent: 'success' },
  EXPIRED: { label: 'Link expirado', intent: 'neutral' },
  REVOKED: { label: 'Revogado', intent: 'danger' },
};

const fmt = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('pt-PT') : '—';

const accessEnded = (row: InstructorInvite) =>
  row.accessExpiresAt !== null && new Date(row.accessExpiresAt) < new Date();

export function InstructorInvitesView() {
  const confirm = useConfirm();
  const { list, create, resend, revoke, extend, deactivate } =
    useInstructorInvites();
  const [filter, setFilter] = useState<Filter>('ALL');
  const [open, setOpen] = useState(false);

  const rows = (list.data ?? []).filter(
    (r) => filter === 'ALL' || r.status === filter,
  );

  async function ask(
    title: string,
    message: string,
    destructive: boolean,
    run: () => void,
  ) {
    if (await confirm({ title, message, destructive, confirmLabel: 'Confirmar' })) {
      run();
    }
  }

  const columns: DataTableColumn<InstructorInvite>[] = [
    { key: 'fullName', header: 'Instrutor', sortable: true },
    { key: 'email', header: 'Email', sortable: true },
    {
      key: 'status',
      header: 'Estado',
      render: (r) => {
        const s = STATUS_LABEL[r.status];
        return (
          <span className="flex flex-wrap items-center gap-1">
            <Badge intent={s.intent}>{s.label}</Badge>
            {r.status === 'ACCEPTED' && accessEnded(r) && (
              <Badge intent="danger">Acesso terminado</Badge>
            )}
          </span>
        );
      },
    },
    {
      key: 'expiresAt',
      header: 'Link válido até',
      accessor: (r) => r.expiresAt,
      sortable: true,
      render: (r) => fmt(r.expiresAt),
    },
    {
      key: 'accessExpiresAt',
      header: 'Acesso até',
      accessor: (r) => r.accessExpiresAt,
      sortable: true,
      render: (r) => fmt(r.accessExpiresAt),
    },
    {
      key: 'actions',
      header: 'Ações',
      render: (r) => (
        <span className="flex flex-wrap gap-1">
          {r.status !== 'ACCEPTED' && (
            <Button
              size="sm"
              intent="ghost"
              onClick={() => resend.mutate(r.id)}
            >
              Reenviar
            </Button>
          )}
          {r.status === 'PENDING' && (
            <Button
              size="sm"
              intent="ghostDanger"
              onClick={() =>
                ask(
                  'Revogar convite',
                  `O link enviado a ${r.email} deixa de funcionar.`,
                  true,
                  () => revoke.mutate(r.id),
                )
              }
            >
              Revogar
            </Button>
          )}
          {r.status === 'ACCEPTED' && (
            <>
              <Button
                size="sm"
                intent="ghost"
                onClick={() =>
                  extend.mutate({ userId: r.userId, accessDays: 30 })
                }
              >
                Prolongar 30 dias
              </Button>
              {!accessEnded(r) && (
                <Button
                  size="sm"
                  intent="ghostDanger"
                  onClick={() =>
                    ask(
                      'Desativar acesso',
                      `${r.fullName} deixa de poder entrar e as sessões abertas terminam. O que criou mantém-se.`,
                      true,
                      () => deactivate.mutate(r.userId),
                    )
                  }
                >
                  Desativar
                </Button>
              )}
            </>
          )}
        </span>
      ),
    },
  ];

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PeriodPills
          options={FILTERS}
          value={filter}
          onChange={setFilter}
          label="Estado do convite"
        />
        <Button onClick={() => setOpen(true)}>
          <Plus size={16} strokeWidth={1.75} />
          Novo convite
        </Button>
      </div>

      {list.isError && (
        <AlertCard
          variant="danger"
          title="Não foi possível carregar os convites"
          message="Atualize a página ou tente novamente dentro de instantes."
        />
      )}

      <DataTable
        columns={columns}
        data={rows}
        rowKey={(r) => r.id}
        searchKeys={['fullName', 'email']}
        searchPlaceholder="Pesquisar instrutor ou email"
        emptyLabel="Ainda não há convites de instrutores externos."
      />

      <NewInviteModal
        open={open}
        onClose={() => setOpen(false)}
        pending={create.isPending}
        onSubmit={(v) => create.mutateAsync(v)}
      />
    </section>
  );
}

function NewInviteModal({
  open,
  onClose,
  pending,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  pending: boolean;
  onSubmit: (v: {
    email: string;
    fullName: string;
    accessDays: number;
  }) => Promise<unknown>;
}) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [days, setDays] = useState('30');
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const accessDays = Number(days);
    if (!Number.isInteger(accessDays) || accessDays < 1 || accessDays > 365) {
      setError('Os dias de acesso devem ser entre 1 e 365.');
      return;
    }
    try {
      await onSubmit({ fullName: fullName.trim(), email: email.trim(), accessDays });
      setFullName('');
      setEmail('');
      setDays('30');
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError && err.status === 409
          ? 'Já existe uma conta com este email.'
          : 'Não foi possível enviar o convite. Verifique os dados e tente novamente.',
      );
    }
  }

  return (
    <Modal open={open} onOpenChange={(o) => !o && onClose()}>
      <ModalContent
        title="Novo convite de instrutor"
        description="O instrutor recebe um link de uso único, válido por 72 horas, para definir a sua senha."
      >
        <form onSubmit={submit} className="mt-4 space-y-4">
          <FormField label="Nome completo" htmlFor="inv-name">
            <Input
              id="inv-name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              minLength={2}
              required
            />
          </FormField>
          <FormField label="Email" htmlFor="inv-email">
            <Input
              id="inv-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </FormField>
          <FormField
            label="Dias de acesso"
            htmlFor="inv-days"
            hint="Contam desde hoje. Ao fim do prazo a conta desativa-se sozinha."
          >
            <Input
              id="inv-days"
              type="number"
              min={1}
              max={365}
              value={days}
              onChange={(e) => setDays(e.target.value)}
              required
            />
          </FormField>
          {error && (
            <AlertCard
              variant="danger"
              title="Não foi possível enviar o convite"
              message={error}
            />
          )}
          <div className="flex justify-end gap-3">
            <ModalClose asChild>
              <Button type="button" intent="ghost">
                Cancelar
              </Button>
            </ModalClose>
            <Button type="submit" loading={pending}>
              Enviar convite
            </Button>
          </div>
        </form>
      </ModalContent>
    </Modal>
  );
}
