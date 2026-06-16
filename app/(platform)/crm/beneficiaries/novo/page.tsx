'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL ?? '/api';

function authHeaders(): Record<string, string> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

const PROVINCES = [
  'BENGO', 'BENGUELA', 'BIE', 'CABINDA', 'CUANDO_CUBANGO',
  'CUANZA_NORTE', 'CUANZA_SUL', 'CUNENE', 'HUAMBO', 'HUILA',
  'LUANDA', 'LUNDA_NORTE', 'LUNDA_SUL', 'MALANJE', 'MOXICO',
  'NAMIBE', 'UIGE', 'ZAIRE',
];

export default function NovoBeneficiarioPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    type: 'INDIVIDUAL',
    fullName: '',
    category: '',
    gender: '',
    birthDate: '',
    nationality: '',
    nif: '',
    email: '',
    phone: '',
    mobile: '',
    address: '',
    city: '',
    province: '',
    source: '',
    segment: '',
    notes: '',
    nextFollowUpAt: '',
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      // Remove campos vazios para não falhar validação dos enums/datas.
      const payload: any = { type: form.type, fullName: form.fullName };
      for (const [k, v] of Object.entries(form)) {
        if (k === 'type' || k === 'fullName') continue;
        if (v !== '' && v != null) payload[k] = v;
      }
      const res = await fetch(`${API}/crm/beneficiaries`, {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res
          .json()
          .catch(() => ({ message: 'Erro ao criar beneficiário' }));
        throw new Error(
          Array.isArray(err.message) ? err.message.join(', ') : err.message,
        );
      }
      const created = await res.json();
      router.push(`/crm/beneficiaries/${created.id}`);
    } catch (e: any) {
      setError(e.message || 'Erro inesperado');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl">
      <button
        onClick={() => router.push('/crm/beneficiaries')}
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
            onChange={(e) => set('type', e.target.value)}
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
            onChange={(e) => set('fullName', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Categoria">
          <input
            value={form.category}
            onChange={(e) => set('category', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Género">
          <select
            value={form.gender}
            onChange={(e) => set('gender', e.target.value)}
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
            onChange={(e) => set('birthDate', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Nacionalidade">
          <input
            value={form.nationality}
            onChange={(e) => set('nationality', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="NIF">
          <input
            value={form.nif}
            onChange={(e) => set('nif', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Email">
          <input
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Telefone">
          <input
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Telemóvel">
          <input
            value={form.mobile}
            onChange={(e) => set('mobile', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Província">
          <select
            value={form.province}
            onChange={(e) => set('province', e.target.value)}
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
            onChange={(e) => set('city', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Morada">
          <input
            value={form.address}
            onChange={(e) => set('address', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Origem">
          <input
            value={form.source}
            onChange={(e) => set('source', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Segmento">
          <input
            value={form.segment}
            onChange={(e) => set('segment', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Próximo follow-up">
          <input
            type="date"
            value={form.nextFollowUpAt}
            onChange={(e) => set('nextFollowUpAt', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <div className="md:col-span-2">
          <Field label="Notas">
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
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
            onClick={() => router.push('/crm/beneficiaries')}
            className="px-6 py-2 border rounded-lg"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-xs text-gray-500 uppercase">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
