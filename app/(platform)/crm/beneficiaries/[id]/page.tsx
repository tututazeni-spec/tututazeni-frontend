'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApiQuery, useOptimisticMutation } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';

interface Interaction {
  id: string;
  type: string;
  subject: string;
  description: string;
  date: string;
  outcome: string | null;
  satisfaction: number | null;
  user?: { fullName: string } | null;
  /** Marcador local enquanto a API não confirma (optimistic UI). */
  _optimistic?: boolean;
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

interface InteractionForm {
  type: string;
  subject: string;
  description: string;
  outcome: string;
  satisfaction: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-blue-100 text-blue-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
};

const EMPTY_FORM: InteractionForm = {
  type: 'CALL',
  subject: '',
  description: '',
  outcome: '',
  satisfaction: '',
};

export default function BeneficiaryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<InteractionForm>(EMPTY_FORM);

  // GET com cache + cancelamento automático ao desmontar/mudar id.
  const {
    data: b,
    isLoading,
    isError,
    error,
  } = useApiQuery<BeneficiaryDetail>(
    queryKeys.beneficiaries.detail(id),
    `/crm/beneficiaries/${id}`,
    { enabled: !!id, staleTime: STALE_TIME.DYNAMIC },
  );

  // Optimistic UI: a nova interacção aparece na lista antes de a API responder;
  // em erro faz rollback automático e re-sincroniza no fim.
  const addInteraction = useOptimisticMutation<BeneficiaryDetail, InteractionForm>({
    key: queryKeys.beneficiaries.detail(id),
    mutationFn: (f) => {
      const payload = {
        type: f.type,
        subject: f.subject,
        description: f.description,
        ...(f.outcome && { outcome: f.outcome }),
        ...(f.satisfaction && { satisfaction: Number(f.satisfaction) }),
      };
      return apiClient.post<BeneficiaryDetail>(
        `/crm/beneficiaries/${id}/interactions`,
        payload,
      );
    },
    applyOptimistic: (prev, f) => {
      if (!prev) return prev;
      const optimistic: Interaction = {
        id: `optimistic-${Date.now()}`,
        type: f.type,
        subject: f.subject,
        description: f.description,
        date: new Date().toISOString(),
        outcome: f.outcome || null,
        satisfaction: f.satisfaction ? Number(f.satisfaction) : null,
        user: null,
        _optimistic: true,
      };
      return { ...prev, interactions: [optimistic, ...prev.interactions] };
    },
    onError: (err) => {
      alert(err.message || 'Erro ao guardar interacção');
    },
  });

  function submitInteraction(e: React.FormEvent) {
    e.preventDefault();
    // UI optimista: fecha o form e limpa de imediato; a entrada já aparece na lista.
    addInteraction.mutate(form);
    setShowForm(false);
    setForm(EMPTY_FORM);
  }

  if (isLoading)
    return (
      <div className="p-6 space-y-4">
        <div className="h-24 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );

  if (isError || !b)
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error?.message || 'Beneficiário não encontrado'}
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
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Guardar Interacção
            </button>
          </form>
        )}

        <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
          {b.interactions.length === 0 ? (
            <p className="p-4 text-gray-400">Sem interacções registadas</p>
          ) : (
            b.interactions.map((it) => (
              <div
                key={it.id}
                className={`p-4 ${it._optimistic ? 'opacity-60' : ''}`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded mr-2">
                      {it.type}
                    </span>
                    {it.subject}
                  </span>
                  <span className="text-xs text-gray-400">
                    {it._optimistic ? 'A guardar…' : formatDate(it.date)}
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
