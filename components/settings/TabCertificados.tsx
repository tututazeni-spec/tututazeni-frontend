// components/settings/TabCertificados.tsx
// Tab "Certificados" (ADMIN): logo/assinatura/texto padrão/numeração globais
// (GET/PUT /settings/certificates) + biblioteca de templates — CRUD próprio em
// /settings/certificates/templates (docs/modulo_settings.md §7).

'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useToast } from '@/providers/ToastProvider';
import { useConfirm } from '@/providers/ConfirmProvider';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import type { CertificateSettings, CertificateTemplate, CertificateTemplateType } from './types';

const TEMPLATE_TYPES: { value: CertificateTemplateType; label: string }[] = [
  { value: 'COURSE', label: 'Curso' },
  { value: 'PROGRAM', label: 'Programa' },
  { value: 'COMPETENCY', label: 'Competência' },
  { value: 'ATTENDANCE', label: 'Presença' },
  { value: 'PARTICIPATION', label: 'Participação' },
  { value: 'ACHIEVEMENT', label: 'Mérito' },
];
const TEMPLATE_TYPE_LABELS: Record<string, string> = Object.fromEntries(
  TEMPLATE_TYPES.map((t) => [t.value, t.label]),
);

const MAX_IMAGE_BYTES = 512 * 1024;

function readImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_IMAGE_BYTES) {
      reject(new Error('Imagem demasiado grande (máx. 512 KB).'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Falha ao ler a imagem.'));
    reader.readAsDataURL(file);
  });
}

interface TemplateDraft {
  name: string;
  description: string;
  type: CertificateTemplateType;
  html: string;
  cssStyle: string;
  signatoryName: string;
  signatoryTitle: string;
  isDefault: boolean;
  isActive: boolean;
  validityDays: string;
}

const EMPTY_DRAFT: TemplateDraft = {
  name: '',
  description: '',
  type: 'COURSE',
  html: '',
  cssStyle: '',
  signatoryName: '',
  signatoryTitle: '',
  isDefault: false,
  isActive: true,
  validityDays: '',
};

