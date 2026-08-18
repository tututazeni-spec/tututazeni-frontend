// components/crm/funders/FunderCreateView.tsx

import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Combobox } from '@/components/ui/Combobox';
import { Textarea } from '@/components/ui/Textarea';
import { Field } from '@/components/crm/shared';
import { COUNTRY_OPTIONS } from '@/lib/countries';
import { TYPE_LABELS } from './types';

interface FunderForm {
  type: string;
  name: string;
  legalName: string;
  category: string;
  contactName: string;
  contactTitle: string;
  email: string;
  phone: string;
  mobile: string;
  website: string;
  country: string;
  region: string;
  nif: string;
  currency: string;
  reportingReqs: string;
  relationshipStart: string;
  notes: string;
  nextReportDue: string;
}

interface FunderCreateViewProps {
  form: FunderForm;
  setField: <K extends keyof FunderForm>(key: K, value: FunderForm[K]) => void;
  error: string;
  saving: boolean;
  submit: (e?: { preventDefault?: () => void }) => void;
  onCancel: () => void;
}

export function FunderCreateView({
  form,
  setField,
  error,
  saving,
  submit,
  onCancel,
}: FunderCreateViewProps) {
  return (
    <div className="p-6 max-w-3xl">
      <button
        onClick={onCancel}
        className="font-body text-sm text-primary hover:underline mb-2"
      >
        ← Voltar à lista
      </button>
      <h1 className="font-display text-2xl font-bold text-ink mb-6">
        Novo Financiador
      </h1>

      {error && (
        <div className="rounded-card border border-danger bg-danger-subtle p-3 mb-4 text-danger-ink font-body">
          {error}
        </div>
      )}

      <Card>
        <CardBody>
          <form
            onSubmit={submit}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <Field label="Tipo *">
              <Select
                value={form.type}
                onValueChange={(value) => setField('type', value)}
                items={Object.entries(TYPE_LABELS).map(([v, l]) => ({
                  value: v,
                  label: l,
                }))}
              />
            </Field>

            <Field label="Nome *">
              <Input
                required
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
              />
            </Field>

            <Field label="Nome legal">
              <Input
                value={form.legalName}
                onChange={(e) => setField('legalName', e.target.value)}
              />
            </Field>

            <Field label="Categoria">
              <Input
                value={form.category}
                onChange={(e) => setField('category', e.target.value)}
              />
            </Field>

            <Field label="Contacto">
              <Input
                value={form.contactName}
                onChange={(e) => setField('contactName', e.target.value)}
              />
            </Field>

            <Field label="Cargo do contacto">
              <Input
                value={form.contactTitle}
                onChange={(e) => setField('contactTitle', e.target.value)}
              />
            </Field>

            <Field label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setField('email', e.target.value)}
              />
            </Field>

            <Field label="Telefone">
              <Input
                value={form.phone}
                onChange={(e) => setField('phone', e.target.value)}
              />
            </Field>

            <Field label="Telemóvel">
              <Input
                value={form.mobile}
                onChange={(e) => setField('mobile', e.target.value)}
              />
            </Field>

            <Field label="Website">
              <Input
                value={form.website}
                onChange={(e) => setField('website', e.target.value)}
              />
            </Field>

            <Field label="País">
              <Combobox
                value={form.country}
                onValueChange={(value) => setField('country', value)}
                placeholder="Selecionar país…"
                searchPlaceholder="Escreva a inicial do país…"
                items={COUNTRY_OPTIONS}
              />
            </Field>

            <Field label="Região">
              <Input
                value={form.region}
                onChange={(e) => setField('region', e.target.value)}
              />
            </Field>

            <Field label="NIF">
              <Input
                value={form.nif}
                onChange={(e) => setField('nif', e.target.value)}
              />
            </Field>

            <Field label="Moeda">
              <Input
                value={form.currency}
                onChange={(e) => setField('currency', e.target.value)}
              />
            </Field>

            <Field label="Início da relação">
              <Input
                type="date"
                value={form.relationshipStart}
                onChange={(e) => setField('relationshipStart', e.target.value)}
              />
            </Field>

            <Field label="Próximo relatório">
              <Input
                type="date"
                value={form.nextReportDue}
                onChange={(e) => setField('nextReportDue', e.target.value)}
              />
            </Field>

            <div className="md:col-span-2">
              <Field label="Requisitos de reporte">
                <Input
                  value={form.reportingReqs}
                  onChange={(e) => setField('reportingReqs', e.target.value)}
                />
              </Field>
            </div>

            <div className="md:col-span-2">
              <Field label="Notas">
                <Textarea
                  value={form.notes}
                  onChange={(e) => setField('notes', e.target.value)}
                  rows={3}
                />
              </Field>
            </div>

            <div className="md:col-span-2 flex gap-3">
              <Button type="submit" disabled={saving}>
                {saving ? 'A guardar...' : 'Criar Financiador'}
              </Button>
              <Button type="button" onClick={onCancel} intent="secondary">
                Cancelar
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
