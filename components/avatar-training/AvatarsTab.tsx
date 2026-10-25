// components/avatar-training/AvatarsTab.tsx
// Gestão de avatares (docs/Avatar_Training.md §6). Um avatar só pode ser
// activado depois de testado (regra do backend). Criar/editar/testar/activar/
// desactivar é ADMIN/RH; os restantes perfis só vêem os avatares activos.

'use client';

import { useRef, useState } from 'react';
import {
  Bot,
  History,
  ImageIcon,
  Pencil,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useHasRole } from '@/hooks/useCurrentRole';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate } from '@/lib/format';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { QueryError } from '@/components/ui/QueryError';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Textarea } from '@/components/ui/Textarea';
import {
  ADMIN_ROLES,
  AUDIT_ACTION_LABEL,
  AVATAR_STATUS,
  AVATAR_TYPE_LABEL,
  LANGUAGE_ITEMS,
  PROVIDER_OPTIONS,
  SOURCE_LABEL,
  SPECIALTY_OPTIONS,
  TONE_OPTIONS,
} from './constants';
import {
  IMAGE_ACCEPT,
  imageFileToDataUrl,
  validateImageFile,
} from './imageFile';
import { AvatarCard } from './AvatarCard';
import { ChoiceOrCustom } from './ChoiceOrCustom';
import { NO_USER, useUserOptions } from './useUserOptions';
import type {
  AvatarHistoryEntry,
  AvatarKnowledgeItem,
  AvatarStatus,
  AvatarType,
  SourceType,
  TrainingAvatar,
} from './types';

const TYPE_ITEMS = (Object.keys(AVATAR_TYPE_LABEL) as AvatarType[]).map(
  (t) => ({
    value: t,
    label: AVATAR_TYPE_LABEL[t],
  }),
);

