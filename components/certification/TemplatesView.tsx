// components/certification/TemplatesView.tsx

import { TEMPLATE_TYPES, TEMPLATE_TYPE_LABEL } from './types';
import type { Template, TemplateForm } from './types';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Skeleton } from '@/components/ui/Skeleton';
import { Textarea } from '@/components/ui/Textarea';

interface TemplatesViewProps {
  data: Template[];
  loading: boolean;
  error: string;
  onRetry: () => void;
  showForm: boolean;
  setShowForm: (updater: (s: boolean) => boolean) => void;
  form: TemplateForm;
  setForm: (form: TemplateForm) => void;
  submit: (e: React.FormEvent) => void;
  saving: boolean;
}

const TEMPLATE_TYPE_ITEMS = TEMPLATE_TYPES.map((t) => ({
  value: t,
  label: TEMPLATE_TYPE_LABEL[t],
}));

export function TemplatesView({
  data,
  loading,
  error,
  onRetry,
  showForm,
  setShowForm,
  form,
  setForm,
  submit,
  saving,
}: TemplatesViewProps) {
  if (loading)
    return (
      <div className="p-6">
        <Skeleton
          rows={3}
          wrapperClassName="space-y-4"
          itemClassName="skeleton-shimmer h-20 rounded-card"
        />
      </div>
    );

  if (error)
    return (
      <div className="p-6">
        <div className="rounded-card border border-danger bg-danger-subtle p-4 font-body text-sm text-danger-ink">
          {error}
          <Button intent="ghost" size="sm" onClick={onRetry} className="ml-4">
            Tentar novamente
          </Button>
        </div>
      </div>
    );

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">
            Templates de Certificado
          </h1>
          <p className="font-body text-sm text-ink-faint">{data.length} templates</p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Cancelar' : '+ Novo Template'}
        </Button>
      </div>

      {showForm && (
        <form
          onSubmit={submit}
          className="grid grid-cols-1 gap-4 rounded-card border border-border bg-surface p-6 shadow-resting md:grid-cols-2"
        >
          <FormField label="Nome *" htmlFor="template-name">
            <Input
              id="template-name"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </FormField>

          <FormField label="Tipo" htmlFor="template-type">
            <Select
              items={TEMPLATE_TYPE_ITEMS}
              value={form.type}
              onValueChange={(v) => setForm({ ...form, type: v })}
            />
          </FormField>

          <div className="md:col-span-2">
            <FormField label="Descrição" htmlFor="template-description">
              <Input
                id="template-description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </FormField>
          </div>

          <div className="md:col-span-2">
            <FormField
              label="HTML ({{recipientName}}, {{title}}, {{date}})"
              htmlFor="template-html"
            >
              <Textarea
                id="template-html"
                required
                value={form.html}
                onChange={(e) => setForm({ ...form, html: e.target.value })}
                className="font-data text-sm"
                rows={4}
              />
            </FormField>
          </div>

          <FormField label="Signatário" htmlFor="template-signatory-name">
            <Input
              id="template-signatory-name"
              value={form.signatoryName}
              onChange={(e) => setForm({ ...form, signatoryName: e.target.value })}
            />
          </FormField>

          <FormField label="Cargo do signatário" htmlFor="template-signatory-title">
            <Input
              id="template-signatory-title"
              value={form.signatoryTitle}
              onChange={(e) => setForm({ ...form, signatoryTitle: e.target.value })}
            />
          </FormField>

          <FormField label="Validade (dias)" htmlFor="template-validity-days">
            <Input
              id="template-validity-days"
              type="number"
              value={form.validityDays}
              onChange={(e) => setForm({ ...form, validityDays: e.target.value })}
            />
          </FormField>

          <label className="mt-6 flex items-center gap-2 font-body text-sm text-ink-muted">
            <input
              type="checkbox"
              checked={form.isDefault}
              onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
              className="rounded accent-primary"
            />
            Template por omissão para este tipo
          </label>

          <div className="md:col-span-2">
            <Button type="submit" disabled={saving} loading={saving}>
              {saving ? 'A guardar...' : 'Criar Template'}
            </Button>
          </div>
        </form>
      )}

      <div className="divide-y divide-border rounded-card border border-border bg-surface shadow-resting">
        {data.length === 0 ? (
          <p className="p-4 font-body text-sm text-ink-faint">Sem templates criados</p>
        ) : (
          data.map((t) => (
            <div key={t.id} className="flex items-center justify-between p-4">
              <div>
                <p className="flex items-center gap-2 font-body text-sm font-medium text-ink">
                  {t.name}
                  {t.isDefault && <Badge intent="info">Padrão</Badge>}
                </p>
                <p className="font-body text-xs text-ink-faint">
                  {TEMPLATE_TYPE_LABEL[t.type as (typeof TEMPLATE_TYPES)[number]] ??
                    t.type}
                  {t.validityDays ? ` · válido ${t.validityDays} dias` : ' · sem expiração'}
                  {' · '}
                  {t._count?.certificates ?? 0} emitidos
                </p>
              </div>
              <Badge intent={t.isActive ? 'success' : 'neutral'}>
                {t.isActive ? 'Activo' : 'Inactivo'}
              </Badge>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
