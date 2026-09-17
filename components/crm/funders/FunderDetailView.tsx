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
import { STATUS_COLORS, REPORT_COLORS, GRANT_STATUS_OPTIONS } from './types';
import type {
  FunderDetail,
  GrantForm,
  InteractionForm,
  CreateReportForm,
} from './types';

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
  updateGrantStatus: (grantId: string, status: string) => void;
  showReportForm: boolean;
  setShowReportForm: (updater: (s: boolean) => boolean) => void;
  reportForm: CreateReportForm;
  setReportForm: (form: CreateReportForm) => void;
  submitReportForm: (e: React.FormEvent) => void;
  savingReport: boolean;
  submittingReportId: string | null;
  setSubmittingReportId: (id: string | null) => void;
  reportFileUrl: string;
  setReportFileUrl: (value: string) => void;
  confirmReportSubmission: (reportId: string) => void;
  submittingReport: boolean;
  saving: boolean;
  canDelete: boolean;
  onDelete: () => void;
  isDeleting: boolean;
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
  updateGrantStatus,
  showReportForm,
  setShowReportForm,
  reportForm,
  setReportForm,
  submitReportForm,
  savingReport,
  submittingReportId,
  setSubmittingReportId,
  reportFileUrl,
  setReportFileUrl,
  confirmReportSubmission,
  submittingReport,
  saving,
  canDelete,
  onDelete,
  isDeleting,
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
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 font-body text-xs font-semibold',
              STATUS_COLORS[f.status] ?? 'bg-surface-sunken text-ink-muted',
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {f.status}
          </span>
          {canDelete && (
            <Button
              intent="danger"
              size="sm"
              onClick={onDelete}
              loading={isDeleting}
            >
              Eliminar
            </Button>
          )}
        </div>
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
            Financiamentos / Subsídios ({f.grants.length})
          </h2>
          <Button
            onClick={() => setShowGrantForm((s) => !s)}
            intent={showGrantForm ? 'secondary' : 'primary'}
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
                        <Select
                          value={g.status}
                          onValueChange={(value) => updateGrantStatus(g.id, value)}
                          items={GRANT_STATUS_OPTIONS.map((s) => ({
                            value: s,
                            label: s,
                          }))}
                        />
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
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-display text-lg font-semibold text-ink">
            Relatórios ({f.reports.length})
          </h2>
          <Button
            onClick={() => setShowReportForm((s) => !s)}
            intent={showReportForm ? 'secondary' : 'primary'}
          >
            {showReportForm ? 'Cancelar' : '+ Novo Relatório'}
          </Button>
        </div>

        {showReportForm && (
          <form onSubmit={submitReportForm} className="mb-4">
            <Card>
              <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input
                  required
                  placeholder="Título"
                  value={reportForm.title}
                  onChange={(e) =>
                    setReportForm({ ...reportForm, title: e.target.value })
                  }
                  className="md:col-span-2"
                />
                <Input
                  required
                  placeholder="Período (ex.: Q2 2026)"
                  value={reportForm.period}
                  onChange={(e) =>
                    setReportForm({ ...reportForm, period: e.target.value })
                  }
                />
                <div>
                  <label className="font-body text-xs text-ink-muted block mb-1">
                    Prazo
                  </label>
                  <Input
                    required
                    type="date"
                    value={reportForm.dueDate}
                    onChange={(e) =>
                      setReportForm({ ...reportForm, dueDate: e.target.value })
                    }
                  />
                </div>
                {f.grants.length > 0 && (
                  <Select
                    value={reportForm.grantId}
                    onValueChange={(value) =>
                      setReportForm({ ...reportForm, grantId: value })
                    }
                    items={[
                      { value: '', label: 'Sem grant associado' },
                      ...f.grants.map((g) => ({ value: g.id, label: g.title })),
                    ]}
                  />
                )}
                <div className="md:col-span-2">
                  <Button type="submit" disabled={savingReport}>
                    {savingReport ? 'A guardar...' : 'Criar Relatório'}
                  </Button>
                </div>
              </CardBody>
            </Card>
          </form>
        )}

        <Card>
          <div className="divide-y divide-border">
            {f.reports.length === 0 ? (
              <p className="p-4 font-body text-ink-faint">Sem relatórios registados</p>
            ) : (
              f.reports.map((r) => {
                const canSubmit = r.status === 'PENDING' || r.status === 'REJECTED';
                const submitting = submittingReportId === r.id;
                return (
                  <div key={r.id} className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-body font-medium text-ink">{r.title}</p>
                        <p className="font-body text-xs text-ink-muted">
                          {r.period} · Prazo {formatDate(r.dueDate)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-pill px-2 py-1 font-body text-xs font-semibold',
                            REPORT_COLORS[r.status] ?? 'bg-surface-sunken text-ink-muted',
                          )}
                        >
                          {r.status}
                        </span>
                        {canSubmit && !submitting && (
                          <button
                            onClick={() => setSubmittingReportId(r.id)}
                            className="font-body text-xs text-success-ink hover:underline"
                          >
                            Submeter
                          </button>
                        )}
                      </div>
                    </div>
                    {submitting && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Input
                          type="url"
                          placeholder="https://… link do relatório"
                          value={reportFileUrl}
                          onChange={(e) => setReportFileUrl(e.target.value)}
                          className="flex-1 min-w-[220px]"
                        />
                        <Button
                          size="sm"
                          disabled={!reportFileUrl.trim() || submittingReport}
                          onClick={() => confirmReportSubmission(r.id)}
                        >
                          {submittingReport ? 'A submeter...' : 'Confirmar'}
                        </Button>
                        <Button
                          size="sm"
                          intent="secondary"
                          onClick={() => {
                            setSubmittingReportId(null);
                            setReportFileUrl('');
                          }}
                        >
                          Cancelar
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })
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
            intent={showIntForm ? 'secondary' : 'primary'}
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
                  onValueChange={(value) => setIntForm({ ...intForm, type: value })}
                  items={[
                    { value: 'MEETING', label: 'Reunião' },
                    { value: 'CALL', label: 'Chamada' },
                    { value: 'EMAIL', label: 'Email' },
                    { value: 'VISIT', label: 'Visita' },
                    { value: 'EVENT', label: 'Evento' },
                    { value: 'NOTE', label: 'Nota' },
                    { value: 'REVIEW', label: 'Revisão' },
                  ]}
                />
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
