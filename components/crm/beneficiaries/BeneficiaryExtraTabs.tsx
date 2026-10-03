// components/crm/beneficiaries/BeneficiaryExtraTabs.tsx
// Separadores do detalhe do beneficiário (docs/modulo_crm_beneficiario.md):
// Perfil, Benefícios, Programas, Acompanhamento, Documentos, Consentimentos,
// Histórico. A lógica de rede vive em useBeneficiaryDetail().extras.

import { useState } from 'react';
import { cn } from '@/lib/cn';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Field, Info, formatDate, formatMoney } from '@/components/crm/shared';
import type { useBeneficiaryDetail } from '@/hooks/useBeneficiaryDetail';
import type { BeneficiaryDetail } from './types';
import {
  COMMUNICATION_CHANNELS,
  CONSENT_STATUS_OPTIONS,
  CREATE_SECTIONS,
  FOLLOW_UP_FIELDS,
  provinceOptions,
  type FieldDef,
} from './formConfig';
import { FieldRenderer } from './FieldRenderer';

export type BeneficiaryExtras = ReturnType<
  typeof useBeneficiaryDetail
>['extras'];

interface TabProps {
  b: BeneficiaryDetail;
  extras: BeneficiaryExtras;
}

function displayValue(def: FieldDef, raw: unknown): string {
  if (raw == null || raw === '') return '—';
  if (def.kind === 'date') return formatDate(String(raw));
  if (def.kind === 'province') return String(raw).replace(/_/g, ' ');
  if (def.kind === 'select') {
    return def.options?.find((o) => o.value === raw)?.label ?? String(raw);
  }
  return String(raw);
}

/** Valores iniciais de um formulário de edição a partir do detalhe. */
function formFrom(b: BeneficiaryDetail, fields: FieldDef[]) {
  const out: Record<string, string> = {};
  for (const f of fields) {
    const v = b[f.key];
    out[f.key] =
      v == null ? '' : f.kind === 'date' ? String(v).slice(0, 10) : String(v);
  }
  return out;
}

const KIND_LABELS: Record<string, string> = {
  BENEFIT: 'Benefício',
  SERVICE: 'Serviço',
  PROGRAM: 'Programa',
  TRAINING: 'Formação',
  COURSE: 'Curso',
  SCHOLARSHIP: 'Bolsa',
  SUPPORT: 'Apoio',
};
const BENEFIT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendente',
  ACTIVE: 'Activo',
  SUSPENDED: 'Suspenso',
  ENDED: 'Terminado',
};
const PARTICIPATION_STATUS_LABELS: Record<string, string> = {
  ENROLLED: 'Inscrito',
  IN_PROGRESS: 'Em curso',
  COMPLETED: 'Concluído',
  DROPPED: 'Desistiu',
  SUSPENDED: 'Suspenso',
};
const VALIDATION_LABELS: Record<string, string> = {
  PENDING: 'Por validar',
  VALID: 'Válido',
  INVALID: 'Inválido',
  EXPIRED: 'Expirado',
};

function RowList({
  empty,
  children,
}: {
  empty: string;
  children: React.ReactNode[];
}) {
  return (
    <Card>
      <div className="divide-y divide-border">
        {children.length === 0 ? (
          <p className="p-4 font-body text-ink-faint">{empty}</p>
        ) : (
          children
        )}
      </div>
    </Card>
  );
}

function SectionHeader({
  title,
  open,
  onToggle,
  addLabel,
}: {
  title: string;
  open: boolean;
  onToggle: () => void;
  addLabel: string;
}) {
  return (
    <div className="flex justify-between items-center mb-3">
      <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
      <Button onClick={onToggle} intent={open ? 'secondary' : 'primary'}>
        {open ? 'Cancelar' : addLabel}
      </Button>
    </div>
  );
}

// ─── Perfil (leitura) ───────────────────────────────────────────────────────

