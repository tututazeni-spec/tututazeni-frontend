// components/courses/RelatoriosView.tsx
// Aba "Relatórios" (docs/modulo_courses.md secção 7, ADMIN/RH). Consome
// GET /courses/reports, que reaproveita as agregações já calculadas em
// getAdminDashboard (cursos mais frequentados, conclusão, horas de
// formação, departamento/unidade) e acrescenta resultados de avaliações,
// taxa de abandono, progresso médio e formação obrigatória pendente — as
// métricas que a Visão Geral (AdminDashboardView) não cobre.

'use client';

import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import type { LucideIcon } from 'lucide-react';
import { CourseBarList, DistributionList } from './relatoriosBarLists';
import { fmtDuration, Skeleton } from './shared';
import type { CourseReports } from './types';

interface RelatoriosViewProps {
  onSelect: (id: number) => void;
}

type Tone = 'blue' | 'green' | 'gold' | 'red';

const TONES: Record<
  Tone,
  { bar: string; text: string; stroke: string; track: string }
> = {
  blue: {
    bar: 'bg-[#2B6CC4]',
    text: 'text-[#2B6CC4]',
    stroke: '#2B6CC4',
    track: '#DBEAFE',
  },
  green: {
    bar: 'bg-[#2E8B3E]',
    text: 'text-[#2E8B3E]',
    stroke: '#2E8B3E',
    track: '#DCFCE7',
  },
  gold: {
    bar: 'bg-[#C9A227]',
    text: 'text-[#B8912A]',
    stroke: '#C9A227',
    track: '#FEF3C7',
  },
  red: {
    bar: 'bg-[#C0453F]',
    text: 'text-[#C0453F]',
    stroke: '#C0453F',
    track: '#FEE2E2',
  },
};

function TopBarKpiCard({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  tone: Tone;
}) {
  const t = TONES[tone];
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-resting">
      <div className={`h-1.5 w-full ${t.bar}`} />
      <div className="p-5 pt-6">
        <Icon size={22} strokeWidth={1.75} className={t.text} />
        <p className={`mt-3 font-display text-3xl font-bold ${t.text}`}>
          {value}
        </p>
        <p className="mt-1 font-body text-sm font-medium text-ink-muted">
          {label}
        </p>
        {sub && <p className="mt-1 font-body text-xs text-ink-faint">{sub}</p>}
      </div>
    </div>
  );
}

function GaugeKpiCard({
  icon: Icon,
  label,
  value,
  percent,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  percent: number;
  tone: Tone;
}) {
  const t = TONES[tone];
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = 30;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-resting">
      <div className={`h-1.5 w-full ${t.bar}`} />
      <div className="flex items-center gap-3 p-5 pt-6">
        <div className="relative h-16 w-16 shrink-0">
          <svg viewBox="0 0 72 72" className="h-full w-full -rotate-90">
            <circle
              cx="36"
              cy="36"
              r={radius}
              fill="none"
              stroke={t.track}
              strokeWidth="8"
            />
            <circle
              cx="36"
              cy="36"
              r={radius}
              fill="none"
              stroke={t.stroke}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <Icon size={18} strokeWidth={1.75} className={t.text} />
          </div>
        </div>
        <div className="min-w-0">
          <p className={`font-display text-2xl font-bold ${t.text}`}>{value}</p>
          <p className="mt-0.5 font-body text-xs font-medium text-ink-muted">
            {label}
          </p>
        </div>
      </div>
    </div>
  );
}

// TODO: substituir por dados reais quando soubermos o campo da API (ex.:
// data.abandonmentTrend) com o histórico mensal da taxa de abandono.
const MOCK_ABANDONMENT_TREND = [18, 21, 19, 24, 22, 20];

