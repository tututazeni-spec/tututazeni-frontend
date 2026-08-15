// components/crm/funders/FunderDetailView.tsx
// Vista pura do detalhe de um financiador — toda a busca de dados e as
// mutações (grants/interacções/desembolsos) vivem em useFunderDetail.

import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
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
            className="font-body text-sm text-primary hover:underline mb-2"
          >
            ← Voltar à lista
          </button>
          <h1 className="font-display text-2xl font-bold text-ink">{f.name}</h1>
          <p className="font-mono font-body text-ink-muted">{f.code}</p>
        </div>
        <span
          className={cn(
            'inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 font-body text-xs font-semibold',
            STATUS_COLORS[f.status] ?? 'bg-surface-sunken text-ink-muted',
          )}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {f.status}
        </span>
      </div>

      {/* Resumo financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard
          label="Comprometido"
          value={formatMoney(f.totalCommitted, f.currency)}
          color="text-ink"
        />
        <SummaryCard
          label="Recebido"
          value={formatMoney(f.totalReceived, f.currency)}
          color="text-success-ink"
        />
        <SummaryCard
          label="Pendente"
          value={formatMoney(f.totalPending, f.currency)}
          color="text-warning-ink"
        />
        <SummaryCard
          label="Taxa de execução"
          value={`${executionRate.toFixed(1)}%`}
          color="text-primary"
        />
      </div>

      {/* Dados gerais */}
      <Card>
        <CardBody className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </CardBody>
      </Card>

      {/* Grants */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-display text-lg font-semibold text-ink">
            Financiamentos / Grants ({f.grants.length})
          </h2>
          <Button
            onClick={() => setShowGrantForm((s) => !s)}
            variant={showGrantForm ? 'secondary' : 'primary'}
          >
            {showGrantForm ? 'Cancelar' : '+ Novo Grant'}
          </Button>
        </div>

        {showGrantForm && (
          <form
            onSubmit={submitGrant}
            className="mb-4"
          >
            <Card>
              <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  required
                  placeholder="Título do grant"
                  value={grantForm.title}
                  onChange={(e) =>
                    setGrantForm({ ...grantForm, title: e.target.value })
                  }
                  className="md:col-span-2"
                />
                <Input
                  required
                  type="number"
                  min={0}
                  placeholder="Valor (AOA)"
                  value={grantForm.amount}
                  onChange={(e) =>
                    setGrantForm({ ...grantForm, amount: e.target.value })
                  }
                />
                <div />
                <div>
                  <label className="font-body text-xs text-ink-muted block mb-1">
                    Data de início
                  </label>
                  <Input
                    required
                    type="date"
                    value={grantForm.startDate}
                    onChange={(e) =>
                      setGrantForm({ ...grantForm, startDate: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="font-body text-xs text-ink-muted block mb-1">
                    Data de fim
                  </label>
                  <Input
                    type="date"
                    value={grantForm.endDate}
                    onChange={(e) =>
                      setGrantForm({ ...grantForm, endDate: e.target.value })
                    }
                  />
                </div>
                <div className="md:col-span-2">
                  <Button type="submit" disabled={saving}>
                    {saving ? 'A guardar...' : 'Criar Grant'}
                  </Button>
                </div>
              </CardBody>
            </Card>
          </form>
        )}

        <Card>
          <div className="divide-y divide-border">
            {f.grants.length === 0 ? (
              <p className="p-4 font-body text-ink-faint">Sem grants registados</p>
            ) : (
              f.grants.map((g) => {
                const pct = g.amount > 0 ? (g.disbursed / g.amount) * 100 : 0;
                return (
                  <div key={g.id} className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-body font-medium text-ink">
                          <span className="font-mono text-primary mr-2">
                            {g.code}
                          </span>
                          {g.title}
                        </p>
                        <p className="font-body text-xs text-ink-muted mt-0.5">
                          {formatMoney(g.disbursed, g.currency)} de{' '}
                          {formatMoney(g.amount, g.currency)} ({pct.toFixed(0)}%)
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center rounded-pill px-2 py-1 font-body text-xs font-semibold bg-surface-sunken text-ink-muted">
                          {g.status}
                        </span>
                        {g.status === 'ACTIVE' && (
                          <button
                            onClick={() => addDisbursement(g.id)}
                            className="font-body text-xs text-success-ink hover:underline"
                          >
                            + Desembolso
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="w-full h-2 bg-surface-sunken rounded-full mt-2 overflow-hidden">
                      <div
                        className="h-2 bg-success rounded-full"
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </section>

      {/* Relatórios */}
      <section>
        <h2 className="font-display text-lg font-semibold text-ink mb-3">
          Relatórios ({f.reports.length})
        </h2>
        <Card>
          <div className="divide-y divide-border">
            {f.reports.length === 0 ? (
              <p className="p-4 font-body text-ink-faint">Sem relatórios registados</p>
            ) : (
              f.reports.map((r) => (
                <div key={r.id} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-body font-medium text-ink">{r.title}</p>
                    <p className="font-body text-xs text-ink-muted">
                      {r.period} · Prazo {formatDate(r.dueDate)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-pill px-2 py-1 font-body text-xs font-semibold',
                      REPORT_COLORS[r.status] ?? 'bg-surface-sunken text-ink-muted',
                    )}
                  >
                    {r.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>

      {/* Interacções */}
      <section>
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-display text-lg font-semibold text-ink">
            Interacções ({f.interactions.length})
          </h2>
          <Button
            onClick={() => setShowIntForm((s) => !s)}
            variant={showIntForm ? 'secondary' : 'primary'}
          >
            {showIntForm ? 'Cancelar' : '+ Nova Interacção'}
          </Button>
        </div>

        {showIntForm && (
          <form
            onSubmit={submitInteraction}
            className="mb-4"
          >
            <Card>
              <CardBody className="space-y-3">
                <Select
                  value={intForm.type}
                  onChange={(e) => setIntForm({ ...intForm, type: e.target.value })}
                >
                  <option value="MEETING">Reunião</option>
                  <option value="CALL">Chamada</option>
                  <option value="EMAIL">Email</option>
                  <option value="VISIT">Visita</option>
                  <option value="EVENT">Evento</option>
                  <option value="NOTE">Nota</option>
                  <option value="REVIEW">Revisão</option>
                </Select>
                <Input
                  required
                  placeholder="Assunto"
                  value={intForm.subject}
                  onChange={(e) =>
                    setIntForm({ ...intForm, subject: e.target.value })
                  }
                />
                <Textarea
                  required
                  placeholder="Descrição"
                  value={intForm.description}
                  onChange={(e) =>
                    setIntForm({ ...intForm, description: e.target.value })
                  }
                  rows={3}
                />
                <Input
                  placeholder="Resultado (opcional)"
                  value={intForm.outcome}
                  onChange={(e) =>
                    setIntForm({ ...intForm, outcome: e.target.value })
                  }
                />
                <Button
                  type="submit"
                  disabled={saving}
                >
                  {saving ? 'A guardar...' : 'Guardar Interacção'}
                </Button>
              </CardBody>
            </Card>
          </form>
        )}

        <Card>
          <div className="divide-y divide-border">
            {f.interactions.length === 0 ? (
              <p className="p-4 font-body text-ink-faint">Sem interacções registadas</p>
            ) : (
              f.interactions.map((it) => (
                <div key={it.id} className="p-4">
                  <div className="flex justify-between items-center">
                    <span className="font-body font-medium text-ink">
                      <span className="font-body text-xs bg-surface-sunken text-ink-muted px-2 py-0.5 rounded mr-2">
                        {it.type}
                      </span>
                      {it.subject}
                    </span>
                    <span className="font-body text-xs text-ink-faint">
                      {formatDate(it.date)}
                    </span>
                  </div>
                  <p className="font-body text-sm text-ink-muted mt-1">{it.description}</p>
                  <div className="flex gap-4 mt-1 font-body text-xs text-ink-faint">
                    {it.user?.fullName && <span>Por: {it.user.fullName}</span>}
                    {it.outcome && <span>Resultado: {it.outcome}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>
    </div>
  );
}
