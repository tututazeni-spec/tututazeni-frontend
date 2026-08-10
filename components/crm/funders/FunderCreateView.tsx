// components/crm/funders/FunderCreateView.tsx

import { Field } from '@/components/crm/shared';
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
        className="text-sm text-blue-600 hover:underline mb-2"
      >
        ← Voltar à lista
      </button>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Novo Financiador
      </h1>

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
            {Object.entries(TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
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

        <Field label="Categoria">
          <input
            value={form.category}
            onChange={(e) => setField('category', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
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

        <Field label="País">
          <input
            value={form.country}
            onChange={(e) => setField('country', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Região">
          <input
            value={form.region}
            onChange={(e) => setField('region', e.target.value)}
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

        <Field label="Moeda">
          <input
            value={form.currency}
            onChange={(e) => setField('currency', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Início da relação">
          <input
            type="date"
            value={form.relationshipStart}
            onChange={(e) => setField('relationshipStart', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Próximo relatório">
          <input
            type="date"
            value={form.nextReportDue}
            onChange={(e) => setField('nextReportDue', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <div className="md:col-span-2">
          <Field label="Requisitos de reporte">
            <input
              value={form.reportingReqs}
              onChange={(e) => setField('reportingReqs', e.target.value)}
              className="border rounded-lg px-3 py-2 w-full"
            />
          </Field>
        </div>

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
            {saving ? 'A guardar...' : 'Criar Financiador'}
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
