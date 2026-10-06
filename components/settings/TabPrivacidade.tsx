// components/settings/TabPrivacidade.tsx
// Tab "Privacidade (LPDP)" (ADMIN): DPO, retenção, anonimização/exportação,
// versões do texto de consentimento e pedidos de direitos dos titulares —
// GET/PUT /settings/privacy, /settings/privacy/consent/*, /settings/privacy/requests
// (docs/modulo_settings.md §8).

'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useToast } from '@/providers/ToastProvider';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import type {
  ConsentTextVersion,
  DataSubjectRequest,
  DataSubjectRequestsPage,
  DsrStatus,
  DsrType,
  PrivacySettings,
} from './types';

const DSR_TYPE_LABELS: Record<DsrType, string> = {
  ACCESS: 'Acesso',
  RECTIFICATION: 'Rectificação',
  ERASURE: 'Eliminação',
  PORTABILITY: 'Portabilidade',
  OBJECTION: 'Oposição',
};
const DSR_TYPES = Object.entries(DSR_TYPE_LABELS).map(([value, label]) => ({ value, label }));

const DSR_STATUS_LABELS: Record<DsrStatus, string> = {
  PENDING: 'Pendente',
  IN_PROGRESS: 'Em curso',
  COMPLETED: 'Concluído',
  REJECTED: 'Rejeitado',
};
const DSR_STATUSES = Object.entries(DSR_STATUS_LABELS).map(([value, label]) => ({ value, label }));
const DSR_STATUS_INTENT: Record<DsrStatus, 'warning' | 'info' | 'success' | 'danger'> = {
  PENDING: 'warning',
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
  REJECTED: 'danger',
};
const STATUS_FILTER_ALL = 'ALL';