export function ProfileTab({ b }: { b: BeneficiaryDetail }) {
  return (
    <div className="space-y-6">
      {CREATE_SECTIONS.map((section) => (
        <Card key={section.id}>
          <CardBody>
            <h2 className="font-display text-lg font-semibold text-ink mb-4">
              {section.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {section.fields.map((def) => (
                <Info
                  key={def.key}
                  label={def.label.replace(/ \*$/, '')}
                  value={displayValue(def, b[def.key])}
                />
              ))}
              {section.id === 'classificacao' && (
                <>
                  <Info
                    label="Gestor de conta"
                    value={b.accountManager?.fullName}
                  />
                  <Info label="Responsável" value={b.assignedTo?.fullName} />
                </>
              )}
            </div>
          </CardBody>
        </Card>
      ))}
      <Card>
        <CardBody className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Info
            label="Satisfação média"
            value={b.satisfactionAvg ? b.satisfactionAvg.toFixed(1) : '—'}
          />
          <Info
            label="Último contacto"
            value={b.lastContactAt ? formatDate(b.lastContactAt) : '—'}
          />
          <Info
            label="Elegível"
            value={b.isEligible == null ? '—' : b.isEligible ? 'Sim' : 'Não'}
          />
          <Info
            label="Total de apoios"
            value={formatMoney(b.totalBenefits, b.currency)}
          />
          <Info label="Criado por" value={b.createdBy?.fullName} />
          <Info label="Data de criação" value={formatDate(b.createdAt)} />
          <Info label="Actualizado por" value={b.updatedBy?.fullName} />
          <Info label="Última actualização" value={formatDate(b.updatedAt)} />
        </CardBody>
      </Card>
    </div>
  );
}

// ─── Benefícios / serviços ──────────────────────────────────────────────────

const EMPTY_BENEFIT = {
  kind: 'BENEFIT',
  name: '',
  amount: '',
  awardedAt: '',
  startDate: '',
  endDate: '',
  status: 'ACTIVE',
  notes: '',
};

export function BenefitsTab({ b, extras }: TabProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_BENEFIT);
  const set = (k: keyof typeof EMPTY_BENEFIT, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const body: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(form)) {
      if (v === '') continue;
      body[k] = k === 'amount' ? Number(v) : v;
    }
    extras.addSub.mutate(
      { path: `${b.id}/benefits`, body },
      {
        onSuccess: () => {
          setOpen(false);
          setForm(EMPTY_BENEFIT);
        },
      },
    );
  }

  return (
    <section>
      <SectionHeader
        title={`Benefícios e serviços (${b.benefits.length})`}
        open={open}
        onToggle={() => setOpen((o) => !o)}
        addLabel="+ Atribuir"
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        <Info
          label="Total de apoios"
          value={formatMoney(b.totalBenefits, b.currency)}
        />
        <Info
          label="Elegibilidade"
          value={
            b.isEligible == null
              ? '—'
              : b.isEligible
                ? 'Elegível'
                : 'Não elegível'
          }
        />
        <Info
          label="Critérios de elegibilidade"
          value={b.eligibilityCriteria as string | null}
        />
      </div>

      {open && (
        <form onSubmit={submit} className="mb-4">
          <Card>
            <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Tipo *">
                <Select
                  value={form.kind}
                  onValueChange={(v) => set('kind', v)}
                  items={Object.entries(KIND_LABELS).map(([value, label]) => ({
                    value,
                    label,
                  }))}
                />
              </Field>
              <Field label="Designação *">
                <Input
                  required
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                />
              </Field>
              <Field label="Valor do apoio">
                <Input
                  type="number"
                  min={0}
                  value={form.amount}
                  onChange={(e) => set('amount', e.target.value)}
                />
              </Field>
              <Field label="Estado">
                <Select
                  value={form.status}
                  onValueChange={(v) => set('status', v)}
                  items={Object.entries(BENEFIT_STATUS_LABELS).map(
                    ([value, label]) => ({ value, label }),
                  )}
                />
              </Field>
              <Field label="Data de atribuição">
                <Input
                  type="date"
                  value={form.awardedAt}
                  onChange={(e) => set('awardedAt', e.target.value)}
                />
              </Field>
              <Field label="Data de início">
                <Input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => set('startDate', e.target.value)}
                />
              </Field>
              <Field label="Data de fim">
                <Input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => set('endDate', e.target.value)}
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Observações">
                  <Textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => set('notes', e.target.value)}
                  />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Button type="submit" disabled={extras.addSub.isPending}>
                  {extras.addSub.isPending ? 'A guardar...' : 'Guardar'}
                </Button>
              </div>
            </CardBody>
          </Card>
        </form>
      )}

      <RowList empty="Sem benefícios atribuídos">
        {b.benefits.map((x) => (
          <div
            key={x.id}
            className="p-4 flex justify-between items-start gap-4"
          >
            <div>
              <p className="font-body font-medium text-ink">
                <span className="font-body text-xs bg-surface-sunken text-ink-muted px-2 py-0.5 rounded mr-2">
                  {KIND_LABELS[x.kind] ?? x.kind}
                </span>
                {x.name}
              </p>
              <p className="font-body text-xs text-ink-muted mt-1">
                {x.amount != null && `${formatMoney(x.amount, x.currency)} · `}
                {x.awardedAt && `Atribuído ${formatDate(x.awardedAt)} · `}
                {x.startDate && `Início ${formatDate(x.startDate)} · `}
                {x.endDate && `Fim ${formatDate(x.endDate)}`}
              </p>
              {x.notes && (
                <p className="font-body text-sm text-ink-muted mt-1">
                  {x.notes}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-body text-xs font-semibold">
                {BENEFIT_STATUS_LABELS[x.status] ?? x.status}
              </span>
              {x.status !== 'ENDED' && (
                <Button
                  size="sm"
                  intent="secondary"
                  onClick={() =>
                    extras.putSub.mutate({
                      path: `benefits/${x.id}`,
                      body: {
                        status: 'ENDED',
                        endDate: new Date().toISOString().slice(0, 10),
                      },
                    })
                  }
                >
                  Terminar
                </Button>
              )}
              <Button
                size="sm"
                intent="danger"
                onClick={() =>
                  extras.removeSub.mutate({ path: `benefits/${x.id}` })
                }
              >
                Remover
              </Button>
            </div>
          </div>
        ))}
      </RowList>
    </section>
  );
}

