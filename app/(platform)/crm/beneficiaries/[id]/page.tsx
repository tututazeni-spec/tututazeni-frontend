'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL ?? '/api';

function authHeaders(): Record<string, string> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

interface Interaction {
  id: string;
  type: string;
  subject: string;
  description: string;
  date: string;
  outcome: string | null;
  satisfaction: number | null;
  user?: { fullName: string } | null;
}

interface BeneficiaryDocument {
  id: string;
  name: string;
  type: string;
  fileUrl: string;
  isVerified: boolean;
  createdAt: string;
}

interface Need {
  id: string;
  category: string;
  description: string;
  priority: string;
  status: string;
}

interface BeneficiaryDetail {
  id: string;
  code: string;
  fullName: string;
  type: string;
  status: string;
  category: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  province: string | null;
  city: string | null;
  address: string | null;
  nif: string | null;
  satisfactionAvg: number;
  lastContactAt: string | null;
  nextFollowUpAt: string | null;
  notes: string | null;
  createdBy?: { fullName: string } | null;
  assignedTo?: { fullName: string; email: string } | null;
  interactions: Interaction[];
  documents: BeneficiaryDocument[];
  needs: Need[];
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
};

export default function BeneficiaryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [b, setB] = useState<BeneficiaryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Formulário de nova interacção
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    type: 'CALL',
    subject: '',
    description: '',
    outcome: '',
    satisfaction: '',
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API}/crm/beneficiaries/${id}`, {
        credentials: 'include',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Erro ao carregar beneficiário');
      setB(await res.json());
    } catch (e: any) {
      setError(e.message || 'Erro inesperado');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchData();
  }, [id, fetchData]);

  async function submitInteraction(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: any = {
        type: form.type,
        subject: form.subject,
        description: form.description,
        ...(form.outcome && { outcome: form.outcome }),
        ...(form.satisfaction && { satisfaction: Number(form.satisfaction) }),
      };
      const res = await fetch(
        `${API}/crm/beneficiaries/${id}/interactions`,
        {
          method: 'POST',
          credentials: 'include',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        },
      );
      if (!res.ok) throw new Error('Erro ao guardar interacção');
      setShowForm(false);
      setForm({
        type: 'CALL',
        subject: '',
        description: '',
        outcome: '',
        satisfaction: '',
      });
      await fetchData();
    } catch (e: any) {
      alert(e.message || 'Erro inesperado');
    } finally {
      setSaving(false);
    }
  }

  if (loading)
    return (
      <div className="p-6 space-y-4">
        <div className="h-24 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );

  if (error || !b)
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error || 'Beneficiário não encontrado'}
          <button onClick={() => router.back()} className="ml-4 underline">
            Voltar
          </button>
        </div>
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <button
            onClick={() => router.push('/crm/beneficiaries')}
            className="text-sm text-blue-600 hover:underline mb-2"
          >
            ← Voltar à lista
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{b.fullName}</h1>
          <p className="text-gray-500 font-mono">{b.code}</p>
        </div>
        <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
          {b.status}
        </span>
      </div>

      {/* Dados gerais */}
      <div className="bg-white rounded-lg shadow p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Info label="Tipo" value={b.type} />
        <Info label="Categoria" value={b.category} />
        <Info label="NIF" value={b.nif} />
        <Info label="Email" value={b.email} />
        <Info label="Telefone" value={b.phone} />
        <Info label="Telemóvel" value={b.mobile} />
        <Info label="Província" value={b.province} />
        <Info label="Cidade" value={b.city} />
        <Info label="Morada" value={b.address} />
        <Info
          label="Satisfação média"
          value={b.satisfactionAvg ? b.satisfactionAvg.toFixed(1) : '—'}
        />
        <Info
          label="Último contacto"
          value={b.lastContactAt ? formatDate(b.lastContactAt) : '—'}
        />
        <Info
          label="Próximo follow-up"
          value={b.nextFollowUpAt ? formatDate(b.nextFollowUpAt) : '—'}
        />
        <Info label="Responsável" value={b.assignedTo?.fullName} />
        <Info label="Criado por" value={b.createdBy?.fullName} />
      </div>

      {/* Necessidades */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Necessidades ({b.needs.length})
        </h2>
        <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
          {b.needs.length === 0 ? (
            <p className="p-4 text-gray-400">Sem necessidades registadas</p>
          ) : (
            b.needs.map((n) => (
              <div key={n.id} className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{n.category}</p>
                  <p className="text-sm text-gray-500">{n.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      PRIORITY_COLORS[n.priority] ?? 'bg-gray-100'
                    }`}
                  >
                    {n.priority}
                  </span>
                  <span className="text-xs text-gray-500">{n.status}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Documentos */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Documentos ({b.documents.length})
        </h2>
        <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
          {b.documents.length === 0 ? (
            <p className="p-4 text-gray-400">Sem documentos</p>
          ) : (
            b.documents.map((d) => (
              <div key={d.id} className="p-4 flex justify-between items-center">
                <div>
                  <a
                    href={d.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="font-medium text-blue-600 hover:underline"
                  >
                    {d.name}
                  </a>
                  <p className="text-sm text-gray-500">{d.type}</p>
                </div>
                <span
                  className={`text-xs font-medium ${
                    d.isVerified ? 'text-green-600' : 'text-gray-400'
                  }`}
                >
                  {d.isVerified ? '✓ Verificado' : 'Por verificar'}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Interacções */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Interacções ({b.interactions.length})
          </h2>
          <button
            onClick={() => setShowForm((s) => !s)}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700"
          >
            {showForm ? 'Cancelar' : '+ Nova Interacção'}
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={submitInteraction}
            className="bg-white rounded-lg shadow p-4 mb-4 space-y-3"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="border rounded-lg px-3 py-2"
              >
                <option value="CALL">Chamada</option>
                <option value="EMAIL">Email</option>
                <option value="MEETING">Reunião</option>
                <option value="VISIT">Visita</option>
                <option value="EVENT">Evento</option>
                <option value="NOTE">Nota</option>
                <option value="TASK">Tarefa</option>
              </select>
              <input
                type="number"
                min={1}
                max={5}
                placeholder="Satisfação (1-5)"
                value={form.satisfaction}
                onChange={(e) =>
                  setForm({ ...form, satisfaction: e.target.value })
                }
                className="border rounded-lg px-3 py-2"
              />
            </div>
            <input
              required
              placeholder="Assunto"
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="border rounded-lg px-3 py-2 w-full"
            />
            <textarea
              required
              placeholder="Descrição"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="border rounded-lg px-3 py-2 w-full"
              rows={3}
            />
            <input
              placeholder="Resultado (opcional)"
              value={form.outcome}
              onChange={(e) => setForm({ ...form, outcome: e.target.value })}
              className="border rounded-lg px-3 py-2 w-full"
            />
            <button
              type="submit"
              disabled={saving}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'A guardar...' : 'Guardar Interacção'}
            </button>
          </form>
        )}

        <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
          {b.interactions.length === 0 ? (
            <p className="p-4 text-gray-400">Sem interacções registadas</p>
          ) : (
            b.interactions.map((it) => (
              <div key={it.id} className="p-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded mr-2">
                      {it.type}
                    </span>
                    {it.subject}
                  </span>
                  <span className="text-xs text-gray-400">
                    {formatDate(it.date)}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{it.description}</p>
                <div className="flex gap-4 mt-1 text-xs text-gray-400">
                  {it.user?.fullName && <span>Por: {it.user.fullName}</span>}
                  {it.outcome && <span>Resultado: {it.outcome}</span>}
                  {it.satisfaction != null && (
                    <span>Satisfação: {it.satisfaction}/5</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase">{label}</p>
      <p className="text-sm text-gray-800">{value || '—'}</p>
    </div>
  );
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}
