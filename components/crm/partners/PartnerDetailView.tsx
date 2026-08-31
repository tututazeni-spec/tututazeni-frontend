// components/crm/partners/PartnerDetailView.tsx

import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Info, formatDate } from '@/components/crm/shared';
import { STATUS_COLORS, MILESTONE_COLORS, TYPE_LABELS } from './types';
import type { PartnerDetail, InteractionForm } from './types';

interface PartnerDetailViewProps {
  partner: PartnerDetail;
  showForm: boolean;
  setShowForm: (updater: (s: boolean) => boolean) => void;
  form: InteractionForm;
  setForm: (form: InteractionForm) => void;
  submitInteraction: (e: React.FormEvent) => void;
  completeMilestone: (milestoneId: string) => void;
  saving: boolean;
  canDelete: boolean;
  onDelete: () => void;
  isDeleting: boolean;
}

export function PartnerDetailView({
  partner: p,
  showForm,
  setShowForm,
  form,
  setForm,
  submitInteraction,
  completeMilestone,
  saving,
  canDelete,
  onDelete,
  isDeleting,
}: PartnerDetailViewProps) {
  const router = useRouter();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <button
            onClick={() => router.push('/crm/partners')}
            className="font-body text-sm text-primary hover:underline mb-2"
          >
            ← Voltar à lista
          </button>
          <h1 className="font-display text-2xl font-bold text-ink">{p.name}</h1>
          <p className="font-mono font-body text-ink-muted">{p.code}</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 font-body text-xs font-semibold',
              STATUS_COLORS[p.status] ?? 'bg-surface-sunken text-ink-muted',
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {p.status}
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

      {/* Dados gerais */}
      <Card>
        <CardBody className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Info label="Tipo" value={TYPE_LABELS[p.type] || p.type} />
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
        </CardBody>
      </Card>

      {/* Contrato */}
      <section>
        <h2 className="font-display text-lg font-semibold text-ink mb-3">
          Contrato
        </h2>
        <Card>
          <CardBody className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  className="text-primary hover:underline font-body text-sm"
                >
                  Ver documento do contrato
                </a>
              ) : (
                <span className="font-body text-sm text-ink-faint">
                  Sem documento
                </span>
              )}
            </div>
          </CardBody>
        </Card>
      </section>

      {/* Milestones */}
      <section>
        <h2 className="font-display text-lg font-semibold text-ink mb-3">
          Milestones ({p.milestones.length})
        </h2>
        <Card>
          <div className="divide-y divide-border">
            {p.milestones.length === 0 ? (
              <p className="p-4 font-body text-ink-faint">
                Sem milestones registados
              </p>
            ) : (
              p.milestones.map((m) => (
                <div
                  key={m.id}
                  className="p-4 flex justify-between items-center"
                >
                  <div>
                    <p className="font-body font-medium text-ink">{m.title}</p>
                    {m.description && (
                      <p className="font-body text-sm text-ink-muted">
                        {m.description}
                      </p>
                    )}
                    <p className="font-body text-xs text-ink-faint mt-1">
                      Prazo: {formatDate(m.dueDate)}
                      {m.value
                        ? ` · ${m.currency} ${m.value.toLocaleString('pt-AO')}`
                        : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-pill px-2 py-1 font-body text-xs font-semibold',
                        MILESTONE_COLORS[m.status] ??
                          'bg-surface-sunken text-ink-muted',
                      )}
                    >
                      {m.status}
                    </span>
                    {m.status !== 'COMPLETED' && m.status !== 'CANCELLED' && (
                      <button
                        onClick={() => completeMilestone(m.id)}
                        className="font-body text-xs text-success-ink hover:underline"
                      >
                        Concluir
                      </button>
                    )}
                  </div>
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
            Interacções ({p.interactions.length})
          </h2>
          <Button
            onClick={() => setShowForm((s) => !s)}
            intent={showForm ? 'secondary' : 'primary'}
          >
            {showForm ? 'Cancelar' : '+ Nova Interacção'}
          </Button>
        </div>

        {showForm && (
          <form onSubmit={submitInteraction} className="mb-4">
            <Card>
              <CardBody className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Select
                    value={form.type}
                    onValueChange={(value) => setForm({ ...form, type: value })}
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
                    type="number"
                    min={1}
                    max={5}
                    placeholder="Satisfação (1-5)"
                    value={form.satisfaction}
                    onChange={(e) =>
                      setForm({ ...form, satisfaction: e.target.value })
                    }
                  />
                </div>
                <Input
                  required
                  placeholder="Assunto"
                  value={form.subject}
                  onChange={(e) =>
                    setForm({ ...form, subject: e.target.value })
                  }
                />
                <Textarea
                  required
                  placeholder="Descrição"
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={3}
                />
                <Input
                  placeholder="Resultado (opcional)"
                  value={form.outcome}
                  onChange={(e) =>
                    setForm({ ...form, outcome: e.target.value })
                  }
                />
                <Button type="submit" disabled={saving}>
                  {saving ? 'A guardar...' : 'Guardar Interacção'}
                </Button>
              </CardBody>
            </Card>
          </form>
        )}

        <Card>
          <div className="divide-y divide-border">
            {p.interactions.length === 0 ? (
              <p className="p-4 font-body text-ink-faint">
                Sem interacções registadas
              </p>
            ) : (
              p.interactions.map((it) => (
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
                  <p className="font-body text-sm text-ink-muted mt-1">
                    {it.description}
                  </p>
                  <div className="flex gap-4 mt-1 font-body text-xs text-ink-faint">
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
        </Card>
      </section>
    </div>
  );
}
