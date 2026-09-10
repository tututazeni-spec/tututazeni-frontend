// components/leadership/SettingsView.tsx
// Separador "Configurações": resumo só-leitura do modelo de desenvolvimento
// do programa (público-alvo, critérios, competências, objetivos, conteúdos,
// metodologias, equipa). A edição faz-se no assistente do programa.

'use client';

import { Card } from '@/components/ui/Card';
import { CRITERION_SOURCE_ITEMS, METHODOLOGY_ITEMS, TARGETING_SCOPE_ITEMS } from './constants';
import type { LeadershipProgramDetail } from './types';

export interface SettingsViewProps {
  detail: LeadershipProgramDetail;
}

const label = (items: Array<{ value: string; label: string }>, v: string) =>
  items.find((i) => i.value === v)?.label ?? v;

export function SettingsView({ detail }: SettingsViewProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Section title={`Público-alvo (${detail.targeting.length})`}>
        {detail.targeting.map((t) => (
          <li key={t.id}>
            {label(TARGETING_SCOPE_ITEMS, t.scope)}
            {t.description ? ` — ${t.description}` : ''}
          </li>
        ))}
      </Section>

      <Section title={`Critérios de seleção (${detail.selectionCriteria.length})`}>
        {detail.selectionCriteria.map((c) => (
          <li key={c.id}>
            {c.name} · {label(CRITERION_SOURCE_ITEMS, c.source)} · peso {c.weight}
            {c.active ? '' : ' (inativo)'}
          </li>
        ))}
      </Section>

      <Section title={`Competências (${detail.competencies.length})`}>
        {detail.competencies.map((c) => (
          <li key={c.id}>
            {c.competency?.name ?? `#${c.competencyId}`} → nível {c.targetLevel}
          </li>
        ))}
      </Section>

      <Section title={`Objetivos (${detail.objectives.length})`}>
        {detail.objectives.map((o) => (
          <li key={o.id}>
            {o.title}
            {o.indicator ? ` — ${o.indicator}` : ''}
          </li>
        ))}
      </Section>

      <Section title={`Conteúdos (${detail.contents.length})`}>
        {detail.contents.map((c) => (
          <li key={c.id}>
            {c.contentType}: {c.course?.title ?? c.learningPath?.title ?? c.title ?? '—'}
          </li>
        ))}
      </Section>

      <Section title={`Metodologias (${detail.methodologies.length})`}>
        {detail.methodologies.map((m) => (
          <li key={m.id}>
            {label(METHODOLOGY_ITEMS, m.type)}
            {m.weight != null ? ` · peso ${m.weight}` : ''}
          </li>
        ))}
      </Section>

      <Section title={`Equipa (${detail.advisors.length})`}>
        {detail.advisors.map((a) => (
          <li key={a.id}>
            {a.user.fullName} — {a.role}
          </li>
        ))}
      </Section>

      <Section title="Critérios de conclusão">
        <li>Presença mínima: {detail.minAttendanceRate ?? '—'}%</li>
        <li>Nota final mínima: {detail.minFinalScore ?? '—'}%</li>
        <li>Projeto final: {detail.requireFinalProject ? 'obrigatório' : 'opcional'}</li>
        <li>Certificado: {detail.certificationEnabled ? detail.certificateTitle ?? 'ativo' : 'inativo'}</li>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const items = Array.isArray(children) ? children : [children];
  return (
    <Card className="p-4">
      <h4 className="mb-2 font-body text-sm font-semibold text-ink">{title}</h4>
      {items.flat().filter(Boolean).length === 0 ? (
        <p className="font-body text-xs text-ink-faint">Sem entradas.</p>
      ) : (
        <ul className="space-y-1 font-body text-xs text-ink-muted">{children}</ul>
      )}
    </Card>
  );
}