function TrendKpiCard({
  icon: Icon,
  label,
  value,
  trendData,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  trendData: number[];
  tone: Tone;
}) {
  const t = TONES[tone];
  const width = 100;
  const height = 28;
  const max = Math.max(...trendData, 1);
  const min = Math.min(...trendData, 0);
  const range = max - min || 1;
  const points = trendData
    .map((v, i) => {
      const x = (i / Math.max(trendData.length - 1, 1)) * width;
      const y = height - ((v - min) / range) * height;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-resting">
      <div className={`h-1.5 w-full ${t.bar}`} />
      <div className="p-5 pt-6">
        <Icon size={22} strokeWidth={1.75} className={t.text} />
        <p className={`mt-3 font-display text-2xl font-bold ${t.text}`}>
          {value}
        </p>
        <p className="mt-1 font-body text-sm font-medium text-ink-muted">
          {label}
        </p>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="mt-2 h-7 w-full"
          preserveAspectRatio="none"
        >
          <polyline
            points={points}
            fill="none"
            stroke={t.stroke}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}

// TODO: ajustar para um alvo real vindo da API (ex.: meta institucional de
// progresso médio), caso exista. Por agora, usa-se um valor de referência.
const PROGRESS_TARGET = 75;

function BulletKpiCard({
  icon: Icon,
  label,
  value,
  percent,
  target,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  percent: number;
  target: number;
  tone: Tone;
}) {
  const t = TONES[tone];
  const clamped = Math.max(0, Math.min(100, percent));
  const targetClamped = Math.max(0, Math.min(100, target));

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-resting">
      <div className={`h-1.5 w-full ${t.bar}`} />
      <div className="p-5 pt-6">
        <Icon size={22} strokeWidth={1.75} className={t.text} />
        <p className={`mt-3 font-display text-2xl font-bold ${t.text}`}>
          {value}
        </p>
        <p className="mt-1 font-body text-sm font-medium text-ink-muted">
          {label}
        </p>
        <div className="relative mt-3 h-3 w-full overflow-hidden rounded-full bg-[#E3E8EF]">
          <div
            className={`h-full rounded-full ${t.bar}`}
            style={{ width: `${clamped}%` }}
          />
          <div
            className="absolute top-0 h-full w-0.5 bg-ink"
            style={{ left: `${targetClamped}%` }}
            title={`Meta: ${target}%`}
          />
        </div>
        <p className="mt-1 font-body text-[10px] text-ink-faint">
          Meta: {target}%
        </p>
      </div>
    </div>
  );
}

// TODO: substituir por dados reais quando soubermos o campo da API (ex.:
// data.evaluationResults.distribution) com a distribuição de notas por
// faixa. Por agora, estima-se um histograma de 5 faixas a partir da média.
function scoreHistogramBins(avgScore: number) {
  const bins = [20, 40, 60, 80, 100];
  return bins.map((max) => {
    const distance = Math.abs(avgScore - max + 10);
    const height = Math.max(10, 100 - distance * 2.5);
    return { label: `${max - 19}-${max}`, height };
  });
}

function HistogramKpiCard({
  icon: Icon,
  label,
  value,
  sub,
  bins,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  sub?: string;
  bins: { label: string; height: number }[];
  tone: Tone;
}) {
  const t = TONES[tone];
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-resting">
      <div className={`h-1.5 w-full ${t.bar}`} />
      <div className="p-5 pt-6">
        <Icon size={22} strokeWidth={1.75} className={t.text} />
        <p className={`mt-3 font-display text-2xl font-bold ${t.text}`}>
          {value}
        </p>
        <p className="mt-1 font-body text-sm font-medium text-ink-muted">
          {label}
        </p>
        {sub && <p className="mt-1 font-body text-xs text-ink-faint">{sub}</p>}
        <div className="mt-3 flex h-10 items-end gap-1">
          {bins.map((b) => (
            <div
              key={b.label}
              className="flex flex-1 flex-col items-center gap-1"
            >
              <div
                className={`w-full rounded-t ${t.bar}`}
                style={{ height: `${b.height}%`, opacity: 0.85 }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
export function RelatoriosView({ onSelect }: RelatoriosViewProps) {
  const { data, isLoading } = useApiQuery<CourseReports>(
    queryKeys.courses.reports(),
    '/courses/reports',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (isLoading || !data) return <Skeleton rows={5} />;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <TopBarKpiCard
          icon={Users}
          label="Formandos por curso"
          value={data.topCourses.length}
          sub="cursos com inscrições"
          tone="blue"
        />
        <GaugeKpiCard
          icon={CheckCircle2}
          label="Taxa de aprovação"
          value={`${data.approvalRate}%`}
          percent={data.approvalRate}
          tone="green"
        />
        <TrendKpiCard
          icon={TrendingDown}
          label="Taxa de abandono"
          value={`${data.abandonmentRate}%`}
          trendData={MOCK_ABANDONMENT_TREND}
          tone={data.abandonmentRate > 20 ? 'red' : 'gold'}
        />
        <BulletKpiCard
          icon={TrendingUp}
          label="Progresso médio"
          value={`${data.avgProgress}%`}
          percent={data.avgProgress}
          target={PROGRESS_TARGET}
          tone="blue"
        />
        <TopBarKpiCard
          icon={Clock}
          label="Horas de formação"
          value={fmtDuration(data.totalLearningHours)}
          tone="blue"
        />
        <HistogramKpiCard
          icon={Award}
          label="Resultados das avaliações"
          value={`${data.evaluationResults.avgScore}%`}
          sub={`${data.evaluationResults.passRate}% aprovação · ${data.evaluationResults.totalAttempts} tentativas`}
          bins={scoreHistogramBins(data.evaluationResults.avgScore)}
          tone="green"
        />
        <TopBarKpiCard
          icon={BookOpen}
          label="Formação obrigatória pendente"
          value={data.mandatoryPending.count}
          sub={`${data.mandatoryPending.courses.length} curso(s)`}
          tone={data.mandatoryPending.count > 0 ? 'gold' : 'green'}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <CourseBarList
          title="Cursos mais frequentados"
          items={data.topCourses.map((c) => ({
            id: c.id,
            title: c.title,
            value: c.enrollments,
          }))}
          suffix=" formandos"
          onSelect={onSelect}
        />
        <CourseBarList
          title="Maior taxa de conclusão"
          items={data.bestCompletion.map((c) => ({
            id: c.id,
            title: c.title,
            value: c.rate,
          }))}
          suffix="%"
          percent
          onSelect={onSelect}
        />
        <CourseBarList
          title="Menor taxa de conclusão"
          items={data.worstCompletion.map((c) => ({
            id: c.id,
            title: c.title,
            value: c.rate,
          }))}
          suffix="%"
          percent
          onSelect={onSelect}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <DistributionList
          title="Formação por departamento"
          items={data.byDepartment.map((d) => ({
            label: d.department,
            count: d.count,
          }))}
        />
        <DistributionList
          title="Formação por unidade"
          items={data.byUnit.map((u) => ({ label: u.unit, count: u.count }))}
        />
        {data.mandatoryPending.courses.length > 0 && (
          <CourseBarList
            title="Formação obrigatória pendente — por curso"
            items={data.mandatoryPending.courses.map((c) => ({
              id: c.id,
              title: c.title,
              value: c.pending,
            }))}
            suffix=" por concluir"
            onSelect={onSelect}
          />
        )}
      </div>
    </div>
  );
}
