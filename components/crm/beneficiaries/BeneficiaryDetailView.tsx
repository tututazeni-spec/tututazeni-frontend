// components/crm/beneficiaries/BeneficiaryDetailView.tsx

import { useRouter } from 'next/navigation';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Field, formatDate } from '@/components/crm/shared';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { PRIORITY_COLORS, STATUS_COLORS } from './types';
import { INTERACTION_TYPE_OPTIONS, STATUS_OPTIONS } from './formConfig';
import {
  BenefitsTab,
  ConsentTab,
  DocumentsTab,
  FollowUpTab,
  HistoryTab,
  ParticipationsTab,
  ProfileTab,
  type BeneficiaryExtras,
} from './BeneficiaryExtraTabs';
import type { BeneficiaryDetail, InteractionForm, NeedForm } from './types';

interface BeneficiaryDetailViewProps {
  beneficiary: BeneficiaryDetail;
  showForm: boolean;
  setShowForm: (updater: (s: boolean) => boolean) => void;
  form: InteractionForm;
  setForm: (form: InteractionForm) => void;
  submitInteraction: (e: React.FormEvent) => void;
  showNeedForm: boolean;
  setShowNeedForm: (updater: (s: boolean) => boolean) => void;
  needForm: NeedForm;
  setNeedForm: (form: NeedForm) => void;
  submitNeed: (e: React.FormEvent) => void;
  savingNeed: boolean;
  canDelete: boolean;
  onDelete: () => void;
  isDeleting: boolean;
  extras: BeneficiaryExtras;
}