// ─── Participações em programas / formação ──────────────────────────────────

const EMPTY_PARTICIPATION = {
  program: '',
  project: '',
  province: '',
  municipality: '',
  locality: '',
  cohort: '',
  programEdition: '',
  enrolledAt: '',
  startDate: '',
  completedAt: '',
  status: 'ENROLLED',
  attendanceRate: '',
  performance: '',
  certification: '',
  employability: '',
  referral: '',
  finalResult: '',
  impact: '',
};

const PARTICIPATION_FIELDS: {
  key: keyof typeof EMPTY_PARTICIPATION;
  label: string;
  kind?: 'date' | 'number' | 'province' | 'status' | 'textarea';
}[] = [
  { key: 'program', label: 'Programa *' },
  { key: 'project', label: 'Projecto' },
  { key: 'province', label: 'Província', kind: 'province' },
  { key: 'municipality', label: 'Município' },
  { key: 'locality', label: 'Localidade' },
  { key: 'cohort', label: 'Turma' },
  { key: 'programEdition', label: 'Edição do programa' },
  { key: 'enrolledAt', label: 'Data de inscrição', kind: 'date' },
  { key: 'startDate', label: 'Data de início', kind: 'date' },
  { key: 'completedAt', label: 'Data de conclusão', kind: 'date' },
  { key: 'status', label: 'Estado da participação', kind: 'status' },
  { key: 'attendanceRate', label: 'Presença (%)', kind: 'number' },
  { key: 'performance', label: 'Aproveitamento' },
  { key: 'certification', label: 'Certificação' },
  { key: 'employability', label: 'Empregabilidade' },
  { key: 'referral', label: 'Encaminhamento' },
  { key: 'finalResult', label: 'Resultado final', kind: 'textarea' },
  { key: 'impact', label: 'Impacto gerado', kind: 'textarea' },
];

