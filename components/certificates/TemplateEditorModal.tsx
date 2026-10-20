// components/certificates/TemplateEditorModal.tsx
// Editor de um dos nove modelos: textos (com variáveis), cores, imagens, posição e
// versões. Guardar cria uma versão nova; os certificados já emitidos não mudam.
// Valida no cliente (o backend valida de novo) e permite pré-visualizar o rascunho.

'use client';

import { useRef, useState } from 'react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { formatDateTime } from '@/lib/format';
import { useToast } from '@/providers/ToastProvider';
import { AlertCard } from '@/components/ui/AlertCard';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { PillNav } from '@/components/ui/PillTabs';
import { Skeleton } from '@/components/ui/Skeleton';
import { ImageUploadField } from './ImageUploadField';
import { TemplatePreviewModal } from './TemplatePreviewModal';
import { VariableChips } from './VariableChips';
import {
  ALIGN_LABEL,
  COLOR_LABEL,
  ELEMENT_LABEL,
  ELEMENT_ORDER,
  HEX,
  OPTION_LABEL,
  TEXT_FIELDS,
} from './templateLabels';
import type {
  Align,
  ElementKey,
  ElementTweak,
  TemplateConfigDto,
  TemplateDetailDto,
} from './types';

const TABS = [
  { id: 'texts', label: 'Textos' },
  { id: 'colors', label: 'Cores' },
  { id: 'images', label: 'Imagens' },
  { id: 'position', label: 'Posição' },
  { id: 'versions', label: 'Versões' },
] as const;
type TabId = (typeof TABS)[number]['id'];

type TextKey = (typeof TEXT_FIELDS)[number]['key'];
const MAX_TITLE = 120;
const MAX_TEXT = 300;

function validate(c: TemplateConfigDto): string[] {
  const errors: string[] = [];
  if (!c.texts.title.trim()) errors.push('O título não pode estar vazio.');
  for (const f of TEXT_FIELDS) {
    const max = f.key === 'title' ? MAX_TITLE : MAX_TEXT;
    if (c.texts[f.key].length > max)
      errors.push(`${f.label}: excede ${max} caracteres.`);
  }
  for (const k of Object.keys(COLOR_LABEL) as (keyof typeof COLOR_LABEL)[]) {
    if (!HEX.test(c.colors[k])) {
      errors.push(
        `A ${COLOR_LABEL[k].toLowerCase()} tem de ser no formato #RRGGBB.`,
      );
    }
  }
  for (const [k, label] of [
    ['name', 'Nome do responsável'],
    ['title', 'Cargo do responsável'],
  ] as const) {
    if ((c.signatory[k] ?? '').length > MAX_TITLE)
      errors.push(`${label}: excede ${MAX_TITLE} caracteres.`);
  }
  return errors;
}

/** Configuração a enviar: sem campos de assinatura vazios nem personalizações vazias. */
function toPayload(c: TemplateConfigDto): TemplateConfigDto {
  const signatory: TemplateConfigDto['signatory'] = {};
  if (c.signatory.name?.trim()) signatory.name = c.signatory.name.trim();
  if (c.signatory.title?.trim()) signatory.title = c.signatory.title.trim();
  return { ...c, signatory };
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <fieldset className="space-y-3">
      <legend className="mb-1 text-sm font-semibold text-ink">{title}</legend>
      {children}
    </fieldset>
  );
}

