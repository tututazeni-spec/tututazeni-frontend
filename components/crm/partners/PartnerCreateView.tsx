// components/crm/partners/PartnerCreateView.tsx

import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Field } from '@/components/crm/shared';
import { TYPE_LABELS, PROVINCES } from './types';

interface PartnerForm {
  type: string;
  name: string;
  legalName: string;
  tier: string;
  contactName: string;
  contactTitle: string;
  email: string;
  phone: string;
  mobile: string;
  website: string;
  linkedin: string;
  nif: string;
  address: string;
  city: string;
  province: string;
  annualValue: string;
  currency: string;
  revenueSharing: string;
  contractStart: string;
  contractEnd: string;
  notes: string;
  nextReviewAt: string;
}

interface PartnerCreateViewProps {
  form: PartnerForm;
  setField: <K extends keyof PartnerForm>(
    key: K,
    value: PartnerForm[K],
  ) => void;
  error: string;
  saving: boolean;
  submit: (e?: { preventDefault?: () => void }) => void;
  onCancel: () => void;
}

export function PartnerCreateView({
  form,
  setField,
  error,
  saving,
  submit,
  onCancel,
}: PartnerCreateViewProps) {
  return (
    <div className="p-6 max-w-3xl">
      <button
        onClick={onCancel}
        className="font-body text-sm text-primary hover:underline mb-2"
      >
        ← Voltar à lista
      </button>
      <h1 className="font-display text-2xl font-bold text-ink mb-6">
        Novo Parceiro
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

            <Field label="Nível">
              <Select
                value={form.tier}
                onValueChange={(value) => setField('tier', value)}
                items={[
                  { value: 'PLATINUM', label: 'Platinum' },
                  { value: 'GOLD', label: 'Gold' },
                  { value: 'SILVER', label: 'Silver' },
                  { value: 'STANDARD', label: 'Standard' },
                ]}
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

            <Field label="LinkedIn">
              <Input
                value={form.linkedin}
                onChange={(e) => setField('linkedin', e.target.value)}
              />
            </Field>

            <Field label="NIF">
              <Input
                value={form.nif}
                onChange={(e) => setField('nif', e.target.value)}
              />
            </Field>

            <Field label="Cidade">
              <Input
                value={form.city}
                onChange={(e) => setField('city', e.target.value)}
              />
            </Field>

            <Field label="Província">
              <Select
                value={form.province}
                onValueChange={(value) => setField('province', value)}
                items={[
                  { value: '', label: '—' },
                  ...PROVINCES.map((p) => ({
                    value: p,
                    label: p.replace(/_/g, ' '),
                  })),
                ]}
              />
            </Field>

            <Field label="Valor anual (AOA)">
              <Input
                type="number"
                min={0}
                value={form.annualValue}
                onChange={(e) => setField('annualValue', e.target.value)}
              />
            </Field>

            <Field label="Partilha de receita (%)">
              <Input
                type="number"
                min={0}
                max={100}
                value={form.revenueSharing}
                onChange={(e) => setField('revenueSharing', e.target.value)}
              />
            </Field>

            <Field label="Início do contrato">
              <Input
                type="date"
                value={form.contractStart}
                onChange={(e) => setField('contractStart', e.target.value)}
              />
            </Field>

            <Field label="Fim do contrato">
              <Input
                type="date"
                value={form.contractEnd}
                onChange={(e) => setField('contractEnd', e.target.value)}
              />
            </Field>

            <Field label="Próxima revisão">
              <Input
                type="date"
                value={form.nextReviewAt}
                onChange={(e) => setField('nextReviewAt', e.target.value)}
              />
            </Field>

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
                {saving ? 'A guardar...' : 'Criar Parceiro'}
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
