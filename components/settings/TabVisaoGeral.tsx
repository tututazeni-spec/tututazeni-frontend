// components/settings/TabVisaoGeral.tsx
// Tab "Visão Geral" (ADMIN): identidade da organização, contactos e formatos
// regionais — GET/PUT /settings/organization (docs/modulo_settings.md §1).

'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import type { OrganizationSettings } from './types';

type Form = Omit<OrganizationSettings, 'id' | 'tenantCode'>;

const LANGUAGES = [
  { value: 'pt', label: 'Português' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Español' },
  { value: 'fr', label: 'Français' },
];
const DATE_FORMATS = ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'].map((v) => ({
  value: v,
  label: v,
}));
const TIME_FORMATS = [
  { value: '24h', label: '24 horas' },
  { value: '12h', label: '12 horas (AM/PM)' },
];
const NUMBER_FORMATS = [
  { value: 'pt', label: '1 234,56' },
  { value: 'en', label: '1,234.56' },
];
const TIMEZONES = [
  'Africa/Luanda',
  'Africa/Maputo',
  'Europe/Lisbon',
  'America/Sao_Paulo',
  'UTC',
].map((v) => ({ value: v, label: v }));

// Imagens (logo/favicon) guardadas como data-URL — mesmo padrão do avatar.
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