export function ParticipationsTab({ b, extras }: TabProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_PARTICIPATION);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const body: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(form)) {
      if (v === '') continue;
      body[k] = k === 'attendanceRate' ? Number(v) : v;
    }
    extras.addSub.mutate(
      { path: `${b.id}/participations`, body },
      {
        onSuccess: () => {
          setOpen(false);
          setForm(EMPTY_PARTICIPATION);
        },
      },
    );
  }

  return (
    <section>
      <SectionHeader
        title={`Programas e formação (${b.participations.length})`}
        open={open}
        onToggle={() => setOpen((o) => !o)}
        addLabel="+ Nova participação"
      />

      {open && (
        <form onSubmit={submit} className="mb-4">
          <Card>
            <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {PARTICIPATION_FIELDS.map((f) => {
                const value = form[f.key];
                const onChange = (v: string) =>
                  setForm((s) => ({ ...s, [f.key]: v }));
                let control: React.ReactNode;
                if (f.kind === 'province') {
                  control = (
                    <Select
                      value={value}
                      onValueChange={onChange}
                      items={provinceOptions}
                    />
                  );
                } else if (f.kind === 'status') {
                  control = (
                    <Select
                      value={value}
                      onValueChange={onChange}
                      items={Object.entries(PARTICIPATION_STATUS_LABELS).map(
                        ([v, label]) => ({ value: v, label }),
                      )}
                    />
                  );
                } else if (f.kind === 'textarea') {
                  control = (
                    <Textarea
                      rows={2}
                      value={value}
                      onChange={(e) => onChange(e.target.value)}
                    />
                  );
                } else {
                  control = (
                    <Input
                      required={f.key === 'program'}
                      type={
                        f.kind === 'date'
                          ? 'date'
                          : f.kind === 'number'
                            ? 'number'
                            : 'text'
                      }
                      min={f.kind === 'number' ? 0 : undefined}
                      max={f.kind === 'number' ? 100 : undefined}
                      value={value}
                      onChange={(e) => onChange(e.target.value)}
                    />
                  );
                }
                return (
                  <div
                    key={f.key}
                    className={
                      f.kind === 'textarea' ? 'md:col-span-2' : undefined
                    }
                  >
                    <Field label={f.label}>{control}</Field>
                  </div>
                );
              })}
              <div className="md:col-span-2">
                <Button type="submit" disabled={extras.addSub.isPending}>
                  {extras.addSub.isPending ? 'A guardar...' : 'Guardar'}
                </Button>
              </div>
            </CardBody>
          </Card>
        </form>
      )}

      <RowList empty="Sem participações registadas">
        {b.participations.map((p) => (
          <div key={p.id} className="p-4">
            <div className="flex justify-between items-start gap-4">
              <div>
                <p className="font-body font-medium text-ink">
                  {p.program}
                  {p.programEdition && ` — ${p.programEdition}`}
                </p>
                <p className="font-body text-xs text-ink-muted mt-1">
                  {[
                    p.project,
                    p.cohort && `Turma ${p.cohort}`,
                    p.municipality,
                    p.province?.replace(/_/g, ' '),
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="font-body text-xs font-semibold">
                  {PARTICIPATION_STATUS_LABELS[p.status] ?? p.status}
                </span>
                {p.status !== 'COMPLETED' && (
                  <Button
                    size="sm"
                    intent="secondary"
                    onClick={() =>
                      extras.putSub.mutate({
                        path: `participations/${p.id}`,
                        body: {
                          program: p.program,
                          status: 'COMPLETED',
                          completedAt: new Date().toISOString().slice(0, 10),
                        },
                      })
                    }
                  >
                    Concluir
                  </Button>
                )}
                <Button
                  size="sm"
                  intent="danger"
                  onClick={() =>
                    extras.removeSub.mutate({ path: `participations/${p.id}` })
                  }
                >
                  Remover
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
              <Info
                label="Inscrição"
                value={p.enrolledAt ? formatDate(p.enrolledAt) : '—'}
              />
              <Info
                label="Início"
                value={p.startDate ? formatDate(p.startDate) : '—'}
              />
              <Info
                label="Conclusão"
                value={p.completedAt ? formatDate(p.completedAt) : '—'}
              />
              <Info
                label="Presença"
                value={p.attendanceRate != null ? `${p.attendanceRate}%` : '—'}
              />
              <Info label="Aproveitamento" value={p.performance} />
              <Info label="Certificação" value={p.certification} />
              <Info label="Empregabilidade" value={p.employability} />
              <Info label="Encaminhamento" value={p.referral} />
              <Info label="Resultado final" value={p.finalResult} />
              <Info label="Impacto gerado" value={p.impact} />
            </div>
          </div>
        ))}
      </RowList>
    </section>
  );
}

// ─── Documentos ─────────────────────────────────────────────────────────────

const EMPTY_DOC = {
  name: '',
  type: '',
  fileUrl: '',
  documentNumber: '',
  issuedAt: '',
  expiresAt: '',
  notes: '',
};

export function DocumentsTab({ b, extras }: TabProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_DOC);
  const set = (k: keyof typeof EMPTY_DOC, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const body = Object.fromEntries(
      Object.entries(form).filter(([, v]) => v !== ''),
    );
    extras.addSub.mutate(
      { path: `${b.id}/documents`, body },
      {
        onSuccess: () => {
          setOpen(false);
          setForm(EMPTY_DOC);
        },
      },
    );
  }

  return (
    <section>
      <SectionHeader
        title={`Documentos (${b.documents.length})`}
        open={open}
        onToggle={() => setOpen((o) => !o)}
        addLabel="+ Novo documento"
      />

      {open && (
        <form onSubmit={submit} className="mb-4">
          <Card>
            <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Nome *">
                <Input
                  required
                  value={form.name}
                  onChange={(e) => set('name', e.target.value)}
                />
              </Field>
              <Field label="Tipo de documento *">
                <Input
                  required
                  placeholder="Ex.: BI, Passaporte, Comprovativo"
                  value={form.type}
                  onChange={(e) => set('type', e.target.value)}
                />
              </Field>
              <Field label="Ficheiro (URL) *">
                <Input
                  required
                  value={form.fileUrl}
                  onChange={(e) => set('fileUrl', e.target.value)}
                />
              </Field>
              <Field label="Número do documento">
                <Input
                  value={form.documentNumber}
                  onChange={(e) => set('documentNumber', e.target.value)}
                />
              </Field>
              <Field label="Data de emissão">
                <Input
                  type="date"
                  value={form.issuedAt}
                  onChange={(e) => set('issuedAt', e.target.value)}
                />
              </Field>
              <Field label="Data de validade">
                <Input
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => set('expiresAt', e.target.value)}
                />
              </Field>
              <div className="md:col-span-2">
                <Field label="Observações">
                  <Textarea
                    rows={2}
                    value={form.notes}
                    onChange={(e) => set('notes', e.target.value)}
                  />
                </Field>
              </div>
              <div className="md:col-span-2">
                <Button type="submit" disabled={extras.addSub.isPending}>
                  {extras.addSub.isPending ? 'A guardar...' : 'Guardar'}
                </Button>
              </div>
            </CardBody>
          </Card>
        </form>
      )}

      <RowList empty="Sem documentos">
        {b.documents.map((d) => {
          const status =
            d.validationStatus ?? (d.isVerified ? 'VALID' : 'PENDING');
          return (
            <div
              key={d.id}
              className="p-4 flex justify-between items-start gap-4"
            >
              <div>
                <a
                  href={d.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium font-body text-primary hover:underline"
                >
                  {d.name}
                </a>
                <p className="font-body text-sm text-ink-muted">
                  {d.type}
                  {d.documentNumber && ` · Nº ${d.documentNumber}`}
                </p>
                <p className="font-body text-xs text-ink-faint">
                  {d.issuedAt && `Emitido ${formatDate(d.issuedAt)} · `}
                  {d.expiresAt && `Válido até ${formatDate(d.expiresAt)}`}
                  {d.validatedAt &&
                    ` · Validado por ${d.validatedBy?.fullName ?? '—'} em ${formatDate(d.validatedAt)}`}
                </p>
                {d.notes && (
                  <p className="font-body text-xs text-ink-muted mt-1">
                    {d.notes}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={cn(
                    'font-body text-xs font-semibold',
                    status === 'VALID'
                      ? 'text-success-ink'
                      : status === 'PENDING'
                        ? 'text-ink-faint'
                        : 'text-danger-ink',
                  )}
                >
                  {VALIDATION_LABELS[status] ?? status}
                </span>
                {status !== 'VALID' && (
                  <Button
                    size="sm"
                    intent="secondary"
                    onClick={() =>
                      extras.putSub.mutate({
                        path: `documents/${d.id}/validate`,
                        body: { validationStatus: 'VALID' },
                      })
                    }
                  >
                    Validar
                  </Button>
                )}
                {status !== 'INVALID' && (
                  <Button
                    size="sm"
                    intent="secondary"
                    onClick={() =>
                      extras.putSub.mutate({
                        path: `documents/${d.id}/validate`,
                        body: { validationStatus: 'INVALID' },
                      })
                    }
                  >
                    Rejeitar
                  </Button>
                )}
                <Button
                  size="sm"
                  intent="danger"
                  onClick={() =>
                    extras.removeSub.mutate({ path: `documents/${d.id}` })
                  }
                >
                  Remover
                </Button>
              </div>
            </div>
          );
        })}
      </RowList>
    </section>
  );
}

// ─── Acompanhamento (edição) ────────────────────────────────────────────────

export function FollowUpTab({ b, extras }: TabProps) {
  const [form, setForm] = useState(() => formFrom(b, FOLLOW_UP_FIELDS));
  const [eligible, setEligible] = useState(
    b.isEligible == null ? '' : String(b.isEligible),
  );

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const body: Record<string, unknown> = {};
    for (const f of FOLLOW_UP_FIELDS) {
      // Enviamos só o que tem valor — limpar um campo não é suportado pelo PUT parcial.
      if (form[f.key] !== '') body[f.key] = form[f.key];
    }
    if (eligible !== '') body.isEligible = eligible === 'true';
    extras.patchProfile.mutate(body);
  }

  return (
    <form onSubmit={submit}>
      <Card>
        <CardBody className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FOLLOW_UP_FIELDS.map((def) => (
            <FieldRenderer
              key={def.key}
              def={def}
              value={form[def.key] ?? ''}
              onChange={(v) => setForm((f) => ({ ...f, [def.key]: v }))}
            />
          ))}
          <Field label="Elegibilidade">
            <Select
              value={eligible}
              onValueChange={setEligible}
              items={[
                { value: '', label: '—' },
                { value: 'true', label: 'Elegível' },
                { value: 'false', label: 'Não elegível' },
              ]}
            />
          </Field>
          <Info
            label="Último contacto"
            value={b.lastContactAt ? formatDate(b.lastContactAt) : '—'}
          />
          <div className="md:col-span-2">
            <Button type="submit" disabled={extras.patchProfile.isPending}>
              {extras.patchProfile.isPending
                ? 'A guardar...'
                : 'Guardar acompanhamento'}
            </Button>
          </div>
        </CardBody>
      </Card>
    </form>
  );
}

