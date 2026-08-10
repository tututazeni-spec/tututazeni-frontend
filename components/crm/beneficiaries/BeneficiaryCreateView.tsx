// components/crm/beneficiaries/BeneficiaryCreateView.tsx

import { Field } from '@/components/crm/shared';
import { PROVINCES } from './types';

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
        className="text-sm text-blue-600 hover:underline mb-2"
      >
        ← Voltar à lista
      </button>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Novo Beneficiário
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
            <option value="INDIVIDUAL">Individual</option>
            <option value="FAMILY">Família</option>
            <option value="INSTITUTION">Instituição</option>
            <option value="COMMUNITY">Comunidade</option>
            <option value="GROUP">Grupo</option>
          </select>
        </Field>

        <Field label="Nome completo *">
          <input
            required
            value={form.fullName}
            onChange={(e) => setField('fullName', e.target.value)}
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

        <Field label="Género">
          <select
            value={form.gender}
            onChange={(e) => setField('gender', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          >
            <option value="">—</option>
            <option value="MALE">Masculino</option>
            <option value="FEMALE">Feminino</option>
            <option value="NON_BINARY">Não-binário</option>
            <option value="PREFER_NOT_TO_SAY">Prefere não dizer</option>
          </select>
        </Field>

        <Field label="Data de nascimento">
          <input
            type="date"
            value={form.birthDate}
            onChange={(e) => setField('birthDate', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Nacionalidade">
          <input
            value={form.nationality}
            onChange={(e) => setField('nationality', e.target.value)}
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

        <Field label="Província">
          <select
            value={form.province}
            onChange={(e) => setField('province', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          >
            <option value="">—</option>
            {PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Cidade">
          <input
            value={form.city}
            onChange={(e) => setField('city', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Morada">
          <input
            value={form.address}
            onChange={(e) => setField('address', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Origem">
          <input
            value={form.source}
            onChange={(e) => setField('source', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Segmento">
          <input
            value={form.segment}
            onChange={(e) => setField('segment', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Próximo follow-up">
          <input
            type="date"
            value={form.nextFollowUpAt}
            onChange={(e) => setField('nextFollowUpAt', e.target.value)}
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
            {saving ? 'A guardar...' : 'Criar Beneficiário'}
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
