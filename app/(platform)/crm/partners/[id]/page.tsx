'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApiQuery, useApiMutation } from '@/hooks/useApiQuery';
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
}

interface Milestone {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  completedAt: string | null;
  status: string;
  value: number | null;
  currency: string;
  priority: string;
  createdBy?: { fullName: string } | null;
}

interface PartnerDetail {
  id: string;
  code: string;
  name: string;
  legalName: string | null;
  type: string;
  tier: string;
  status: string;
  contactName: string | null;
  contactTitle: string | null;
  email: string | null;
  phone: string | null;
  mobile: string | null;
  website: string | null;
  nif: string | null;
  city: string | null;
  province: string | null;
  annualValue: number | null;
  currency: string;
  revenueSharing: number | null;
  satisfactionAvg: number;
  contractStart: string | null;
  contractEnd: string | null;
  contractUrl: string | null;
  nextReviewAt: string | null;
  notes: string | null;
  createdBy?: { fullName: string } | null;
  assignedTo?: { fullName: string; email: string } | null;
  interactions: Interaction[];
  milestones: Milestone[];
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  INACTIVE: 'bg-gray-100 text-gray-600',
  NEGOTIATION: 'bg-blue-100 text-blue-800',
  SUSPENDED: 'bg-red-100 text-red-800',
  FORMER: 'bg-orange-100 text-orange-700',
};
const MILESTONE_COLORS: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-600',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-700',
  OVERDUE: 'bg-orange-100 text-orange-800',
};

export default function PartnerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    type: 'MEETING',
    subject: '',
    description: '',
    outcome: '',
    satisfaction: '',
  });

  const { data: p, isLoading: loading, error: queryError } =
    useApiQuery<PartnerDetail>(
      queryKeys.partners.detail(id), `/crm/partners/${id}`,
      { enabled: !!id, staleTime: STALE_TIME.DYNAMIC },
    );
  const error = queryError?.message ?? '';
  const detailKey = queryKeys.partners.detail(id);

  const intMut = useApiMutation(
    () => apiClient.post(`/crm/partners/${id}/interactions`, {
      type: form.type,
      subject: form.subject,
      description: form.description,
      ...(form.outcome && { outcome: form.outcome }),
      ...(form.satisfaction && { satisfaction: Number(form.satisfaction) }),
    }),
    {
      invalidateKeys: [detailKey],
      onSuccess: () => {
        setShowForm(false);
        setForm({ type: 'MEETING', subject: '', description: '', outcome: '', satisfaction: '' });
      },
      onError: (e) => alert(e.message || 'Erro inesperado'),
    },
  );
  const saving = intMut.isPending;

  const completeMut = useApiMutation(
    (milestoneId: string) =>
      apiClient.put(`/crm/partners/milestones/${milestoneId}/complete`, {}),
    { invalidateKeys: [detailKey], onError: (e) => alert(e.message || 'Erro inesperado') },
  );

  function submitInteraction(e: React.FormEvent) {
    e.preventDefault();
    intMut.mutate(undefined);
  }

  function completeMilestone(milestoneId: string) {
    completeMut.mutate(milestoneId);
  }

  if (loading)
    return (
      <div className="p-6 space-y-4">
        <div className="h-24 bg-gray-100 rounded-lg animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
      </div>
    );

  if (error || !p)
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          {error || 'Parceiro não encontrado'}
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
            onClick={() => router.push('/crm/partners')}
            className="text-sm text-blue-600 hover:underline mb-2"
          >
            ← Voltar à lista
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{p.name}</h1>
          <p className="text-gray-500 font-mono">{p.code}</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            STATUS_COLORS[p.status] ?? 'bg-gray-100 text-gray-600'
          }`}
        >
          {p.status}
        </span>
      </div>

      {/* Dados gerais */}
      <div className="bg-white rounded-lg shadow p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Info label="Tipo" value={p.type} />
        <Info label="Nível" value={p.tier} />
        <Info label="Nome legal" value={p.legalName} />
        <Info label="Contacto" value={p.contactName} />
        <Info label="Cargo" value={p.contactTitle} />
        <Info label="Email" value={p.email} />
        <Info label="Telefone" value={p.phone} />
        <Info label="Website" value={p.website} />
        <Info label="NIF" value={p.nif} />
        <Info label="Província" value={p.province} />
        <Info label="Cidade" value={p.city} />
        <Info
          label="Valor anual"
          value={
            p.annualValue
              ? `${p.currency} ${p.annualValue.toLocaleString('pt-AO')}`
              : '—'
          }
        />
        <Info
          label="Partilha de receita"
          value={p.revenueSharing != null ? `${p.revenueSharing}%` : '—'}
        />
        <Info
          label="Satisfação média"
          value={p.satisfactionAvg ? p.satisfactionAvg.toFixed(1) : '—'}
        />
        <Info label="Responsável" value={p.assignedTo?.fullName} />
      </div>

      {/* Contrato */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Contrato</h2>
        <div className="bg-white rounded-lg shadow p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <Info
            label="Início"
            value={p.contractStart ? formatDate(p.contractStart) : '—'}
          />
          <Info
            label="Fim"
            value={p.contractEnd ? formatDate(p.contractEnd) : '—'}
          />
          <Info
            label="Próxima revisão"
            value={p.nextReviewAt ? formatDate(p.nextReviewAt) : '—'}
          />
          <div className="md:col-span-3">
            {p.contractUrl ? (
              <a
                href={p.contractUrl}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline text-sm"
              >
                Ver documento do contrato
              </a>
            ) : (
              <span className="text-gray-400 text-sm">Sem documento</span>
            )}
          </div>
        </div>
      </section>

      {/* Milestones */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Milestones ({p.milestones.length})
        </h2>
        <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
          {p.milestones.length === 0 ? (
            <p className="p-4 text-gray-400">Sem milestones registados</p>
          ) : (
            p.milestones.map((m) => (
              <div key={m.id} className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{m.title}</p>
                  {m.description && (
                    <p className="text-sm text-gray-500">{m.description}</p>
                  )}
                  <p className="text-xs text-gray-400 mt-1">
                    Prazo: {formatDate(m.dueDate)}
                    {m.value
                      ? ` · ${m.currency} ${m.value.toLocaleString('pt-AO')}`
                      : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      MILESTONE_COLORS[m.status] ?? 'bg-gray-100'
                    }`}
                  >
                    {m.status}
                  </span>
                  {m.status !== 'COMPLETED' && m.status !== 'CANCELLED' && (
                    <button
                      onClick={() => completeMilestone(m.id)}
                      className="text-xs text-green-700 hover:underline"
                    >
                      Concluir
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Interacções */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Interacções ({p.interactions.length})
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
                <option value="MEETING">Reunião</option>
                <option value="CALL">Chamada</option>
                <option value="EMAIL">Email</option>
                <option value="VISIT">Visita</option>
                <option value="EVENT">Evento</option>
                <option value="NOTE">Nota</option>
                <option value="REVIEW">Revisão</option>
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
          {p.interactions.length === 0 ? (
            <p className="p-4 text-gray-400">Sem interacções registadas</p>
          ) : (
            p.interactions.map((it) => (
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