export function TabVisaoGeral() {
  const toast = useToast();
  const { data, isLoading, error } = useApiQuery<OrganizationSettings>(
    queryKeys.settings.organization(),
    '/settings/organization',
  );
  const [form, setForm] = useState<Form | null>(null);

  useEffect(() => {
    if (data) {
      // updatedAt também vem no GET mas o DTO (whitelist) rejeita-o no PUT.
      const { id: _id, tenantCode: _code, updatedAt: _upd, ...rest } =
        data as OrganizationSettings & { updatedAt?: string | null };
      setForm(rest);
    }
  }, [data]);

  const save = useApiMutation(
    (payload: Partial<Form>) => apiClient.put('/settings/organization', payload),
    {
      invalidateKeys: [
        queryKeys.settings.organization(),
        queryKeys.settings.branding(),
      ],
      onSuccess: () =>
        toast({ title: 'Definições da organização guardadas', intent: 'success' }),
      onError: (e) => toast({ title: e.message, intent: 'danger' }),
    },
  );

  if (isLoading || !form)
    return (
      <p className="py-10 text-center text-sm text-ink-faint">A carregar…</p>
    );
  if (error)
    return <p className="py-10 text-center text-sm text-danger">{error.message}</p>;

  const text = (k: keyof Form) => (form[k] as string | null) ?? '';
  const set = (k: keyof Form, v: string) =>
    setForm((f) => (f ? { ...f, [k]: v } : f));

  async function pickImage(k: 'logoUrl' | 'faviconUrl', file?: File) {
    if (!file) return;
    try {
      set(k, await readImage(file));
    } catch (e) {
      toast({ title: (e as Error).message, intent: 'danger' });
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    // "" limpa o campo no backend (EmptyStringToUndefined ignora) — só enviamos o preenchido.
    const payload = Object.fromEntries(
      Object.entries(form).filter(([, v]) => v !== null && v !== ''),
    ) as Partial<Form>;
    save.mutate(payload);
  }

  return (
    <form onSubmit={submit} className="grid grid-cols-2 gap-4">
      <Card className="col-span-2">
        <CardBody>
          <h3 className="mb-4 text-base font-bold text-ink">Identidade</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Nome do tenant" htmlFor="tenantName">
              <Input
                id="tenantName"
                className="w-full"
                value={text('tenantName')}
                onChange={(e) => set('tenantName', e.target.value)}
                required
              />
            </FormField>
            <FormField label="Nome da plataforma" htmlFor="platformName">
              <Input
                id="platformName"
                className="w-full"
                value={text('platformName')}
                onChange={(e) => set('platformName', e.target.value)}
              />
            </FormField>
            <FormField label="Logo" htmlFor="logoUrl" hint="PNG/SVG, máx. 512 KB">
              <div className="flex items-center gap-3">
                {form.logoUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.logoUrl} alt="Logo" className="h-10 w-auto" />
                )}
                <input
                  id="logoUrl"
                  type="file"
                  accept="image/*"
                  onChange={(e) => pickImage('logoUrl', e.target.files?.[0])}
                />
              </div>
            </FormField>
            <FormField label="Favicon" htmlFor="faviconUrl" hint="PNG/ICO, máx. 512 KB">
              <div className="flex items-center gap-3">
                {form.faviconUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.faviconUrl} alt="Favicon" className="h-8 w-8" />
                )}
                <input
                  id="faviconUrl"
                  type="file"
                  accept="image/*"
                  onChange={(e) => pickImage('faviconUrl', e.target.files?.[0])}
                />
              </div>
            </FormField>
          </div>
        </CardBody>
      </Card>

      <Card className="col-span-2">
        <CardBody>
          <h3 className="mb-4 text-base font-bold text-ink">
            Dados da empresa e contactos
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="NIF" htmlFor="nif">
              <Input id="nif" className="w-full" value={text('nif')} onChange={(e) => set('nif', e.target.value)} />
            </FormField>
            <FormField label="Sector" htmlFor="sector">
              <Input id="sector" className="w-full" value={text('sector')} onChange={(e) => set('sector', e.target.value)} />
            </FormField>
            <FormField label="Morada" htmlFor="address">
              <Input id="address" className="w-full" value={text('address')} onChange={(e) => set('address', e.target.value)} />
            </FormField>
            <FormField label="País" htmlFor="country">
              <Input id="country" className="w-full" value={text('country')} onChange={(e) => set('country', e.target.value)} />
            </FormField>
            <FormField label="Telefone" htmlFor="phone">
              <Input id="phone" className="w-full" value={text('phone')} onChange={(e) => set('phone', e.target.value)} />
            </FormField>
            <FormField label="Email de contacto" htmlFor="contactEmail">
              <Input id="contactEmail" type="email" className="w-full" value={text('contactEmail')} onChange={(e) => set('contactEmail', e.target.value)} />
            </FormField>
            <FormField label="Website" htmlFor="website">
              <Input id="website" className="w-full" value={text('website')} onChange={(e) => set('website', e.target.value)} />
            </FormField>
          </div>
        </CardBody>
      </Card>

      <Card className="col-span-2">
        <CardBody>
          <h3 className="mb-4 text-base font-bold text-ink">Formatos regionais</h3>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Fuso horário" htmlFor="defaultTimezone">
              <Select className="w-full" items={TIMEZONES} value={form.defaultTimezone} onValueChange={(v) => set('defaultTimezone', v)} />
            </FormField>
            <FormField label="Idioma" htmlFor="defaultLanguage">
              <Select className="w-full" items={LANGUAGES} value={form.defaultLanguage} onValueChange={(v) => set('defaultLanguage', v)} />
            </FormField>
            <FormField label="Moeda" htmlFor="defaultCurrency" hint="Código ISO, ex.: AOA">
              <Input id="defaultCurrency" className="w-full" maxLength={3} value={text('defaultCurrency')} onChange={(e) => set('defaultCurrency', e.target.value.toUpperCase())} />
            </FormField>
            <FormField label="Formato de data" htmlFor="dateFormat">
              <Select className="w-full" items={DATE_FORMATS} value={form.dateFormat} onValueChange={(v) => set('dateFormat', v)} />
            </FormField>
            <FormField label="Formato de hora" htmlFor="timeFormat">
              <Select className="w-full" items={TIME_FORMATS} value={form.timeFormat} onValueChange={(v) => set('timeFormat', v)} />
            </FormField>
            <FormField label="Formato de números" htmlFor="numberFormat">
              <Select className="w-full" items={NUMBER_FORMATS} value={form.numberFormat} onValueChange={(v) => set('numberFormat', v)} />
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
  );
}