function EditorForm({
  detail,
  canEdit,
  onClose,
}: {
  detail: TemplateDetailDto;
  canEdit: boolean;
  onClose: () => void;
}) {
  const toast = useToast();
  const [form, setForm] = useState<TemplateConfigDto>(() =>
    structuredClone(detail.config),
  );
  const [tab, setTab] = useState<TabId>('texts');
  const [errors, setErrors] = useState<string[]>([]);
  const [preview, setPreview] = useState<TemplateConfigDto | null>(null);
  const [activeText, setActiveText] = useState<TextKey>('recognition');
  const fields = useRef<
    Partial<Record<TextKey, HTMLInputElement | HTMLTextAreaElement | null>>
  >({});

  const setText = (k: TextKey, v: string) =>
    setForm((f) => ({ ...f, texts: { ...f.texts, [k]: v } }));

  function insertVariable(token: string) {
    const el = fields.current[activeText];
    const current = form.texts[activeText];
    const start = el?.selectionStart ?? current.length;
    const end = el?.selectionEnd ?? start;
    setText(activeText, current.slice(0, start) + token + current.slice(end));
  }

  function tweak(el: ElementKey, patch: Partial<ElementTweak>) {
    setForm((f) => {
      const next: ElementTweak = { ...f.elements[el], ...patch };
      for (const k of Object.keys(next) as (keyof ElementTweak)[]) {
        if (next[k] === undefined) delete next[k];
      }
      const elements = { ...f.elements };
      if (Object.keys(next).length === 0) delete elements[el];
      else elements[el] = next;
      return { ...f, elements };
    });
  }

  const save = useApiMutation(
    (payload: TemplateConfigDto) =>
      apiClient.put(`/certificates/templates/${detail.id}`, payload),
    {
      invalidateKeys: [
        queryKeys.certificates.templates(),
        queryKeys.certificates.template(detail.id),
      ],
      onSuccess: () => {
        toast({
          title: 'Modelo guardado numa nova versão.',
          intent: 'success',
        });
        onClose();
      },
      onError: (e) => setErrors([e.message]),
    },
  );

  const [restoring, setRestoring] = useState<number | null>(null);
  const restore = useApiMutation(
    (version: number) =>
      apiClient.post(
        `/certificates/templates/${detail.id}/versions/${version}/restore`,
        {},
      ),
    {
      invalidateKeys: [
        queryKeys.certificates.templates(),
        queryKeys.certificates.template(detail.id),
      ],
      onSuccess: () => {
        toast({
          title: 'Versão restaurada numa nova versão.',
          intent: 'success',
        });
        setRestoring(null);
        onClose();
      },
      onError: (e) => {
        setRestoring(null);
        toast({
          title: 'Não foi possível restaurar a versão.',
          description: e.message,
          intent: 'danger',
        });
      },
    },
  );

  function submit() {
    const found = validate(form);
    setErrors(found);
    if (found.length === 0) save.mutate(toPayload(form));
  }

  return (
    <Modal open onOpenChange={(o) => !o && onClose()}>
      <ModalContent
        title={`Editar modelo — ${detail.name}`}
        description="Cada gravação cria uma versão nova; os certificados já emitidos não mudam."
        className="max-w-3xl"
        navyHeader
      >
        <div className="space-y-4">
          <PillNav
            items={TABS}
            value={tab}
            onChange={(id) => setTab(id as TabId)}
            label="Editor do modelo"
          />

          {errors.length > 0 && (
            <div className="space-y-2">
              <AlertCard
                variant="danger"
                title="Não foi possível guardar"
                message="Corrija os pontos abaixo e tente de novo."
                compact
              />
              <ul className="list-disc space-y-0.5 pl-5 text-sm text-danger">
                {errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          {tab === 'texts' && (
            <div className="space-y-4">
              {TEXT_FIELDS.map((f) => {
                const id = `tpl-${f.key}`;
                const common = {
                  id,
                  value: form.texts[f.key],
                  onFocus: () => setActiveText(f.key),
                  onChange: (
                    e: React.ChangeEvent<
                      HTMLInputElement | HTMLTextAreaElement
                    >,
                  ) => setText(f.key, e.target.value),
                };
                return (
                  <div key={f.key} className="space-y-1">
                    <label
                      htmlFor={id}
                      className="block text-sm font-medium text-ink"
                    >
                      {f.label}
                    </label>
                    {f.multiline ? (
                      <textarea
                        {...common}
                        ref={(el) => {
                          fields.current[f.key] = el;
                        }}
                        rows={f.key === 'recognition' ? 2 : 3}
                        className="w-full rounded-control border border-line bg-surface px-3 py-2 text-sm text-ink"
                      />
                    ) : (
                      <Input
                        {...common}
                        ref={(el) => {
                          fields.current[f.key] = el;
                        }}
                      />
                    )}
                  </div>
                );
              })}
              <VariableChips onInsert={insertVariable} />
              <Section title="Responsável pela assinatura">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label
                      htmlFor="tpl-sig-name"
                      className="block text-sm font-medium text-ink"
                    >
                      Nome do responsável
                    </label>
                    <Input
                      id="tpl-sig-name"
                      value={form.signatory.name ?? ''}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          signatory: { ...f.signatory, name: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor="tpl-sig-title"
                      className="block text-sm font-medium text-ink"
                    >
                      Cargo do responsável
                    </label>
                    <Input
                      id="tpl-sig-title"
                      value={form.signatory.title ?? ''}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          signatory: { ...f.signatory, title: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>
              </Section>
              <Section title="O que mostrar">
                {(
                  Object.keys(OPTION_LABEL) as (keyof typeof OPTION_LABEL)[]
                ).map((k) => (
                  <label
                    key={k}
                    className="flex items-center gap-2 text-sm text-ink"
                  >
                    <input
                      type="checkbox"
                      checked={form.options[k]}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          options: { ...f.options, [k]: e.target.checked },
                        }))
                      }
                    />
                    {OPTION_LABEL[k]}
                  </label>
                ))}
              </Section>
            </div>
          )}

          {tab === 'colors' && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {(Object.keys(COLOR_LABEL) as (keyof typeof COLOR_LABEL)[]).map(
                (k) => (
                  <div key={k} className="space-y-1">
                    <span className="block text-sm font-medium text-ink">
                      {COLOR_LABEL[k]}
                    </span>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        aria-label={`${COLOR_LABEL[k]} (selector de cor)`}
                        value={
                          HEX.test(form.colors[k]) ? form.colors[k] : '#000000'
                        }
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            colors: {
                              ...f.colors,
                              [k]: e.target.value.toUpperCase(),
                            },
                          }))
                        }
                        className="h-9 w-12 cursor-pointer rounded border border-border"
                      />
                      <Input
                        aria-label={`${COLOR_LABEL[k]} (hexadecimal)`}
                        value={form.colors[k]}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            colors: { ...f.colors, [k]: e.target.value },
                          }))
                        }
                        className="font-mono"
                      />
                    </div>
                  </div>
                ),
              )}
              <p className="text-xs text-ink-muted sm:col-span-2">
                O texto tem de ter contraste suficiente com o fundo; o servidor
                recusa combinações ilegíveis.
              </p>
            </div>
          )}

          {tab === 'images' && (
            <div className="space-y-5">
              <ImageUploadField
                kind="LOGO"
                label="Logótipo"
                value={form.assets.logoId}
                onChange={(id) =>
                  setForm((f) => ({
                    ...f,
                    assets: { ...f.assets, logoId: id },
                  }))
                }
              />
              <ImageUploadField
                kind="BACKGROUND"
                label="Imagem de fundo"
                value={form.assets.backgroundId}
                onChange={(id) =>
                  setForm((f) => ({
                    ...f,
                    assets: { ...f.assets, backgroundId: id },
                  }))
                }
              />
              <ImageUploadField
                kind="SIGNATURE"
                label="Imagem da assinatura"
                value={form.assets.signatureId}
                note="É apenas a imagem da assinatura; não é uma assinatura digital criptográfica."
                onChange={(id) =>
                  setForm((f) => ({
                    ...f,
                    assets: { ...f.assets, signatureId: id },
                  }))
                }
              />
            </div>
          )}

          {tab === 'position' && (
            <div className="space-y-3">
              {ELEMENT_ORDER.map((el) => {
                const t = form.elements[el] ?? {};
                const label = ELEMENT_LABEL[el];
                return (
                  <div
                    key={el}
                    className="grid grid-cols-1 items-center gap-2 border-b border-border pb-3 sm:grid-cols-6"
                  >
                    <span className="text-sm font-medium text-ink sm:col-span-2">
                      {label}
                    </span>
                    <select
                      aria-label={`Alinhamento de ${label}`}
                      value={t.align ?? ''}
                      onChange={(e) =>
                        tweak(el, {
                          align: (e.target.value || undefined) as
                            Align | undefined,
                        })
                      }
                      className="rounded-control border border-line bg-surface px-2 py-1 text-sm"
                    >
                      <option value="">Predefinido</option>
                      {(Object.keys(ALIGN_LABEL) as Align[]).map((a) => (
                        <option key={a} value={a}>
                          {ALIGN_LABEL[a]}
                        </option>
                      ))}
                    </select>
                    <input
                      type="range"
                      aria-label={`Tamanho de ${label}`}
                      min={0.6}
                      max={1.5}
                      step={0.05}
                      value={t.scale ?? 1}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        tweak(el, { scale: v === 1 ? undefined : v });
                      }}
                    />
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        aria-label={`Deslocamento horizontal de ${label}`}
                        min={-15}
                        max={15}
                        step={1}
                        value={Math.round((t.dx ?? 0) * 100)}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          tweak(el, { dx: v === 0 ? undefined : v / 100 });
                        }}
                      />
                      <input
                        type="range"
                        aria-label={`Deslocamento vertical de ${label}`}
                        min={-15}
                        max={15}
                        step={1}
                        value={Math.round((t.dy ?? 0) * 100)}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          tweak(el, { dy: v === 0 ? undefined : v / 100 });
                        }}
                      />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-ink sm:col-span-6">
                      <input
                        type="checkbox"
                        aria-label={`Mostrar ${label}`}
                        checked={t.visible !== false}
                        onChange={(e) =>
                          tweak(el, {
                            visible: e.target.checked ? undefined : false,
                          })
                        }
                      />
                      Mostrar
                    </label>
                  </div>
                );
              })}
              <p className="text-xs text-ink-muted">
                Tamanho de 60% a 150%; deslocamento até 15% da página para cada
                lado. O servidor garante que nada sai da página.
              </p>
            </div>
          )}

          {tab === 'versions' && (
            <ul className="space-y-2">
              {detail.versions.map((v) => (
                <li
                  key={v.version}
                  className="flex items-center justify-between gap-3 rounded border border-border px-3 py-2 text-sm"
                >
                  <span className="font-medium text-ink">
                    Versão {v.version}
                    {v.version === detail.currentVersion && ' (actual)'}
                    {v.restoredFromVersion != null && (
                      <span className="ml-2 font-normal text-ink-muted">
                        Restaurada da versão {v.restoredFromVersion}
                      </span>
                    )}
                  </span>
                  <span className="flex items-center gap-3 text-ink-muted">
                    <span>
                      {formatDateTime(v.createdAt)} ·{' '}
                      {v.createdByName ?? 'Sistema'}
                    </span>
                    {canEdit && v.version !== detail.currentVersion && (
                      <Button
                        intent="secondary"
                        size="sm"
                        aria-label={`Restaurar versão ${v.version}`}
                        onClick={() => setRestoring(v.version)}
                      >
                        Restaurar
                      </Button>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <Button intent="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              intent="secondary"
              onClick={() => setPreview(structuredClone(form))}
            >
              Pré-visualizar
            </Button>
            <Button onClick={submit} disabled={save.isPending}>
              {save.isPending ? 'A guardar…' : 'Guardar nova versão'}
            </Button>
          </div>
        </div>
      </ModalContent>
      {restoring !== null && (
        <ConfirmDialog
          title={`Restaurar a versão ${restoring}?`}
          message={`Será criada uma nova versão com o conteúdo da versão ${restoring}. As versões anteriores e os certificados já emitidos não são alterados.`}
          confirmLabel={restore.isPending ? 'A restaurar…' : 'Restaurar'}
          onConfirm={() => restore.mutate(restoring)}
          onCancel={() => setRestoring(null)}
        />
      )}
      {preview && (
        <TemplatePreviewModal
          config={preview}
          onClose={() => setPreview(null)}
        />
      )}
    </Modal>
  );
}

export function TemplateEditorModal({
  templateId,
  canEdit = true,
  onClose,
}: {
  templateId: string;
  canEdit?: boolean;
  onClose: () => void;
}) {
  const { data, isLoading } = useApiQuery<TemplateDetailDto>(
    queryKeys.certificates.template(templateId),
    `/certificates/templates/${templateId}`,
  );
  if (isLoading || !data) {
    return (
      <Modal open onOpenChange={(o) => !o && onClose()}>
        <ModalContent title="A carregar o modelo…" navyHeader>
          <Skeleton rows={3} />
        </ModalContent>
      </Modal>
    );
  }
  return <EditorForm detail={data} canEdit={canEdit} onClose={onClose} />;
}