// Imagem do avatar: ligação (URL) ou ficheiro até 5 MB (guardado inline).
function ImageField({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const notify = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [reading, setReading] = useState(false);
  const inline = value.startsWith('data:');

  async function pick(file: File | undefined) {
    if (!file) return;
    const problem = validateImageFile(file);
    if (problem) {
      notify({
        title: 'Imagem não aceite',
        description: problem,
        intent: 'danger',
      });
      return;
    }
    setReading(true);
    try {
      onChange(await imageFileToDataUrl(file));
    } catch {
      notify({ title: 'Não foi possível ler a imagem', intent: 'danger' });
    } finally {
      setReading(false);
    }
  }

  return (
    <FormField
      label="Imagem"
      htmlFor="av-img"
      hint="Indique uma ligação (URL) ou carregue um ficheiro PNG, JPEG, WebP ou GIF até 5 MB."
    >
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface-sunken text-ink-faint">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt="Pré-visualização do avatar"
              className="h-full w-full object-cover"
            />
          ) : (
            <ImageIcon size={22} strokeWidth={1.5} />
          )}
        </div>
        <div className="min-w-[200px] flex-1">
          {inline ? (
            <p className="font-body text-sm text-ink-muted">
              Ficheiro carregado
            </p>
          ) : (
            <Input
              id="av-img"
              value={value}
              placeholder="https://…"
              onChange={(e) => onChange(e.target.value)}
            />
          )}
        </div>
        <input
          ref={input}
          type="file"
          accept={IMAGE_ACCEPT}
          className="sr-only"
          aria-label="Carregar imagem do avatar"
          onChange={(e) => {
            void pick(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        <Button
          type="button"
          size="sm"
          intent="secondary"
          loading={reading}
          onClick={() => input.current?.click()}
        >
          <Upload size={14} />{' '}
          {inline ? 'Substituir ficheiro' : 'Carregar ficheiro'}
        </Button>
        {value && (
          <Button
            type="button"
            size="sm"
            intent="ghost"
            onClick={() => onChange('')}
          >
            Remover
          </Button>
        )}
      </div>
    </FormField>
  );
}

interface AvatarFormModalProps {
  /** Presente = edição; ausente = criação. */
  avatar?: TrainingAvatar;
  onClose: () => void;
  onSaved: () => void;
}

function AvatarFormModal({ avatar, onClose, onSaved }: AvatarFormModalProps) {
  const notify = useToast();
  const users = useUserOptions();
  const [name, setName] = useState(avatar?.name ?? '');
  const [description, setDescription] = useState(avatar?.description ?? '');
  const [avatarType, setAvatarType] = useState<string>(
    avatar?.avatarType ?? 'IMAGE',
  );
  const [imageUrl, setImageUrl] = useState(avatar?.imageUrl ?? '');
  const [voiceId, setVoiceId] = useState(avatar?.voiceConfig?.voiceId ?? '');
  const [language, setLanguage] = useState(avatar?.language ?? 'pt');
  const [variant, setVariant] = useState(avatar?.languageVariant ?? '');
  const [tone, setTone] = useState(avatar?.tone ?? '');
  const [specialty, setSpecialty] = useState(avatar?.specialty ?? '');
  const [provider, setProvider] = useState(avatar?.provider ?? '');
  const [providerModel, setProviderModel] = useState(
    avatar?.providerModel ?? '',
  );
  const [responsible, setResponsible] = useState(
    avatar?.responsibleId ? String(avatar.responsibleId) : NO_USER,
  );
  const [knowledge, setKnowledge] = useState<AvatarKnowledgeItem[]>(
    avatar?.knowledgeBase ?? [],
  );
  const [srcType, setSrcType] = useState<SourceType>('DOCUMENT');
  const [srcId, setSrcId] = useState('');

  const save = useApiMutation(
    () => {
      const body = {
        name: name.trim(),
        description: description.trim() || undefined,
        avatarType,
        imageUrl: imageUrl.trim() || undefined,
        voiceConfig: voiceId.trim() ? { voiceId: voiceId.trim() } : undefined,
        language,
        languageVariant: variant.trim() || undefined,
        tone: tone.trim() || undefined,
        specialty: specialty.trim() || undefined,
        provider: provider.trim() || undefined,
        providerModel: providerModel.trim() || undefined,
        responsibleId:
          responsible === NO_USER ? undefined : Number(responsible),
        knowledgeBase: knowledge.map((k) => ({
          sourceType: k.sourceType,
          sourceId: k.sourceId,
        })),
      };
      return avatar
        ? apiClient.patch(`/avatar-training/avatars/${avatar.id}`, body)
        : apiClient.post('/avatar-training/avatars', body);
    },
    {
      onSuccess: () => {
        notify({
          title: avatar ? 'Avatar actualizado' : 'Avatar criado (em teste)',
          intent: 'success',
        });
        onSaved();
        onClose();
      },
      onError: (e) =>
        notify({
          title: 'Não foi possível guardar o avatar',
          description: e.message,
          intent: 'danger',
        }),
    },
  );

  const addSource = () => {
    const id = srcId.trim();
    if (
      !id ||
      knowledge.some((k) => k.sourceType === srcType && k.sourceId === id)
    )
      return;
    setKnowledge([...knowledge, { sourceType: srcType, sourceId: id }]);
    setSrcId('');
  };

  return (
    <Modal open onOpenChange={(o) => !o && onClose()}>
      <ModalContent
        title={avatar ? 'Editar avatar' : 'Novo avatar'}
        description={
          avatar
            ? 'Alterar a voz ou o fornecedor obriga a testar o avatar de novo.'
            : 'Fica em teste até ser testado e activado.'
        }
      >
        <div className="mt-4 max-h-[70vh] space-y-3 overflow-y-auto pr-1">
          <FormField label="Nome" htmlFor="av-name">
            <Input
              id="av-name"
              value={name}
              maxLength={120}
              onChange={(e) => setName(e.target.value)}
            />
          </FormField>
          <FormField label="Descrição / finalidade" htmlFor="av-desc">
            <Textarea
              id="av-desc"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </FormField>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <FormField label="Tipo" htmlFor="av-type">
              <Select
                value={avatarType}
                onValueChange={setAvatarType}
                items={TYPE_ITEMS}
              />
            </FormField>
            <div className="sm:col-span-2">
              <ImageField value={imageUrl} onChange={setImageUrl} />
            </div>
            <FormField label="Idioma" htmlFor="av-lang">
              <Select
                value={language}
                onValueChange={setLanguage}
                items={LANGUAGE_ITEMS}
              />
            </FormField>
            <FormField
              label="Variante"
              htmlFor="av-variant"
              hint="Ex.: PT-AO, PT-PT."
            >
              <Input
                id="av-variant"
                value={variant}
                maxLength={20}
                onChange={(e) => setVariant(e.target.value)}
              />
            </FormField>
            <FormField label="Voz (ID no fornecedor)" htmlFor="av-voice">
              <Input
                id="av-voice"
                value={voiceId}
                onChange={(e) => setVoiceId(e.target.value)}
              />
            </FormField>
            <FormField label="Tom de comunicação" htmlFor="av-tone">
              <ChoiceOrCustom
                id="av-tone"
                label="Tom de comunicação"
                value={tone}
                options={TONE_OPTIONS}
                onChange={setTone}
                placeholder="Ex.: didáctico e encorajador"
              />
            </FormField>
            <FormField label="Especialidade" htmlFor="av-spec">
              <ChoiceOrCustom
                id="av-spec"
                label="Especialidade"
                value={specialty}
                options={SPECIALTY_OPTIONS}
                onChange={setSpecialty}
              />
            </FormField>
            <FormField label="Responsável" htmlFor="av-resp">
              <Select
                value={responsible}
                onValueChange={setResponsible}
                items={users}
              />
            </FormField>
            <FormField label="Fornecedor" htmlFor="av-prov">
              <ChoiceOrCustom
                id="av-prov"
                label="Fornecedor"
                value={provider}
                options={PROVIDER_OPTIONS}
                onChange={setProvider}
              />
            </FormField>
            <FormField label="Modelo / versão" htmlFor="av-model">
              <Input
                id="av-model"
                value={providerModel}
                onChange={(e) => setProviderModel(e.target.value)}
              />
            </FormField>
          </div>

          <fieldset className="space-y-2">
            <legend className="font-body text-sm font-medium text-ink">
              Base de conhecimento (fontes autorizadas)
            </legend>
            {knowledge.length === 0 ? (
              <p className="font-body text-xs text-ink-faint">
                Sem fontes — o avatar só responde com as fontes de cada sessão.
              </p>
            ) : (
              knowledge.map((k) => (
                <div
                  key={`${k.sourceType}:${k.sourceId}`}
                  className="flex items-center justify-between gap-2 rounded-control border border-border bg-surface px-2 py-1 font-body text-sm text-ink"
                >
                  <span className="truncate">
                    {k.title ?? SOURCE_LABEL[k.sourceType]} ·{' '}
                    {SOURCE_LABEL[k.sourceType]} #{k.sourceId}
                  </span>
                  <Button
                    size="sm"
                    intent="ghost"
                    aria-label="Remover fonte"
                    onClick={() =>
                      setKnowledge(knowledge.filter((x) => x !== k))
                    }
                  >
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))
            )}
            <div className="flex flex-wrap items-end gap-2">
              <FormField label="Tipo de fonte" htmlFor="av-src-type">
                <Select
                  value={srcType}
                  onValueChange={(v) => setSrcType(v as SourceType)}
                  items={(Object.keys(SOURCE_LABEL) as SourceType[]).map(
                    (t) => ({
                      value: t,
                      label: SOURCE_LABEL[t],
                    }),
                  )}
                />
              </FormField>
              <FormField label="ID da fonte" htmlFor="av-src-id">
                <Input
                  id="av-src-id"
                  value={srcId}
                  onChange={(e) => setSrcId(e.target.value)}
                />
              </FormField>
              <Button
                size="sm"
                intent="secondary"
                disabled={!srcId.trim()}
                onClick={addSource}
              >
                Adicionar
              </Button>
            </div>
          </fieldset>
        </div>
        <div className="flex justify-end gap-2 pt-3">
          <Button intent="ghost" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button
            size="sm"
            loading={save.isPending}
            disabled={!name.trim()}
            onClick={() => save.mutate(undefined)}
          >
            {avatar ? 'Guardar' : 'Criar'}
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}

function HistoryModal({
  avatar,
  onClose,
}: {
  avatar: TrainingAvatar;
  onClose: () => void;
}) {
  const { data, error, refetch } = useApiQuery<AvatarHistoryEntry[]>(
    [...queryKeys.avatarTraining.avatars(), 'history', avatar.id],
    `/avatar-training/avatars/${avatar.id}/history`,
    { staleTime: 0 },
  );
  return (
    <Modal open onOpenChange={(o) => !o && onClose()}>
      <ModalContent
        title={`Histórico — ${avatar.name}`}
        description="Criação, alterações, testes e mudanças de estado."
      >
        <div className="mt-4 max-h-[60vh] space-y-2 overflow-y-auto">
          {error ? (
            <QueryError error={error} onRetry={() => refetch()} />
          ) : !data ? (
            <Skeleton
              rows={3}
              itemClassName="h-10 rounded-card bg-surface-sunken animate-pulse"
            />
          ) : data.length === 0 ? (
            <p className="font-body text-sm text-ink-faint">Sem registos.</p>
          ) : (
            data.map((h) => {
              const to = h.detail?.to as string | undefined;
              const fields = h.detail?.fields as string[] | undefined;
              return (
                <div
                  key={h.id}
                  className="rounded-card border border-border bg-surface p-2 font-body text-sm"
                >
                  <div className="font-medium text-ink">
                    {AUDIT_ACTION_LABEL[h.action] ?? h.action}
                    {to
                      ? ` → ${AVATAR_STATUS[to as AvatarStatus]?.label ?? to}`
                      : ''}
                    {h.action === 'TEST' && h.detail?.ok === false
                      ? ' (falhou)'
                      : ''}
                  </div>
                  <div className="text-xs text-ink-muted">
                    {formatDate(h.at)}
                    {h.user ? ` · ${h.user.fullName}` : ''}
                    {fields?.length ? ` · campos: ${fields.join(', ')}` : ''}
                  </div>
                </div>
              );
            })
          )}
        </div>
        <div className="flex justify-end pt-3">
          <Button size="sm" intent="ghost" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
}

export function AvatarsTab() {
  const notify = useToast();
  const isAdmin = useHasRole(ADMIN_ROLES);
  const [editing, setEditing] = useState<TrainingAvatar | 'new' | null>(null);
  const [historyOf, setHistoryOf] = useState<TrainingAvatar | null>(null);
  const key = queryKeys.avatarTraining.avatars();

  const { data, isLoading, error, refetch } = useApiQuery<TrainingAvatar[]>(
    key,
    '/avatar-training/avatars',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  const onError = (e: Error) =>
    notify({
      title: 'Não foi possível actualizar o avatar',
      description: e.message,
      intent: 'danger',
    });
  const test = useApiMutation(
    (id: number) => apiClient.post(`/avatar-training/avatars/${id}/test`),
    {
      invalidateKeys: [key],
      onSuccess: () => notify({ title: 'Teste registado', intent: 'success' }),
      onError,
    },
  );
  const setStatus = useApiMutation(
    (v: { id: number; status: AvatarStatus }) =>
      apiClient.post(`/avatar-training/avatars/${v.id}/status`, {
        status: v.status,
      }),
    { invalidateKeys: [key], onError },
  );

  if (error) return <QueryError error={error} onRetry={() => refetch()} />;
  if (isLoading || !data)
    return (
      <Skeleton
        rows={3}
        itemClassName="h-20 rounded-card bg-surface-sunken animate-pulse"
      />
    );

  return (
    <div className="space-y-4">
      {isAdmin && (
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setEditing('new')}>
            <Plus size={14} /> Novo avatar
          </Button>
        </div>
      )}

      {data.length === 0 ? (
        <EmptyState
          icon={Bot}
          title="Sem avatares"
          description="Ainda não existem instrutores virtuais disponíveis."
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {data.map((a) => (
            <AvatarCard
              key={a.id}
              avatar={a}
              showAdminInfo={isAdmin}
              actions={
                isAdmin && (
                  <>
                    <Button
                      type="button"
                      intent="secondary"
                      size="compact"
                      onClick={() => setEditing(a)}
                    >
                      <Pencil size={14} /> Editar
                    </Button>
                    <Button
                      type="button"
                      intent="secondary"
                      size="compact"
                      onClick={() => setHistoryOf(a)}
                    >
                      <History size={14} /> Histórico
                    </Button>
                    <Button
                      type="button"
                      intent="secondary"
                      size="compact"
                      disabled={test.isPending && test.variables === a.id}
                      onClick={() => test.mutate(a.id)}
                    >
                      Testar
                    </Button>
                    {a.status !== 'ACTIVE' ? (
                      <Button
                        type="button"
                        intent="primary"
                        size="compact"
                        disabled={!a.lastTestedAt}
                        title={
                          a.lastTestedAt
                            ? undefined
                            : 'É obrigatório testar o avatar antes de o activar'
                        }
                        onClick={() =>
                          setStatus.mutate({ id: a.id, status: 'ACTIVE' })
                        }
                      >
                        Activar
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        intent="secondary"
                        size="compact"
                        onClick={() =>
                          setStatus.mutate({ id: a.id, status: 'INACTIVE' })
                        }
                      >
                        Desactivar
                      </Button>
                    )}
                  </>
                )
              }
            />
          ))}
        </div>
      )}

      {editing && (
        <AvatarFormModal
          // O GET da lista traz os campos todos; `key` remonta o formulário por avatar.
          key={editing === 'new' ? 'new' : editing.id}
          avatar={editing === 'new' ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={() => refetch()}
        />
      )}
      {historyOf && (
        <HistoryModal avatar={historyOf} onClose={() => setHistoryOf(null)} />
      )}
    </div>
  );
}
