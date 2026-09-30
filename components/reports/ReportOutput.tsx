// components/reports/ReportOutput.tsx
// Renderização genérica do resultado de um relatório: insights,
// KPIs de resumo, distribuição por departamento e lista top.
// Extraído de app/(platform)/reports/page.tsx.
//
// O ProgressBar da fundação é mono-cor (usa sempre bg-accent) — a barra
// "Por Departamento" perde a cor índigo original, sem substituto de
// sentido necessário (era só decorativa, não comunicava estado).

'use client';

import type { LucideIcon } from 'lucide-react';
import {
  BarChart2,
  Brain,
  TrendingDown,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  UserX,
} from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import type { ReportData } from './types';

interface ReportOutputProps {
  data: ReportData;
  reportKey: string;
}

// Tradução dos labels dos KPIs de summary. As chaves vêm em camelCase da
// API (src/reports/reports.service.ts) — quem não tiver entrada aqui cai
// no fallback automático (separa por maiúscula e capitaliza a 1ª letra).
const SUMMARY_LABELS: Record<string, string> = {
  // headcount
  total: 'Total',
  active: 'Activos',
  inactive: 'Inactivos',
  newHires: 'Novas Contratações',
  newHiresTrend: 'Tendência de Contratações',
  turnoverRate: 'Taxa de Rotatividade',
  // turnover
  newInPeriod: 'Admissões no Período',
  leftInPeriod: 'Saídas no Período',
  retentionRate: 'Taxa de Retenção',
  // training
  enrollments: 'Inscrições',
  completed: 'Concluídos',
  inProgress: 'Em Curso',
  cancelled: 'Cancelados',
  completionRate: 'Taxa de Conclusão',
  abandonment: 'Taxa de Abandono',
  uniqueLearners: 'Formandos Únicos',
  // engagement
  activeSurveys: 'Inquéritos Activos',
  totalResponses: 'Respostas Totais',
  participationRate: 'Taxa de Participação',
  totalUsers: 'Total de Utilizadores',
  recognitions: 'Reconhecimentos',
  feedbackCount: 'Feedbacks',
  // talent
  hiPos: 'Talentos de Alto Potencial',
  hiPoRatio: 'Rácio de Talentos de Alto Potencial',
  activePlans: 'PDIs Activos',
  completedPlans: 'PDIs Concluídos',
  pdpCoverage: 'Cobertura de PDI',
  succession: 'Planos de Sucessão',
  avgCompetency: 'Competência Média',
  avgPerformance: 'Performance Média',
  // compliance
  mandatoryTotal: 'Formações Obrigatórias',
  mandatoryCompleted: 'Obrigatórias Concluídas',
  mandatoryRate: 'Taxa de Conformidade',
  auditEvents: 'Eventos de Auditoria',
  certificationsIssued: 'Certificações Emitidas',
  // platform usage
  contentViews: 'Visualizações de Conteúdo',
  avatarSessions: 'Sessões de Avatar',
  surveySubmissions: 'Respostas a Inquéritos',
  auditActions: 'Acções de Auditoria',
  activeUsers: 'Utilizadores Activos',
  // performance
  totalReviews: 'Avaliações Totais',
  avgScore: 'Pontuação Média',
  // evaluations (avaliações formais)
  totalAttempts: 'Tentativas Totais',
  passRate: 'Taxa de Aprovação',
};

type Tone = 'blue' | 'green' | 'gold' | 'red';

const TONES: Record<Tone, { bar: string; text: string }> = {
  blue: { bar: 'bg-[#2B6CC4]', text: 'text-[#2B6CC4]' },
  green: { bar: 'bg-[#2E8B3E]', text: 'text-[#2E8B3E]' },
  gold: { bar: 'bg-[#C9A227]', text: 'text-[#B8912A]' },
  red: { bar: 'bg-[#C0453F]', text: 'text-[#C0453F]' },
};

const KEY_STYLE: Record<string, { icon: LucideIcon; tone: Tone }> = {
  total: { icon: Users, tone: 'blue' },
  active: { icon: UserCheck, tone: 'green' },
  inactive: { icon: UserX, tone: 'red' },
  newHires: { icon: UserPlus, tone: 'green' },
  newHiresTrend: { icon: TrendingUp, tone: 'gold' },
  turnoverRate: { icon: TrendingDown, tone: 'red' },
};

