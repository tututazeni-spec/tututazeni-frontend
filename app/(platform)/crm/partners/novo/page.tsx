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

const TYPES = [
  'TECHNOLOGY', 'CONTENT', 'TRAINING', 'FUNDING', 'INSTITUTIONAL',
  'COMMERCIAL', 'MEDIA', 'GOVERNMENT', 'OTHER',
];

export default function NovoParceiroPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    type: 'TECHNOLOGY',
    name: '',
    legalName: '',
    tier: 'STANDARD',
    contactName: '',
    contactTitle: '',
    email: '',
    phone: '',
    mobile: '',
    website: '',
    linkedin: '',
    nif: '',
    address: '',
    city: '',
    province: '',
    annualValue: '',
    currency: 'AOA',
    revenueSharing: '',
    contractStart: '',
    contractEnd: '',
    notes: '',
    nextReviewAt: '',
  });

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  const NUMERIC = new Set(['annualValue', 'revenueSharing']);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload: any = { type: form.type, name: form.name };
      for (const [k, v] of Object.entries(form)) {
        if (k === 'type' || k === 'name') continue;
        if (v === '' || v == null) continue;
        payload[k] = NUMERIC.has(k) ? Number(v) : v;
      }
      const res = await fetch(`${API}/crm/partners`, {
        method: 'POST',
        credentials: 'include',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res
          .json()
          .catch(() => ({ message: 'Erro ao criar parceiro' }));
        throw new Error(
          Array.isArray(err.message) ? err.message.join(', ') : err.message,
        );
      }
      const created = await res.json();
      router.push(`/crm/partners/${created.id}`);
    } catch (e: any) {
      setError(e.message || 'Erro inesperado');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-6 max-w-3xl">
      <button
        onClick={() => router.push('/crm/partners')}
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
            onChange={(e) => set('type', e.target.value)}
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

        <Field label="Nível">
          <select
            value={form.tier}
            onChange={(e) => set('tier', e.target.value)}
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

        <Field label="LinkedIn">
          <input
            value={form.linkedin}
            onChange={(e) => set('linkedin', e.target.value)}
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

        <Field label="Cidade">
          <input
            value={form.city}
            onChange={(e) => set('city', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Província">
          <input
            value={form.province}
            onChange={(e) => set('province', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Valor anual (AOA)">
          <input
            type="number"
            min={0}
            value={form.annualValue}
            onChange={(e) => set('annualValue', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Partilha de receita (%)">
          <input
            type="number"
            min={0}
            max={100}
            value={form.revenueSharing}
            onChange={(e) => set('revenueSharing', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Início do contrato">
          <input
            type="date"
            value={form.contractStart}
            onChange={(e) => set('contractStart', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Fim do contrato">
          <input
            type="date"
            value={form.contractEnd}
            onChange={(e) => set('contractEnd', e.target.value)}
            className="border rounded-lg px-3 py-2 w-full"
          />
        </Field>

        <Field label="Próxima revisão">
          <input
            type="date"
            value={form.nextReviewAt}
            onChange={(e) => set('nextReviewAt', e.target.value)}
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
            {saving ? 'A guardar...' : 'Criar Parceiro'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/crm/partners')}
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