// ─── Consentimentos e privacidade (edição) ──────────────────────────────────

export function ConsentTab({ b, extras }: TabProps) {
  const [form, setForm] = useState({
    consentDataProcessing: b.consentDataProcessing,
    consentCommunications: b.consentCommunications,
    consentDataSharing: b.consentDataSharing,
    authorizedChannels: b.authorizedChannels ?? [],
    consentStatus: b.consentStatus,
    communicationPreferences: b.communicationPreferences ?? '',
  });

  function toggleChannel(ch: string) {
    setForm((f) => ({
      ...f,
      authorizedChannels: f.authorizedChannels.includes(ch)
        ? f.authorizedChannels.filter((c) => c !== ch)
        : [...f.authorizedChannels, ch],
    }));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    extras.patchProfile.mutate({
      ...form,
      communicationPreferences: form.communicationPreferences || undefined,
    });
  }

  const checks: {
    key:
      'consentDataProcessing' | 'consentCommunications' | 'consentDataSharing';
    label: string;
  }[] = [
    {
      key: 'consentDataProcessing',
      label: 'Consentimento para tratamento de dados',
    },
    { key: 'consentCommunications', label: 'Consentimento para comunicações' },
    {
      key: 'consentDataSharing',
      label: 'Consentimento para partilha de dados',
    },
  ];

  return (
    <form onSubmit={submit}>
      <Card>
        <CardBody className="space-y-4">
          <div className="space-y-2">
            {checks.map((c) => (
              <label
                key={c.key}
                className="flex items-center gap-2 font-body text-sm text-ink"
              >
                <input
                  type="checkbox"
                  checked={form[c.key]}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, [c.key]: e.target.checked }))
                  }
                />
                {c.label}
              </label>
            ))}
          </div>

          <div>
            <p className="font-body text-sm font-medium text-ink mb-2">
              Canais autorizados
            </p>
            <div className="flex flex-wrap gap-4">
              {COMMUNICATION_CHANNELS.map((ch) => (
                <label
                  key={ch.value}
                  className="flex items-center gap-2 font-body text-sm text-ink"
                >
                  <input
                    type="checkbox"
                    checked={form.authorizedChannels.includes(ch.value)}
                    onChange={() => toggleChannel(ch.value)}
                  />
                  {ch.label}
                </label>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Estado do consentimento">
              <Select
                value={form.consentStatus}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, consentStatus: v }))
                }
                items={CONSENT_STATUS_OPTIONS}
              />
            </Field>
            <Info
              label="Data do consentimento"
              value={b.consentAt ? formatDate(b.consentAt) : '—'}
            />
            <Info
              label="Data de revogação"
              value={b.consentRevokedAt ? formatDate(b.consentRevokedAt) : '—'}
            />
          </div>

          <Field label="Preferências de comunicação">
            <Textarea
              rows={2}
              value={form.communicationPreferences}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  communicationPreferences: e.target.value,
                }))
              }
            />
          </Field>

          <Button type="submit" disabled={extras.patchProfile.isPending}>
            {extras.patchProfile.isPending
              ? 'A guardar...'
              : 'Guardar consentimentos'}
          </Button>
        </CardBody>
      </Card>
    </form>
  );
}