function Toggle({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex items-center gap-2 text-sm text-ink">
      <input id={id} type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

export function TabPrivacidade() {
  const toast = useToast();

  const { data, isLoading, error } = useApiQuery<PrivacySettings>(
    queryKeys.settings.privacy(),
    '/settings/privacy',
  );
  const [form, setForm] = useState<Omit<PrivacySettings, 'consentVersions' | 'currentConsentVersion' | 'openRequests'> | null>(null);
  useEffect(() => {
    if (data) {
      const { consentVersions: _cv, currentConsentVersion: _ccv, openRequests: _or, ...rest } = data;
      setForm(rest);
    }
  }, [data]);

  const save = useApiMutation(
    (payload: typeof form) => apiClient.put('/settings/privacy', payload),
    {
      invalidateKeys: [queryKeys.settings.privacy()],
      onSuccess: () => toast({ title: 'Definições de privacidade guardadas', intent: 'success' }),
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  const [historyOpen, setHistoryOpen] = useState(false);
  const versions = useApiQuery<ConsentTextVersion[]>(
    queryKeys.settings.consentVersions(),
    '/settings/privacy/consent/versions',
    { enabled: historyOpen },
  );

  const [publishText, setPublishText] = useState('');
  const [publishOpen, setPublishOpen] = useState(false);
  const publish = useApiMutation(
    (text: string) => apiClient.post('/settings/privacy/consent/publish', { text }),
    {
      invalidateKeys: [queryKeys.settings.privacy(), queryKeys.settings.consentVersions()],
      onSuccess: () => {
        toast({ title: 'Nova versão do consentimento publicada', intent: 'success' });
        setPublishOpen(false);
        setPublishText('');
      },
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  const [statusFilter, setStatusFilter] = useState(STATUS_FILTER_ALL);
  const [page, setPage] = useState(1);
  const requests = useApiQuery<DataSubjectRequestsPage>(
    queryKeys.settings.dsrRequests(statusFilter, page),
    '/settings/privacy/requests',
    { params: { status: statusFilter === STATUS_FILTER_ALL ? undefined : statusFilter, page } },
  );

  const [newRequestOpen, setNewRequestOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({
    requesterName: '',
    requesterEmail: '',
    type: 'ACCESS' as DsrType,
    details: '',
  });
  const createRequest = useApiMutation(
    (payload: Record<string, unknown>) => apiClient.post('/settings/privacy/requests', payload),
    {
      invalidateKeys: [queryKeys.settings.privacy()],
      onSuccess: () => {
        requests.refetch();
        toast({ title: 'Pedido registado', intent: 'success' });
        setNewRequestOpen(false);
        setNewRequest({ requesterName: '', requesterEmail: '', type: 'ACCESS', details: '' });
      },
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  const [editingRequest, setEditingRequest] = useState<DataSubjectRequest | null>(null);
  const [editStatus, setEditStatus] = useState<DsrStatus>('PENDING');
  const [resolutionNote, setResolutionNote] = useState('');
  const updateRequest = useApiMutation(
    ({ id, payload }: { id: number; payload: Record<string, unknown> }) =>
      apiClient.put(`/settings/privacy/requests/${id}`, payload),
    {
      invalidateKeys: [queryKeys.settings.privacy()],
      onSuccess: () => {
        requests.refetch();
        toast({ title: 'Pedido actualizado', intent: 'success' });
        setEditingRequest(null);
      },
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  if (isLoading || !form)
    return <p className="py-10 text-center text-sm text-ink-faint">A carregar…</p>;
  if (error) return <p className="py-10 text-center text-sm text-danger">{error.message}</p>;

  const set = (patch: Partial<typeof form>) => setForm((f) => (f ? { ...f, ...patch } : f));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    save.mutate(form);
  }

  const current = data?.currentConsentVersion;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {[
          ['Versão de consentimento vigente', current ? `v${current.version}` : 'Nenhuma publicada'],
          ['Pedidos por resolver', data?.openRequests ?? 0],
        ].map(([label, value]) => (
          <Card key={String(label)}>
            <CardBody>
              <p className="m-0 text-xs uppercase tracking-wider text-ink-faint">{label}</p>
              <p className="mt-1 text-2xl font-bold text-ink">{value}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <form onSubmit={submit} className="grid grid-cols-2 gap-4">
        <Card>
          <CardBody>
            <h3 className="mb-4 text-base font-bold text-ink">Encarregado de protecção de dados</h3>
            <div className="space-y-4">
              <FormField label="Nome" htmlFor="dpoName">
                <Input id="dpoName" className="w-full" value={form.dpoName} onChange={(e) => set({ dpoName: e.target.value })} />
              </FormField>
              <FormField label="Email" htmlFor="dpoEmail">
                <Input id="dpoEmail" type="email" className="w-full" value={form.dpoEmail} onChange={(e) => set({ dpoEmail: e.target.value })} />
              </FormField>
              <FormField label="Telefone" htmlFor="dpoPhone">
                <Input id="dpoPhone" className="w-full" value={form.dpoPhone} onChange={(e) => set({ dpoPhone: e.target.value })} />
              </FormField>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <h3 className="mb-4 text-base font-bold text-ink">Retenção e tratamento de dados</h3>
            <div className="space-y-4">
              <FormField label="Prazo geral de retenção (dias)" htmlFor="retentionDays">
                <Input
                  id="retentionDays"
                  type="number"
                  min={30}
                  max={3650}
                  className="w-full"
                  value={form.retentionDays}
                  onChange={(e) => set({ retentionDays: Number(e.target.value) })}
                />
              </FormField>
              <Toggle id="anonymizationEnabled" label="Permitir anonimização" checked={form.anonymizationEnabled} onChange={(v) => set({ anonymizationEnabled: v })} />
              <Toggle id="exportEnabled" label="Permitir exportação de dados" checked={form.exportEnabled} onChange={(v) => set({ exportEnabled: v })} />
              <Toggle id="autoDeleteOnRequest" label="Eliminar automaticamente ao aprovar pedido de eliminação" checked={form.autoDeleteOnRequest} onChange={(v) => set({ autoDeleteOnRequest: v })} />
            </div>
          </CardBody>
        </Card>

        <div className="col-span-2 flex justify-end">
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? 'A guardar…' : 'Guardar alterações'}
          </Button>
        </div>
      </form>

      <Card>
        <CardBody>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-ink">Texto de consentimento</h3>
            <div className="flex gap-2">
              <Button
                type="button"
                intent="ghost"
                onClick={() => setHistoryOpen((o) => !o)}
              >
                {historyOpen ? 'Ocultar histórico' : 'Ver histórico'}
              </Button>
              <Button type="button" onClick={() => setPublishOpen(true)}>
                Publicar nova versão
              </Button>
            </div>
          </div>
          {current ? (
            <div className="rounded-control border border-border bg-surface-sunken p-3 text-sm text-ink whitespace-pre-wrap">
              {current.text}
            </div>
          ) : (
            <p className="py-4 text-center text-sm text-ink-faint">Nenhuma versão publicada ainda.</p>
          )}
          {historyOpen && (
            <div className="mt-4 space-y-2">
              {versions.isLoading ? (
                <p className="text-sm text-ink-faint">A carregar…</p>
              ) : !versions.data?.length ? (
                <p className="text-sm text-ink-faint">Sem histórico.</p>
              ) : (
                versions.data.map((v) => (
                  <div key={v.version} className="rounded-control border border-border p-2 text-xs">
                    <div className="mb-1 flex items-center justify-between text-ink-faint">
                      <span className="font-semibold text-ink">Versão {v.version}</span>
                      <span>{new Date(v.publishedAt).toLocaleString('pt-PT')}</span>
                    </div>
                    <p className="m-0 whitespace-pre-wrap text-ink">{v.text}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-ink">Pedidos de direitos dos titulares</h3>
            <div className="flex items-center gap-2">
              <Select
                className="w-44"
                items={[{ value: STATUS_FILTER_ALL, label: 'Todos os estados' }, ...DSR_STATUSES]}
                value={statusFilter}
                onValueChange={(v) => {
                  setStatusFilter(v);
                  setPage(1);
                }}
              />
              <Button type="button" onClick={() => setNewRequestOpen(true)}>
                Novo pedido
              </Button>
            </div>
          </div>
          {requests.isLoading ? (
            <p className="text-sm text-ink-faint">A carregar…</p>
          ) : !requests.data?.items.length ? (
            <p className="py-6 text-center text-sm text-ink-faint">Nenhum pedido registado.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-ink-faint">
                  <th className="py-2">Titular</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Registado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {requests.data.items.map((r) => (
                  <tr key={r.id} className="border-t border-border">
                    <td className="py-2">
                      <div className="font-medium text-ink">{r.requesterName}</div>
                      <div className="text-xs text-ink-faint">{r.requesterEmail}</div>
                    </td>
                    <td>{DSR_TYPE_LABELS[r.type]}</td>
                    <td>
                      <Badge intent={DSR_STATUS_INTENT[r.status]}>{DSR_STATUS_LABELS[r.status]}</Badge>
                    </td>
                    <td>{new Date(r.requestedAt).toLocaleDateString('pt-PT')}</td>
                    <td className="text-right">
                      {r.status !== 'COMPLETED' && r.status !== 'REJECTED' && (
                        <Button
                          intent="ghost"
                          onClick={() => {
                            setEditingRequest(r);
                            setEditStatus(r.status);
                            setResolutionNote(r.resolutionNote ?? '');
                          }}
                        >
                          Processar
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {requests.data && requests.data.total > requests.data.limit && (
            <div className="mt-3 flex justify-end gap-2">
              <Button intent="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Anterior
              </Button>
              <Button
                intent="ghost"
                disabled={page * requests.data.limit >= requests.data.total}
                onClick={() => setPage((p) => p + 1)}
              >
                Seguinte
              </Button>
            </div>
          )}
        </CardBody>
      </Card>

      {publishOpen && (
        <Modal open onOpenChange={(open) => !open && setPublishOpen(false)}>
          <ModalContent
            title="Publicar nova versão do consentimento"
            description="A versão anterior fica preservada no histórico."
          >
            <div className="mt-4 space-y-4">
              <FormField label="Texto *" htmlFor="consentText">
                <Textarea
                  id="consentText"
                  className="w-full"
                  rows={8}
                  value={publishText}
                  onChange={(e) => setPublishText(e.target.value)}
                />
              </FormField>
              <div className="flex justify-end gap-2">
                <Button intent="ghost" onClick={() => setPublishOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  disabled={!publishText.trim() || publish.isPending}
                  onClick={() => publish.mutate(publishText)}
                >
                  {publish.isPending ? 'A publicar…' : 'Publicar'}
                </Button>
              </div>
            </div>
          </ModalContent>
        </Modal>
      )}

      {newRequestOpen && (
        <Modal open onOpenChange={(open) => !open && setNewRequestOpen(false)}>
          <ModalContent title="Registar pedido de direitos" className="max-w-lg">
            <form
              className="mt-4 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                createRequest.mutate({
                  requesterName: newRequest.requesterName,
                  requesterEmail: newRequest.requesterEmail,
                  type: newRequest.type,
                  details: newRequest.details || undefined,
                });
              }}
            >
              <FormField label="Nome do titular *" htmlFor="dsr-name">
                <Input
                  id="dsr-name"
                  className="w-full"
                  required
                  value={newRequest.requesterName}
                  onChange={(e) => setNewRequest((r) => ({ ...r, requesterName: e.target.value }))}
                />
              </FormField>
              <FormField label="Email do titular *" htmlFor="dsr-email">
                <Input
                  id="dsr-email"
                  type="email"
                  className="w-full"
                  required
                  value={newRequest.requesterEmail}
                  onChange={(e) => setNewRequest((r) => ({ ...r, requesterEmail: e.target.value }))}
                />
              </FormField>
              <FormField label="Tipo de pedido *" htmlFor="dsr-type">
                <Select
                  className="w-full"
                  items={DSR_TYPES}
                  value={newRequest.type}
                  onValueChange={(v) => setNewRequest((r) => ({ ...r, type: v as DsrType }))}
                />
              </FormField>
              <FormField label="Detalhes" htmlFor="dsr-details">
                <Textarea
                  id="dsr-details"
                  className="w-full"
                  rows={3}
                  value={newRequest.details}
                  onChange={(e) => setNewRequest((r) => ({ ...r, details: e.target.value }))}
                />
              </FormField>
              <div className="flex justify-end gap-2">
                <Button type="button" intent="ghost" onClick={() => setNewRequestOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createRequest.isPending}>
                  {createRequest.isPending ? 'A registar…' : 'Registar pedido'}
                </Button>
              </div>
            </form>
          </ModalContent>
        </Modal>
      )}

      {editingRequest && (
        <Modal open onOpenChange={(open) => !open && setEditingRequest(null)}>
          <ModalContent title={`Processar pedido de ${editingRequest.requesterName}`} className="max-w-lg">
            <form
              className="mt-4 space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                updateRequest.mutate({
                  id: editingRequest.id,
                  payload: { status: editStatus, resolutionNote: resolutionNote || undefined },
                });
              }}
            >
              <FormField label="Estado" htmlFor="dsr-status">
                <Select
                  className="w-full"
                  items={DSR_STATUSES}
                  value={editStatus}
                  onValueChange={(v) => setEditStatus(v as DsrStatus)}
                />
              </FormField>
              <FormField label="Nota de resolução" htmlFor="dsr-note">
                <Textarea
                  id="dsr-note"
                  className="w-full"
                  rows={3}
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                />
              </FormField>
              <div className="flex justify-end gap-2">
                <Button type="button" intent="ghost" onClick={() => setEditingRequest(null)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={updateRequest.isPending}>
                  {updateRequest.isPending ? 'A guardar…' : 'Guardar'}
                </Button>
              </div>
            </form>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
}