const DEFAULT_KEY_STYLE: { icon: LucideIcon; tone: Tone } = {
  icon: BarChart2,
  tone: 'blue',
};
export function ReportOutput({ data }: ReportOutputProps) {
  const summary = data.summary ?? {};

  return (
    <div className="space-y-4">
      {/* Insights */}
      {(data.insights ?? []).length > 0 && (
        <div className="rounded-card border border-accent-subtle bg-accent-subtle p-4">
          <h4 className="mb-2 flex items-center gap-1 font-body text-xs font-semibold uppercase tracking-wide text-accent">
            <Brain size={12} strokeWidth={1.75} />
            Análises
          </h4>
          {(data.insights ?? []).map((ins, i) => (
            <p key={i} className="mb-1 font-body text-xs text-accent">
              {ins}
            </p>
          ))}
        </div>
      )}

      {/* Summary KPIs */}
           <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Object.entries(summary)
          .slice(0, 8)
          .map(([k, v]) => {
            if (typeof v === 'object') return null;
            const label =
              SUMMARY_LABELS[k] ??
              k
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, (c) => c.toUpperCase());
            const isRate =
              k.toLowerCase().includes('rate') ||
              k.toLowerCase().includes('pct') ||
              k.toLowerCase().includes('ratio');
            const style = KEY_STYLE[k] ?? DEFAULT_KEY_STYLE;
            const Icon = style.icon;
            const t = TONES[style.tone];
            return (
              <div
                key={k}
                className="overflow-hidden rounded-2xl border border-border bg-white shadow-resting"
              >
                <div className={`h-1.5 w-full ${t.bar}`} />
                <div className="p-5 pt-6">
                  <Icon size={22} strokeWidth={1.75} className={t.text} />
                  <p className={`mt-3 font-display text-2xl font-bold ${t.text}`}>
                    {typeof v === 'number' ? (isRate ? `${v}%` : v) : String(v)}
                  </p>
                  <p className="mt-1 font-body text-xs font-medium text-ink-muted">
                    {label}
                  </p>
                </div>
              </div>
            );
          })}
      </div>

      {/* By Department */}
      {(data.byDepartment ?? []).length > 0 && (
        <Card>
          <CardBody>
            <h4 className="mb-4 font-display font-semibold text-ink">
              Por Departamento
            </h4>
            <div className="space-y-2">
              {(data.byDepartment ?? []).slice(0, 8).map((d, i) => {
                const val = d.count ?? d.avgScore ?? d.completions ?? 0;
                const max = Math.max(
                  ...(data.byDepartment ?? []).map(
                    (x) => x.count ?? x.avgScore ?? x.completions ?? 0,
                  ),
                );
                return (
                  <div key={i}>
                    <div className="mb-0.5 flex justify-between text-xs">
                      <span className="truncate font-body text-ink-muted">
                        {d.department ?? d.name}
                      </span>
                      <span className="font-body font-semibold text-ink">
                        {typeof val === 'number'
                          ? val > 10
                            ? val
                            : val.toFixed(1)
                          : val}
                      </span>
                    </div>
                    <ProgressBar value={max > 0 ? (val / max) * 100 : 0} />
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Top list */}
      {(
        data.topPerformers ??
        data.topCourses ??
        data.skills ??
        data.topContent ??
        []
      ).length > 0 && (
        <Card>
          <CardBody>
            <h4 className="mb-4 font-display font-semibold text-ink">
              {data.topPerformers
                ? 'Top Performers'
                : data.topCourses
                  ? 'Top Cursos'
                  : data.skills
                    ? 'Lacunas Críticas'
                    : 'Top Conteúdos'}
            </h4>
            <div className="space-y-2">
              {(
                data.topPerformers ??
                data.topCourses ??
                (data.skills ?? []).slice(0, 8) ??
                data.topContent ??
                []
              ).map((item, i) => {
                const name =
                  item.user?.fullName ??
                  item.course?.title ??
                  item.competency?.name ??
                  item.content?.title ??
                  item.name ??
                  `Item ${i + 1}`;
                const val =
                  item.score ??
                  item.avgScore ??
                  item.completionRate ??
                  item.views ??
                  item.avgGap ??
                  0;
                const sub =
                  item.user?.department?.name ??
                  item.course?.category ??
                  item.competency?.type ??
                  '';
                const isGap = !!data.skills;
                const valueClass = isGap
                  ? val >= 2
                    ? 'text-danger'
                    : 'text-warning'
                  : typeof val === 'number' && val >= 70
                    ? 'text-success'
                    : 'text-ink';
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-5 text-right font-body text-xs font-bold text-ink-faint">
                      #{i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-body text-xs font-medium text-ink">
                        {name}
                      </p>
                      {sub && (
                        <p className="font-body text-[10px] text-ink-faint">
                          {sub}
                        </p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 font-body text-sm font-bold ${valueClass}`}
                    >
                      {typeof val === 'number'
                        ? val > 10
                          ? val
                          : val.toFixed(1)
                        : val}
                      {isGap ? ' gap' : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
