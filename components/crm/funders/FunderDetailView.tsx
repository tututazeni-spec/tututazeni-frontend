// components/crm/funders/FunderDetailView.tsx
// Vista pura do detalhe de um financiador — toda a busca de dados e as
// mutações (grants/interacções/desembolsos) vivem em useFunderDetail.

import { useRouter } from 'next/navigation';
import {
  Info,
  SummaryCard,
  formatMoney,
  formatDate,
} from '@/components/crm/shared';
import { STATUS_COLORS, REPORT_COLORS } from './types';
import type { FunderDetail, GrantForm, InteractionForm } from './types';

interface FunderDetailViewProps {
  funder: FunderDetail;
  showGrantForm: boolean;
  setShowGrantForm: (updater: (s: boolean) => boolean) => void;
  grantForm: GrantForm;
  setGrantForm: (form: GrantForm) => void;
  submitGrant: (e: React.FormEvent) => void;
  showIntForm: boolean;
  setShowIntForm: (updater: (s: boolean) => boolean) => void;
  intForm: InteractionForm;
  setIntForm: (form: InteractionForm) => void;
  submitInteraction: (e: React.FormEvent) => void;
  addDisbursement: (grantId: string) => void;
  saving: boolean;
}

export function FunderDetailView({
  funder: f,
  showGrantForm,
  setShowGrantForm,
  grantForm,
  setGrantForm,
  submitGrant,
  showIntForm,
  setShowIntForm,
  intForm,
  setIntForm,
  submitInteraction,
  addDisbursement,
  saving,
}: FunderDetailViewProps) {
  const router = useRouter();
  const executionRate =
    f.totalCommitted > 0 ? (f.totalReceived / f.totalCommitted) * 100 : 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <button
            onClick={() => router.push('/crm/funders')}
            className="text-sm text-blue-600 hover:underline mb-2"
          >
            ← Voltar à lista
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{f.name}</h1>
          <p className="text-gray-500 font-mono">{f.code}</p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            STATUS_COLORS[f.status] ?? 'bg-gray-100 text-gray-600'
          }`}
        >
          {f.status}
        </span>
      </div>

      {/* Resumo financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          label="Comprometido"
          value={formatMoney(f.totalCommitted, f.currency)}
          color="text-gray-900"
        />
        <SummaryCard
          label="Recebido"
          value={formatMoney(f.totalReceived, f.currency)}
          color="text-green-700"
        />
        <SummaryCard
          label="Pendente"
          value={formatMoney(f.totalPending, f.currency)}
          color="text-orange-700"
        />
        <SummaryCard
          label="Taxa de execução"
          value={`${executionRate.toFixed(1)}%`}
          color="text-blue-700"
        />
      </div>

      {/* Dados gerais */}
      <div className="bg-white rounded-lg shadow p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Info label="Tipo" value={f.type} />
        <Info label="Nome legal" value={f.legalName} />
        <Info label="País" value={f.country} />
        <Info label="Região" value={f.region} />
        <Info label="Contacto" value={f.contactName} />
        <Info label="Cargo" value={f.contactTitle} />
        <Info label="Email" value={f.email} />
        <Info label="Telefone" value={f.phone} />
        <Info label="Requisitos de reporte" value={f.reportingReqs} />
        <Info label="Responsável" value={f.assignedTo?.fullName} />
        <Info label="Criado por" value={f.createdBy?.fullName} />
        <Info
          label="Satisfação média"
          value={f.satisfactionAvg ? f.satisfactionAvg.toFixed(1) : '—'}
        />
      </div>

      {/* Grants */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold text-gray-900">
            Financiamentos / Grants ({f.grants.length})
          </h2>
          <button
            onClick={() => setShowGrantForm((s) => !s)}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700"
          >
            {showGrantForm ? 'Cancelar' : '+ Novo Grant'}
          </button>
        </div>

        {showGrantForm && (
          <form
            onSubmit={submitGrant}
            className="bg-white rounded-lg shadow p-4 mb-4 grid grid-cols-1 md:grid-cols-2 gap-3"
          >
            <input
              required
              placeholder="Título do grant"
              value={grantForm.title}
              onChange={(e) =>
                setGrantForm({ ...grantForm, title: e.target.value })
              }
              className="border rounded-lg px-3 py-2 md:col-span-2"
            />
            <input
              required
              type="number"
              min={0}
              placeholder="Valor (AOA)"
              value={grantForm.amount}
              onChange={(e) =>
                setGrantForm({ ...grantForm, amount: e.target.value })
              }
              className="border rounded-lg px-3 py-2"
            />
            <div />
            <label className="text-xs text-gray-500">
              Data de início
              <input
                required
                type="date"
                value={grantForm.startDate}
                onChange={(e) =>
                  setGrantForm({ ...grantForm, startDate: e.target.value })
                }
                className="border rounded-lg px-3 py-2 w-full mt-1"
              />
            </label>
            <label className="text-xs text-gray-500">
              Data de fim
              <input
                type="date"
                value={grantForm.endDate}
                onChange={(e) =>
                  setGrantForm({ ...grantForm, endDate: e.target.value })
                }
                className="border rounded-lg px-3 py-2 w-full mt-1"
              />
            </label>
            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? 'A guardar...' : 'Criar Grant'}
              </button>
            </div>
          </form>
        )}

        <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
          {f.grants.length === 0 ? (
            <p className="p-4 text-gray-400">Sem grants registados</p>
          ) : (
            f.grants.map((g) => {
              const pct = g.amount > 0 ? (g.disbursed / g.amount) * 100 : 0;
              return (
                <div key={g.id} className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">
                        <span className="font-mono text-blue-600 mr-2">
                          {g.code}
                        </span>
                        {g.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {formatMoney(g.disbursed, g.currency)} de{' '}
                        {formatMoney(g.amount, g.currency)} ({pct.toFixed(0)}%)
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        {g.status}
                      </span>
                      {g.status === 'ACTIVE' && (
                        <button
                          onClick={() => addDisbursement(g.id)}
                          className="text-xs text-green-700 hover:underline"
                        >
                          + Desembolso
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-2 bg-green-500 rounded-full"
                      style={{ width: `${Math.min(100, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* Relatórios */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-3">
          Relatórios ({f.reports.length})
        </h2>
        <div className="bg-white rounded-lg shadow divide-y divide-gray-100">
          {f.reports.length === 0 ? (
            <p className="p-4 text-gray-400">Sem relatórios registados</p>
          ) : (
            f.reports.map((r) => (
              <div key={r.id} className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-medium">{r.title}</p>
                  <p className="text-xs text-gray-500">
                    {r.period} · Prazo {formatDate(r.dueDate)}
                  </p>
                </div>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    REPORT_COLORS[r.status] ?? 'bg-gray-100'
                  }`}
                >
                  {r.status}
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
            Interacções ({f.interactions.length})
          </h2>
          <button
            onClick={() => setShowIntForm((s) => !s)}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700"
          >
            {showIntForm ? 'Cancelar' : '+ Nova Interacção'}
          </button>
        </div>

        {showIntForm && (
          <form
            onSubmit={submitInteraction}
            className="bg-white rounded-lg shadow p-4 mb-4 space-y-3"
          >
            <select
              value={intForm.type}
              onChange={(e) => setIntForm({ ...intForm, type: e.target.value })}
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
              required
              placeholder="Assunto"
              value={intForm.subject}
              onChange={(e) =>
                setIntForm({ ...intForm, subject: e.target.value })
              }
              className="border rounded-lg px-3 py-2 w-full"
            />
            <textarea
              required
              placeholder="Descrição"
              value={intForm.description}
              onChange={(e) =>
                setIntForm({ ...intForm, description: e.target.value })
              }
              className="border rounded-lg px-3 py-2 w-full"
              rows={3}
            />
            <input
              placeholder="Resultado (opcional)"
              value={intForm.outcome}
              onChange={(e) =>
                setIntForm({ ...intForm, outcome: e.target.value })
              }
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
          {f.interactions.length === 0 ? (
            <p className="p-4 text-gray-400">Sem interacções registadas</p>
          ) : (
            f.interactions.map((it) => (
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
                </div>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
