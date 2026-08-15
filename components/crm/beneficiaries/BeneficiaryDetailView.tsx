// components/crm/beneficiaries/BeneficiaryDetailView.tsx

import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Info, formatDate } from '@/components/crm/shared';
import { PRIORITY_COLORS } from './types';
import type { BeneficiaryDetail, InteractionForm } from './types';

interface BeneficiaryDetailViewProps {
  beneficiary: BeneficiaryDetail;
  showForm: boolean;
  setShowForm: (updater: (s: boolean) => boolean) => void;
  form: InteractionForm;
  setForm: (form: InteractionForm) => void;
  submitInteraction: (e: React.FormEvent) => void;
}

export function BeneficiaryDetailView({
  beneficiary: b,
  showForm,
  setShowForm,
  form,
  setForm,
  submitInteraction,
}: BeneficiaryDetailViewProps) {
  const router = useRouter();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <button
            onClick={() => router.push('/crm/beneficiaries')}
            className="font-body text-sm text-primary hover:underline mb-2"
          >
            ← Voltar à lista
          </button>
          <h1 className="font-display text-2xl font-bold text-ink">{b.fullName}</h1>
          <p className="font-mono font-body text-ink-muted">{b.code}</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 font-body text-xs font-semibold bg-info-subtle text-info-ink">
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {b.status}
        </span>
      </div>

      {/* Dados gerais */}
      <Card>
        <CardBody className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </CardBody>
      </Card>

      {/* Necessidades */}
      <section>
        <h2 className="font-display text-lg font-semibold text-ink mb-3">
          Necessidades ({b.needs.length})
        </h2>
        <Card>
          <div className="divide-y divide-border">
            {b.needs.length === 0 ? (
              <p className="p-4 font-body text-ink-faint">Sem necessidades registadas</p>
            ) : (
              b.needs.map((n) => (
                <div key={n.id} className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-medium font-body text-ink">{n.category}</p>
                    <p className="font-body text-sm text-ink-muted">{n.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-pill px-2 py-1 font-body text-xs font-semibold',
                        PRIORITY_COLORS[n.priority] ?? 'bg-surface-sunken text-ink-muted',
                      )}
                    >
                      {n.priority}
                    </span>
                    <span className="font-body text-xs text-ink-muted">{n.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </section>

      {/* Documentos */}
      <section>
        <h2 className="font-display text-lg font-semibold text-ink mb-3">
          Documentos ({b.documents.length})
        </h2>
        <Card>
          <div className="divide-y divide-border">
            {b.documents.length === 0 ? (
              <p className="p-4 font-body text-ink-faint">Sem documentos</p>
            ) : (
              b.documents.map((d) => (
                <div key={d.id} className="p-4 flex justify-between items-center">
                  <div>
                    <a
                      href={d.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium font-body text-primary hover:underline"
                    >
                      {d.name}
                    </a>
                    <p className="font-body text-sm text-ink-muted">{d.type}</p>
                  </div>
                  <span
                    className={cn(
                      'font-body text-xs font-medium',
                      d.isVerified ? 'text-success-ink' : 'text-ink-faint',
                    )}
                  >
                    {d.isVerified ? '✓ Verificado' : 'Por verificar'}
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
            Interacções ({b.interactions.length})
          </h2>
          <Button
            onClick={() => setShowForm((s) => !s)}
            variant={showForm ? 'secondary' : 'primary'}
          >
            {showForm ? 'Cancelar' : '+ Nova Interacção'}
          </Button>
        </div>

        {showForm && (
          <form
            onSubmit={submitInteraction}
            className="mb-4 space-y-3"
          >
            <Card>
              <CardBody className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                  >
                    <option value="CALL">Chamada</option>
                    <option value="EMAIL">Email</option>
                    <option value="MEETING">Reunião</option>
                    <option value="VISIT">Visita</option>
                    <option value="EVENT">Evento</option>
                    <option value="NOTE">Nota</option>
                    <option value="TASK">Tarefa</option>
                  </Select>
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
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
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
                  onChange={(e) => setForm({ ...form, outcome: e.target.value })}
                />
                <Button type="submit">Guardar Interacção</Button>
              </CardBody>
            </Card>
          </form>
        )}

        <Card>
          <div className="divide-y divide-border">
            {b.interactions.length === 0 ? (
              <p className="p-4 font-body text-ink-faint">Sem interacções registadas</p>
            ) : (
              b.interactions.map((it) => (
                <div
                  key={it.id}
                  className={cn('p-4', it._optimistic && 'opacity-60')}
                >
                  <div className="flex justify-between items-center">
                    <span className="font-body font-medium">
                      <span className="font-body text-xs bg-surface-sunken text-ink-muted px-2 py-0.5 rounded mr-2">
                        {it.type}
                      </span>
                      {it.subject}
                    </span>
                    <span className="font-body text-xs text-ink-faint">
                      {it._optimistic ? 'A guardar…' : formatDate(it.date)}
                    </span>
                  </div>
                  <p className="font-body text-sm text-ink-muted mt-1">{it.description}</p>
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