export function BeneficiaryDetailView({
  beneficiary: b,
  showForm,
  setShowForm,
  form,
  setForm,
  submitInteraction,
  showNeedForm,
  setShowNeedForm,
  needForm,
  setNeedForm,
  submitNeed,
  savingNeed,
  canDelete,
  onDelete,
  isDeleting,
  extras,
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
          <h1 className="font-display text-2xl font-bold text-ink">
            {b.fullName}
          </h1>
          <p className="font-mono font-body text-ink-muted">{b.code}</p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={cn(
              'inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 font-body text-xs font-semibold',
              STATUS_COLORS[b.status] ?? 'bg-info-subtle text-info-ink',
            )}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {STATUS_OPTIONS.find((o) => o.value === b.status)?.label ??
              b.status}
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

      <Tabs defaultValue="perfil">
        <TabsList className="flex-wrap">
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="beneficios">
            Benefícios ({b.benefits.length})
          </TabsTrigger>
          <TabsTrigger value="programas">
            Programas ({b.participations.length})
          </TabsTrigger>
          <TabsTrigger value="acompanhamento">Acompanhamento</TabsTrigger>
          <TabsTrigger value="interacoes">
            Interacções ({b.interactions.length})
          </TabsTrigger>
          <TabsTrigger value="documentos">
            Documentos ({b.documents.length})
          </TabsTrigger>
          <TabsTrigger value="consentimentos">Consentimentos</TabsTrigger>
          <TabsTrigger
            value="historico"
            onClick={() => extras.setHistoryEnabled(true)}
          >
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="perfil" className="space-y-6">
          <ProfileTab b={b} />
          {/* Necessidades */}
          <section>
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-display text-lg font-semibold text-ink">
                Necessidades ({b.needs.length})
              </h2>
              <Button
                onClick={() => setShowNeedForm((s) => !s)}
                intent={showNeedForm ? 'secondary' : 'primary'}
              >
                {showNeedForm ? 'Cancelar' : '+ Nova Necessidade'}
              </Button>
            </div>

            {showNeedForm && (
              <form onSubmit={submitNeed} className="mb-4">
                <Card>
                  <CardBody className="space-y-3">
                    <Input
                      required
                      placeholder="Categoria (ex.: Saúde, Habitação, Educação)"
                      value={needForm.category}
                      onChange={(e) =>
                        setNeedForm({ ...needForm, category: e.target.value })
                      }
                    />
                    <Textarea
                      required
                      placeholder="Descrição"
                      value={needForm.description}
                      onChange={(e) =>
                        setNeedForm({
                          ...needForm,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                    />
                    <Select
                      value={needForm.priority}
                      onValueChange={(value) =>
                        setNeedForm({ ...needForm, priority: value })
                      }
                      items={[
                        { value: 'LOW', label: 'Baixa' },
                        { value: 'MEDIUM', label: 'Média' },
                        { value: 'HIGH', label: 'Alta' },
                        { value: 'URGENT', label: 'Urgente' },
                      ]}
                    />
                    <Button type="submit" disabled={savingNeed}>
                      {savingNeed ? 'A guardar...' : 'Guardar Necessidade'}
                    </Button>
                  </CardBody>
                </Card>
              </form>
            )}

            <Card>
              <div className="divide-y divide-border">
                {b.needs.length === 0 ? (
                  <p className="p-4 font-body text-ink-faint">
                    Sem necessidades registadas
                  </p>
                ) : (
                  b.needs.map((n) => (
                    <div
                      key={n.id}
                      className="p-4 flex justify-between items-center"
                    >
                      <div>
                        <p className="font-medium font-body text-ink">
                          {n.category}
                        </p>
                        <p className="font-body text-sm text-ink-muted">
                          {n.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'inline-flex items-center rounded-pill px-2 py-1 font-body text-xs font-semibold',
                            PRIORITY_COLORS[n.priority] ??
                              'bg-surface-sunken text-ink-muted',
                          )}
                        >
                          {n.priority}
                        </span>
                        <span className="font-body text-xs text-ink-muted">
                          {n.status}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </section>
        </TabsContent>

        <TabsContent value="beneficios">
          <BenefitsTab b={b} extras={extras} />
        </TabsContent>
        <TabsContent value="programas">
          <ParticipationsTab b={b} extras={extras} />
        </TabsContent>
        <TabsContent value="acompanhamento">
          <FollowUpTab b={b} extras={extras} />
        </TabsContent>
        <TabsContent value="documentos">
          <DocumentsTab b={b} extras={extras} />
        </TabsContent>
        <TabsContent value="consentimentos">
          <ConsentTab b={b} extras={extras} />
        </TabsContent>
        <TabsContent value="historico">
          <HistoryTab extras={extras} />
        </TabsContent>

        <TabsContent value="interacoes">
          {/* Interacções */}
          <section>
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-display text-lg font-semibold text-ink">
                Interacções ({b.interactions.length})
              </h2>
              <Button
                onClick={() => setShowForm((s) => !s)}
                intent={showForm ? 'secondary' : 'primary'}
              >
                {showForm ? 'Cancelar' : '+ Nova Interacção'}
              </Button>
            </div>

            {showForm && (
              <form onSubmit={submitInteraction} className="mb-4 space-y-3">
                <Card>
                  <CardBody className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Select
                        value={form.type}
                        onValueChange={(value) =>
                          setForm({ ...form, type: value })
                        }
                        items={INTERACTION_TYPE_OPTIONS}
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
                      placeholder="Canal (ex.: Linha de apoio, Balcão)"
                      value={form.channel}
                      onChange={(e) =>
                        setForm({ ...form, channel: e.target.value })
                      }
                    />
                    <Input
                      placeholder="Resultado (opcional)"
                      value={form.outcome}
                      onChange={(e) =>
                        setForm({ ...form, outcome: e.target.value })
                      }
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <Input
                        placeholder="Próxima acção"
                        value={form.nextAction}
                        onChange={(e) =>
                          setForm({ ...form, nextAction: e.target.value })
                        }
                      />
                      <Field label="Data da próxima acção">
                        <Input
                          type="date"
                          value={form.nextActionDate}
                          onChange={(e) =>
                            setForm({ ...form, nextActionDate: e.target.value })
                          }
                        />
                      </Field>
                    </div>
                    <Textarea
                      rows={2}
                      placeholder="Observações"
                      value={form.notes}
                      onChange={(e) =>
                        setForm({ ...form, notes: e.target.value })
                      }
                    />
                    <Button type="submit">Guardar Interacção</Button>
                  </CardBody>
                </Card>
              </form>
            )}

            <Card>
              <div className="divide-y divide-border">
                {b.interactions.length === 0 ? (
                  <p className="p-4 font-body text-ink-faint">
                    Sem interacções registadas
                  </p>
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
                      <p className="font-body text-sm text-ink-muted mt-1">
                        {it.description}
                      </p>
                      <div className="flex gap-4 mt-1 font-body text-xs text-ink-faint">
                        {it.user?.fullName && (
                          <span>Por: {it.user.fullName}</span>
                        )}
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
