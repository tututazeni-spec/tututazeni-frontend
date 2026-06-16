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

const TYPES: Record<string, string> = {
  GOVERNMENT: 'Governo',
  BILATERAL: 'Bilateral',
  MULTILATERAL: 'Multilateral',
  NGO: 'ONG',
  PRIVATE_FOUNDATION: 'Fundação Privada',
  CORPORATE: 'Empresa',
  OTHER: 'Outro',
};

export default function NovoFinanciadorPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    type: 'BILATERAL',
    name: '',
    legalName: '',
    category: '',
    contactName: '',
    contactTitle: '',
    email: '',
    phone: '',
    mobile: '',
    website: '',
    country: '',
    region: '',
    nif: '',
    currency: 'AOA',
    reportingReqs: '',
    relationshipStart: '',
    notes: '',
    nextReportDue: '',
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload: any = { type: form.type, name: form.name };
      for (const [k, v] of Object.entries(form)) {
        if (k === 'type' || k === 'name') continue;
        if (v !== '' && v != null) payload[k] = v;
      }
      const res = await fetch(`${API}/crm/funders`, {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res
          .json()
          .catch(() => ({ message: 'Erro ao criar financiador' }));
        throw new Error(
          Array.isArray(err.message) ? err.message.join(', ') : err.message,
        );
      }
      const created = await res.json();
      router.push(`/crm/funders/${created.id}`);
    } catch (e: any) {
      setError(e.message || 'Erro inesperado');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl">
      <button
        onClick={() => router.push('/crm/funders')}
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
            onChange={(e) => set('type', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          >
            {Object.entries(TYPES).map(([v, l]) => (
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
            onChange={(e) => set('name', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Nome legal">
          <input
            value={form.legalName}
            onChange={(e) => set('legalName', e.target.value)}
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

        <Field label="Contacto">
          <input
            value={form.contactName}
            onChange={(e) => set('contactName', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Cargo do contacto">
          <input
            value={form.contactTitle}
            onChange={(e) => set('contactTitle', e.target.value)}
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

        <Field label="Website">
          <input
            value={form.website}
            onChange={(e) => set('website', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="País">
          <input
            value={form.country}
            onChange={(e) => set('country', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Região">
          <input
            value={form.region}
            onChange={(e) => set('region', e.target.value)}
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

        <Field label="Moeda">
          <input
            value={form.currency}
            onChange={(e) => set('currency', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Início da relação">
          <input
            type="date"
            value={form.relationshipStart}
            onChange={(e) => set('relationshipStart', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Próximo relatório">
          <input
            type="date"
            value={form.nextReportDue}
            onChange={(e) => set('nextReportDue', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <div className="md:col-span-2">
          <Field label="Requisitos de reporte">
            <input
              value={form.reportingReqs}
              onChange={(e) => set('reportingReqs', e.target.value)}
              className="border rounded-lg px-3 py-2 w-full"
            />
          </Field>
        </div>

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
            {saving ? 'A guardar...' : 'Criar Financiador'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/crm/funders')}
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