// ─── Histórico / registo de actividades ─────────────────────────────────────

const ACTION_LABELS: Record<string, string> = {
  CREATE: 'Criação',
  UPDATE: 'Alteração',
  DELETE: 'Remoção',
};

export function HistoryTab({ extras }: { extras: BeneficiaryExtras }) {
  const { data, isLoading, isError } = extras.history;
  const rows = data?.data ?? [];

  return (
    <section>
      <h2 className="font-display text-lg font-semibold text-ink mb-3">
        Histórico de alterações
      </h2>
      {isLoading ? (
        <p className="font-body text-ink-faint">A carregar…</p>
      ) : isError ? (
        <p className="font-body text-danger-ink">
          Não foi possível carregar o histórico.
        </p>
      ) : (
        <RowList empty="Sem actividade registada">
          {rows.map((h) => (
            <div key={h.id} className="p-4 flex justify-between items-center">
              <span className="font-body text-sm text-ink">
                <span className="font-body text-xs bg-surface-sunken text-ink-muted px-2 py-0.5 rounded mr-2">
                  {ACTION_LABELS[h.action] ?? h.action}
                </span>
                {h.entity.replace(/^Beneficiary/, '') || 'Beneficiário'}
                {h.user?.fullName && ` · ${h.user.fullName}`}
              </span>
              <span className="font-body text-xs text-ink-faint">
                {formatDate(h.createdAt)}
              </span>
            </div>
          ))}
        </RowList>
      )}
    </section>
  );
}
