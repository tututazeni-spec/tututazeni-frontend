// components/crm/beneficiaries/BeneficiaryCreateView.tsx

import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Combobox } from '@/components/ui/Combobox';
import { Textarea } from '@/components/ui/Textarea';
import { Field } from '@/components/crm/shared';
import { PROVINCES } from './types';
import { COUNTRY_OPTIONS } from '@/lib/countries';

interface BeneficiaryForm {
  type: string;
  fullName: string;
  category: string;
  gender: string;
  birthDate: string;
  nationality: string;
  nif: string;
  email: string;
  phone: string;
  mobile: string;
  address: string;
  city: string;
  province: string;
  source: string;
  segment: string;
  notes: string;
  nextFollowUpAt: string;
}

interface BeneficiaryCreateViewProps {
  form: BeneficiaryForm;
  setField: <K extends keyof BeneficiaryForm>(
    key: K,
    value: BeneficiaryForm[K],
  ) => void;
  error: string;
  saving: boolean;
  submit: (e?: { preventDefault?: () => void }) => void;
  onCancel: () => void;
}

export function BeneficiaryCreateView({
  form,
  setField,
  error,
  saving,
  submit,
  onCancel,
}: BeneficiaryCreateViewProps) {
  return (
    <div className="p-6 max-w-3xl">
      <button
        onClick={onCancel}
        className="font-body text-sm text-primary hover:underline mb-2"
      >
        ← Voltar à lista
      </button>
      <h1 className="font-display text-2xl font-bold text-ink mb-6">
        Novo Beneficiário
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
                items={[
                  { value: 'INDIVIDUAL', label: 'Individual' },
                  { value: 'FAMILY', label: 'Família' },
                  { value: 'INSTITUTION', label: 'Instituição' },
                  { value: 'COMMUNITY', label: 'Comunidade' },
                  { value: 'GROUP', label: 'Grupo' },
                ]}
              />
            </Field>

            <Field label="Nome completo *">
              <Input
                required
                value={form.fullName}
                onChange={(e) => setField('fullName', e.target.value)}
              />
            </Field>

            <Field label="Categoria">
              <Input
                value={form.category}
                onChange={(e) => setField('category', e.target.value)}
              />
            </Field>

            <Field label="Género">
              <Select
                value={form.gender}
                onValueChange={(value) => setField('gender', value)}
                items={[
                  { value: '', label: '—' },
                  { value: 'MALE', label: 'Masculino' },
                  { value: 'FEMALE', label: 'Feminino' },
                  { value: 'NON_BINARY', label: 'Não-binário' },
                  { value: 'PREFER_NOT_TO_SAY', label: 'Prefere não dizer' },
                ]}
              />
            </Field>

            <Field label="Data de nascimento">
              <Input
                type="date"
                value={form.birthDate}
                onChange={(e) => setField('birthDate', e.target.value)}
              />
            </Field>

            <Field label="Nacionalidade">
              <Combobox
                value={form.nationality}
                onValueChange={(value) => setField('nationality', value)}
                placeholder="Selecionar país…"
                searchPlaceholder="Escreva a inicial do país…"
                items={COUNTRY_OPTIONS}
              />
            </Field>

            <Field label="NIF">
              <Input
                value={form.nif}
                onChange={(e) => setField('nif', e.target.value)}
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

            <Field label="Cidade">
              <Input
                value={form.city}
                onChange={(e) => setField('city', e.target.value)}
              />
            </Field>

            <Field label="Morada">
              <Input
                value={form.address}
                onChange={(e) => setField('address', e.target.value)}
              />
            </Field>

            <Field label="Origem">
              <Input
                value={form.source}
                onChange={(e) => setField('source', e.target.value)}
              />
            </Field>

            <Field label="Segmento">
              <Input
                value={form.segment}
                onChange={(e) => setField('segment', e.target.value)}
              />
            </Field>

            <Field label="Próximo follow-up">
              <Input
                type="date"
                value={form.nextFollowUpAt}
                onChange={(e) => setField('nextFollowUpAt', e.target.value)}
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
                {saving ? 'A guardar...' : 'Criar Beneficiário'}
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