export function TabCertificados() {
  const toast = useToast();
  const confirm = useConfirm();

  const { data, isLoading, error } = useApiQuery<CertificateSettings>(
    queryKeys.settings.certificates(),
    '/settings/certificates',
  );
  const templates = useApiQuery<CertificateTemplate[]>(
    queryKeys.settings.certificateTemplates(),
    '/settings/certificates/templates',
  );

  const [form, setForm] = useState<CertificateSettings | null>(null);
  useEffect(() => {
    if (data) setForm(data);
  }, [data]);

  const save = useApiMutation(
    (payload: Partial<CertificateSettings>) => apiClient.put('/settings/certificates', payload),
    {
      invalidateKeys: [queryKeys.settings.certificates()],
      onSuccess: () => toast({ title: 'Definições de certificados guardadas', intent: 'success' }),
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  const [editing, setEditing] = useState<CertificateTemplate | null>(null);
  const [draft, setDraft] = useState<TemplateDraft | null>(null);

  const createTemplate = useApiMutation(
    (payload: Record<string, unknown>) => apiClient.post('/settings/certificates/templates', payload),
    {
      invalidateKeys: [queryKeys.settings.certificateTemplates()],
      onSuccess: () => {
        toast({ title: 'Template criado', intent: 'success' });
        setDraft(null);
      },
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );
  const updateTemplate = useApiMutation(
    ({ id, payload }: { id: string; payload: Record<string, unknown> }) =>
      apiClient.put(`/settings/certificates/templates/${id}`, payload),
    {
      invalidateKeys: [queryKeys.settings.certificateTemplates()],
      onSuccess: () => {
        toast({ title: 'Template actualizado', intent: 'success' });
        setEditing(null);
        setDraft(null);
      },
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );
  const deleteTemplate = useApiMutation(
    (id: string) => apiClient.delete(`/settings/certificates/templates/${id}`),
    {
      invalidateKeys: [queryKeys.settings.certificateTemplates()],
      onSuccess: () => toast({ title: 'Template removido', intent: 'success' }),
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );
  const setDefault = useApiMutation(
    (id: string) => apiClient.post(`/settings/certificates/templates/${id}/default`),
    {
      invalidateKeys: [queryKeys.settings.certificateTemplates()],
      onSuccess: () => toast({ title: 'Template definido como predefinido', intent: 'success' }),
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  if (isLoading || !form)
    return <p className="py-10 text-center text-sm text-ink-faint">A carregar…</p>;
  if (error) return <p className="py-10 text-center text-sm text-danger">{error.message}</p>;

  const set = (patch: Partial<CertificateSettings>) =>
    setForm((f) => (f ? { ...f, ...patch } : f));

  async function pickImage(k: 'academyLogoUrl' | 'signatureUrl', file?: File) {
    if (!file) return;
    try {
      set({ [k]: await readImage(file) });
    } catch (e) {
      toast({ title: (e as Error).message, intent: 'danger' });
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    const { nextNumberPreview: _preview, ...payload } = form;
    save.mutate(payload);
  }

  function openCreate() {
    setEditing(null);
    setDraft({ ...EMPTY_DRAFT });
  }
  function openEdit(t: CertificateTemplate) {
    setEditing(t);
    setDraft({
      name: t.name,
      description: t.description ?? '',
      type: t.type,
      html: t.html,
      cssStyle: t.cssStyle ?? '',
      signatoryName: t.signatoryName ?? '',
      signatoryTitle: t.signatoryTitle ?? '',
      isDefault: t.isDefault,
      isActive: t.isActive,
      validityDays: t.validityDays ? String(t.validityDays) : '',
    });
  }

  function submitDraft(e: React.FormEvent) {
    e.preventDefault();
    if (!draft) return;
    const payload = {
      name: draft.name,
      description: draft.description || undefined,
      type: draft.type,
      html: draft.html,
      cssStyle: draft.cssStyle || undefined,
      signatoryName: draft.signatoryName || undefined,
      signatoryTitle: draft.signatoryTitle || undefined,
      isDefault: draft.isDefault,
      isActive: draft.isActive,
      validityDays: draft.validityDays ? Number(draft.validityDays) : undefined,
    };
    if (editing) updateTemplate.mutate({ id: editing.id, payload });
    else createTemplate.mutate(payload);
  }

  async function removeTemplate(t: CertificateTemplate) {
    if (t.isDefault) {
      toast({
        title: 'Defina outro predefinido do mesmo tipo antes de remover este',
        intent: 'danger',
      });
      return;
    }
    if (
      await confirm({
        title: `Remover "${t.name}"?`,
        confirmLabel: 'Remover',
        destructive: true,
      })
    ) {
      deleteTemplate.mutate(t.id);
    }
  }

  const list = templates.data ?? [];

  return (
    <div className="space-y-4">
      <form onSubmit={submit} className="grid grid-cols-2 gap-4">
        <Card className="col-span-2">
          <CardBody>
            <h3 className="mb-4 text-base font-bold text-ink">Identidade dos certificados</h3>
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Logo da academia" htmlFor="academyLogoUrl" hint="Substitui o logo de cada template. PNG/SVG, máx. 512 KB">
                <div className="flex items-center gap-3">
                  {form.academyLogoUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.academyLogoUrl} alt="Logo" className="h-10 w-auto" />
                  )}
                  <input
                    id="academyLogoUrl"
                    type="file"
                    accept="image/*"
                    onChange={(e) => pickImage('academyLogoUrl', e.target.files?.[0])}
                  />
                </div>
              </FormField>
              <FormField label="Assinatura electrónica" htmlFor="signatureUrl" hint="Aplicada a todos os certificados. PNG, máx. 512 KB">
                <div className="flex items-center gap-3">
                  {form.signatureUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={form.signatureUrl} alt="Assinatura" className="h-10 w-auto" />
                  )}
                  <input
                    id="signatureUrl"
                    type="file"
                    accept="image/*"
                    onChange={(e) => pickImage('signatureUrl', e.target.files?.[0])}
                  />
                </div>
              </FormField>
              <FormField label="Nome do signatário" htmlFor="signatoryName">
                <Input
                  id="signatoryName"
                  className="w-full"
                  value={form.signatoryName ?? ''}
                  onChange={(e) => set({ signatoryName: e.target.value })}
                />
              </FormField>
              <FormField label="Cargo do signatário" htmlFor="signatoryTitle">
                <Input
                  id="signatoryTitle"
                  className="w-full"
                  value={form.signatoryTitle ?? ''}
                  onChange={(e) => set({ signatoryTitle: e.target.value })}
                />
              </FormField>
            </div>
            <div className="mt-4">
              <FormField label="Texto padrão" htmlFor="defaultText" hint="Acrescentado a todos os certificados emitidos">
                <Textarea
                  id="defaultText"
                  className="w-full"
                  rows={3}
                  value={form.defaultText ?? ''}
                  onChange={(e) => set({ defaultText: e.target.value })}
                />
              </FormField>
            </div>
          </CardBody>
        </Card>

        <Card className="col-span-2">
          <CardBody>
            <h3 className="mb-1 text-base font-bold text-ink">Numeração e verificação</h3>
            <p className="mb-4 text-xs text-ink-faint">
              Próximo número: <span className="font-mono font-semibold text-ink">{form.nextNumberPreview}</span>
            </p>
            <div className="grid grid-cols-4 gap-4">
              <FormField label="Prefixo" htmlFor="numberingPrefix">
                <Input
                  id="numberingPrefix"
                  className="w-full"
                  value={form.numberingPrefix}
                  onChange={(e) => set({ numberingPrefix: e.target.value })}
                />
              </FormField>
              <FormField label="Próximo nº de sequência" htmlFor="numberingNextSeq">
                <Input
                  id="numberingNextSeq"
                  type="number"
                  min={1}
                  className="w-full"
                  value={form.numberingNextSeq}
                  onChange={(e) => set({ numberingNextSeq: Number(e.target.value) })}
                />
              </FormField>
              <FormField label="Zeros à esquerda" htmlFor="numberingPadding">
                <Input
                  id="numberingPadding"
                  type="number"
                  min={0}
                  max={10}
                  className="w-full"
                  value={form.numberingPadding}
                  onChange={(e) => set({ numberingPadding: Number(e.target.value) })}
                />
              </FormField>
              <FormField label="Tamanho do código de verificação" htmlFor="verificationCodeLength">
                <Input
                  id="verificationCodeLength"
                  type="number"
                  min={6}
                  max={32}
                  className="w-full"
                  value={form.verificationCodeLength}
                  onChange={(e) => set({ verificationCodeLength: Number(e.target.value) })}
                />
              </FormField>
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
            <h3 className="text-base font-bold text-ink">Biblioteca de templates</h3>
            <Button type="button" onClick={openCreate}>
              Novo template
            </Button>
          </div>
          {templates.isLoading ? (
            <p className="text-sm text-ink-faint">A carregar…</p>
          ) : !list.length ? (
            <p className="py-6 text-center text-sm text-ink-faint">Nenhum template criado.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-ink-faint">
                  <th className="py-2">Nome</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Validade</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {list.map((t) => (
                  <tr key={t.id} className="border-t border-border">
                    <td className="py-2">
                      <div className="font-medium text-ink">{t.name}</div>
                      {t.description && (
                        <div className="text-xs text-ink-faint">{t.description}</div>
                      )}
                    </td>
                    <td>{TEMPLATE_TYPE_LABELS[t.type] ?? t.type}</td>
                    <td>
                      <div className="flex gap-1">
                        {t.isDefault && <Badge intent="info">Predefinido</Badge>}
                        <Badge intent={t.isActive ? 'success' : 'neutral'}>
                          {t.isActive ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </div>
                    </td>
                    <td>{t.validityDays ? `${t.validityDays} dias` : 'Sem validade'}</td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        {!t.isDefault && (
                          <Button
                            intent="ghost"
                            disabled={setDefault.isPending}
                            onClick={() => setDefault.mutate(t.id)}
                          >
                            Predefinir
                          </Button>
                        )}
                        <Button intent="ghost" onClick={() => openEdit(t)}>
                          Editar
                        </Button>
                        <Button
                          intent="ghost"
                          className="text-danger"
                          disabled={deleteTemplate.isPending}
                          onClick={() => removeTemplate(t)}
                        >
                          Remover
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

      {draft && (
        <Modal
          open
          onOpenChange={(open) => {
            if (!open) {
              setDraft(null);
              setEditing(null);
            }
          }}
        >
          <ModalContent
            title={editing ? 'Editar template' : 'Novo template'}
            className="max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <form onSubmit={submitDraft} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Nome *" htmlFor="tpl-name">
                  <Input
                    id="tpl-name"
                    className="w-full"
                    required
                    value={draft.name}
                    onChange={(e) => setDraft((d) => (d ? { ...d, name: e.target.value } : d))}
                  />
                </FormField>
                <FormField label="Tipo *" htmlFor="tpl-type">
                  <Select
                    className="w-full"
                    items={TEMPLATE_TYPES}
                    value={draft.type}
                    onValueChange={(v) =>
                      setDraft((d) => (d ? { ...d, type: v as CertificateTemplateType } : d))
                    }
                  />
                </FormField>
              </div>
              <FormField label="Descrição" htmlFor="tpl-description">
                <Input
                  id="tpl-description"
                  className="w-full"
                  value={draft.description}
                  onChange={(e) => setDraft((d) => (d ? { ...d, description: e.target.value } : d))}
                />
              </FormField>
              <FormField label="HTML *" htmlFor="tpl-html" hint="Markup do certificado (placeholders resolvidos na emissão)">
                <Textarea
                  id="tpl-html"
                  className="w-full font-mono text-xs"
                  rows={8}
                  required
                  value={draft.html}
                  onChange={(e) => setDraft((d) => (d ? { ...d, html: e.target.value } : d))}
                />
              </FormField>
              <FormField label="CSS" htmlFor="tpl-css">
                <Textarea
                  id="tpl-css"
                  className="w-full font-mono text-xs"
                  rows={4}
                  value={draft.cssStyle}
                  onChange={(e) => setDraft((d) => (d ? { ...d, cssStyle: e.target.value } : d))}
                />
              </FormField>
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Nome do signatário" htmlFor="tpl-signatoryName">
                  <Input
                    id="tpl-signatoryName"
                    className="w-full"
                    value={draft.signatoryName}
                    onChange={(e) =>
                      setDraft((d) => (d ? { ...d, signatoryName: e.target.value } : d))
                    }
                  />
                </FormField>
                <FormField label="Cargo do signatário" htmlFor="tpl-signatoryTitle">
                  <Input
                    id="tpl-signatoryTitle"
                    className="w-full"
                    value={draft.signatoryTitle}
                    onChange={(e) =>
                      setDraft((d) => (d ? { ...d, signatoryTitle: e.target.value } : d))
                    }
                  />
                </FormField>
                <FormField label="Validade (dias)" htmlFor="tpl-validityDays" hint="Vazio = sem validade">
                  <Input
                    id="tpl-validityDays"
                    type="number"
                    min={1}
                    max={3650}
                    className="w-full"
                    value={draft.validityDays}
                    onChange={(e) =>
                      setDraft((d) => (d ? { ...d, validityDays: e.target.value } : d))
                    }
                  />
                </FormField>
                <div className="flex items-end gap-4">
                  <label htmlFor="tpl-isActive" className="flex items-center gap-2 text-sm text-ink">
                    <input
                      id="tpl-isActive"
                      type="checkbox"
                      checked={draft.isActive}
                      onChange={(e) =>
                        setDraft((d) => (d ? { ...d, isActive: e.target.checked } : d))
                      }
                    />
                    Activo
                  </label>
                  <label htmlFor="tpl-isDefault" className="flex items-center gap-2 text-sm text-ink">
                    <input
                      id="tpl-isDefault"
                      type="checkbox"
                      checked={draft.isDefault}
                      onChange={(e) =>
                        setDraft((d) => (d ? { ...d, isDefault: e.target.checked } : d))
                      }
                    />
                    Predefinido do tipo
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  intent="ghost"
                  onClick={() => {
                    setDraft(null);
                    setEditing(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createTemplate.isPending || updateTemplate.isPending}>
                  {createTemplate.isPending || updateTemplate.isPending
                    ? 'A guardar…'
                    : editing
                      ? 'Guardar alterações'
                      : 'Criar template'}
                </Button>
              </div>
            </form>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
}
