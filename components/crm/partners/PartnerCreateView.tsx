// components/crm/partners/PartnerCreateView.tsx

import { Field } from '@/components/crm/shared';
import { TYPES } from './types';

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
        className="text-sm text-blue-600 hover:underline mb-2"
      >
        ← Voltar à lista
      </button>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Novo Parceiro</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <form
        onSubmit={submit}
        className="bg-white rounded-lg shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <Field label="Tipo *">
          <select
            value={form.type}
            onChange={(e) => setField('type', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Nome *">
          <input
            required
            value={form.name}
            onChange={(e) => setField('name', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Nome legal">
          <input
            value={form.legalName}
            onChange={(e) => setField('legalName', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Nível">
          <select
            value={form.tier}
            onChange={(e) => setField('tier', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          >
            <option value="PLATINUM">Platinum</option>
            <option value="GOLD">Gold</option>
            <option value="SILVER">Silver</option>
            <option value="STANDARD">Standard</option>
          </select>
        </Field>

        <Field label="Contacto">
          <input
            value={form.contactName}
            onChange={(e) => setField('contactName', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Cargo do contacto">
          <input
            value={form.contactTitle}
            onChange={(e) => setField('contactTitle', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Email">
          <input
            type="email"
            value={form.email}
            onChange={(e) => setField('email', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Telefone">
          <input
            value={form.phone}
            onChange={(e) => setField('phone', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Telemóvel">
          <input
            value={form.mobile}
            onChange={(e) => setField('mobile', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Website">
          <input
            value={form.website}
            onChange={(e) => setField('website', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="LinkedIn">
          <input
            value={form.linkedin}
            onChange={(e) => setField('linkedin', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="NIF">
          <input
            value={form.nif}
            onChange={(e) => setField('nif', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Cidade">
          <input
            value={form.city}
            onChange={(e) => setField('city', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Província">
          <input
            value={form.province}
            onChange={(e) => setField('province', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Valor anual (AOA)">
          <input
            type="number"
            min={0}
            value={form.annualValue}
            onChange={(e) => setField('annualValue', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Partilha de receita (%)">
          <input
            type="number"
            min={0}
            max={100}
            value={form.revenueSharing}
            onChange={(e) => setField('revenueSharing', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Início do contrato">
          <input
            type="date"
            value={form.contractStart}
            onChange={(e) => setField('contractStart', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Fim do contrato">
          <input
            type="date"
            value={form.contractEnd}
            onChange={(e) => setField('contractEnd', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Próxima revisão">
          <input
            type="date"
            value={form.nextReviewAt}
            onChange={(e) => setField('nextReviewAt', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <div className="md:col-span-2">
          <Field label="Notas">
            <textarea
              value={form.notes}
              onChange={(e) => setField('notes', e.target.value)}
              className="border rounded-lg px-3 py-2 w-full"
              rows={3}
            />
          </Field>
        </div>

        <div className="md:col-span-2 flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'A guardar...' : 'Criar Parceiro'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 border rounded-lg"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
