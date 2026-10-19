// components/roi-impact/ExecutiveTab.tsx
// Tab "Executivo": ROI hero, breakdown por domínio, alertas e
// insights automáticos. Extraído de app/(platform)/roi-impact/page.tsx.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import {
  CircleAlert,
  CircleCheck,
  Clock,
  GraduationCap,
  Info,
  Lightbulb,
  Target,
  TrendingUp,
  TriangleAlert,
  UserCheck,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { DonutStatCard } from '@/components/ui/charts/DonutStatCard';
import {
  SpeedometerStatCard,
  TURNOVER_BANDS,
  TURNOVER_MAX,
} from '@/components/ui/charts/SpeedometerStatCard';
import { NavyStatCard, type NavyStatTone } from '@/components/ui/NavyStatCard';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';
import { BarChart } from '@/components/ui/charts/BarChart';
import { categoricalColor } from '@/components/ui/charts/palette';
import {
  CONFIDENCE_LABELS,
  INITIATIVE_TYPE_LABELS,
  fmt$,
  ptInsight,
} from './utils';
import { RoiTotalCard } from './RoiTotalCard';
import { NavyPanel, NavyPanelRow } from './NavyPanel';
import type { ExecutiveData } from './types';

const ALERT_INTENT_CLASSES = {
  danger: {
    card: 'border-danger bg-danger-subtle',
    text: 'text-ink',
  },
  warning: {
    card: 'border-warning bg-warning-subtle',
    text: 'text-ink',
  },
} as const;

// Cor do ponto de confiança, na mesma paleta do estado do ROI Total.
const CONFIDENCE_DOT: Record<string, string> = {
  HIGH: '#34D399',
  MEDIUM: '#FBBF24',
  LOW: '#F87171',
};

export function ExecutiveTab() {
  const { data, isLoading: loading } = useApiQuery<ExecutiveData>(
    queryKeys.roiImpact.executive(),
    '/roi-impact/executive',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  if (loading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="grid grid-cols-2 gap-4 md:grid-cols-4"
        itemClassName="h-24 rounded-card bg-surface-sunken"
      />
    );

  const h = data?.headline ?? {};
  const d = data?.domains ?? {};

  const cards: {
    label: string;
    value: string;
    sub?: string;
    icon: LucideIcon;
    tone: NavyStatTone;
    /** Cards com gráfico próprio em vez do NavyStatCard. */
    chart?: 'donut' | 'speedometer';
    rate?: number;
  }[] = [
    {
      label: 'Aprendizagem',
      value: `${d.learning?.roi ?? 0}%`,
      sub: `${fmt$(d.learning?.cost ?? 0)} investido · ${d.learning?.completions ?? 0} conclusões`,
      icon: GraduationCap,
      tone: 'blue',
      chart: 'donut',
      rate: d.learning?.roi ?? 0,
    },
    {
      label: 'Retenção',
      value: fmt$(d.retention?.savedValue ?? 0),
      sub: `Valor poupado: ${fmt$(d.retention?.savedValue ?? 0)}`,
      icon: UserCheck,
      tone: 'green',
      chart: 'speedometer',
      rate: d.retention?.turnoverRate ?? 0,
    },
    {
      label: 'Performance',
      value: d.performance?.lift ? `+${d.performance.lift}pts` : '–',
      sub: `Benefício produtivo: ${fmt$(d.performance?.benefit ?? 0)}`,
      icon: TrendingUp,
      tone: 'orange',
    },
    {
      label: 'Custo por colaborador formado',
      value: h.costPerLearner != null ? fmt$(h.costPerLearner) : '—',
      icon: Wallet,
      tone: 'blue',
    },
    {
      label: 'Custo por hora de formação',
      value: h.costPerHour != null ? fmt$(h.costPerHour) : '—',
      icon: Clock,
      tone: 'blue',
    },
    {
      label: 'Colaboradores impactados',
      value: String(h.impactedEmployees ?? 0),
      icon: Users,
      tone: 'green',
    },
    {
      label: 'Iniciativas em medição',
      value: String(h.activeMeasuring ?? 0),
      icon: Target,
      tone: 'orange',
    },
    {
      label: 'Iniciativas com ROI positivo',
      value: String(h.positiveRoiInitiatives ?? 0),
      icon: CircleCheck,
      tone: 'green',
    },
    {
      label: 'Iniciativas com ROI negativo/indeterminado',
      value: String(h.negativeOrIndeterminateInitiatives ?? 0),
      icon: CircleAlert,
      tone: 'red',
    },
  ];

  return (
    <div className="space-y-6">
      <RoiTotalCard
        roi={h.overallRoi ?? 0}
        totalBenefit={h.totalBenefit ?? 0}
        totalCost={h.totalCost ?? 0}
        narrative={h.narrative}
      />

      {/* 9 cards de visão geral: 3 domínios + custos/colaboradores/iniciativas */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) =>
          c.chart === 'donut' ? (
            <DonutStatCard
              key={c.label}
              label={c.label}
              value={c.rate ?? 0}
              sub={c.sub}
            />
          ) : c.chart === 'speedometer' ? (
            <SpeedometerStatCard
              key={c.label}
              label="Taxa de Rotatividade"
              value={c.rate ?? 0}
              max={TURNOVER_MAX}
              bands={TURNOVER_BANDS}
              display={`${c.rate ?? 0}%`}
              caption={c.sub}
            />
          ) : (
            <NavyStatCard
              key={c.label}
              tone={c.tone}
              icon={c.icon}
              label={c.label}
              value={c.value}
              sub={c.sub}
            />
          ),
        )}
      </div>

      {/* ROI por tipo de iniciativa / departamento */}
      {((data?.byInitiativeType?.length ?? 0) > 0 ||
        (data?.byDepartment?.length ?? 0) > 0) && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {(data?.byInitiativeType?.length ?? 0) > 0 && (
            <Card>
              <div className="rounded-t-card bg-[#0F1F3D]/60 px-5 py-3">
                <h4 className="font-display text-sm font-semibold text-white">
                  ROI por tipo de iniciativa
                </h4>
              </div>
              <div className="p-5">
                <BarChart
                  orientation="horizontal"
                  categories={data!.byInitiativeType!.map(
                    (b) =>
                      INITIATIVE_TYPE_LABELS[String(b.key)] ?? String(b.key),
                  )}
                  series={[
                    {
                      label: 'ROI médio',
                      values: data!.byInitiativeType!.map((b) => b.avgRoi),
                      barColors: data!.byInitiativeType!.map((_, i) =>
                        categoricalColor(i),
                      ),
                    },
                  ]}
                  yFormat={(v) => `${v}%`}
                />
              </div>
            </Card>
          )}
          {(data?.byDepartment?.length ?? 0) > 0 && (
            <Card>
              <div className="rounded-t-card bg-[#0F1F3D]/60 px-5 py-3">
                <h4 className="font-display text-sm font-semibold text-white">
                  ROI por departamento
                </h4>
              </div>
              <div className="p-5">
                <BarChart
                  orientation="horizontal"
                  categories={data!.byDepartment!.map(
                    (b) => `Departamento #${String(b.key)}`,
                  )}
                  series={[
                    {
                      label: 'ROI médio',
                      values: data!.byDepartment!.map((b) => b.avgRoi),
                      barColors: data!.byDepartment!.map((_, i) =>
                        categoricalColor(i),
                      ),
                    },
                  ]}
                  yFormat={(v) => `${v}%`}
                />
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Top 10 iniciativas com maior impacto */}
      {(data?.topInitiatives?.length ?? 0) > 0 && (
        <Card className="overflow-hidden rounded-[24px] border-[#E3EAF4] bg-white shadow-[0_8px_24px_rgba(21,47,89,0.10)]">
          <div className="pointer-events-none cursor-default select-none bg-[#0F1F3D]/60 px-5 py-3">
            <h4 className="font-display text-sm font-semibold text-white">
              Top iniciativas com maior impacto
            </h4>
          </div>
          <div className="divide-y divide-[#E6ECF4]">
            {data!.topInitiatives!.map((t, i) => (
              <div
                key={t.id}
                className="flex items-center gap-3 bg-white px-5 py-3.5"
              >
                <span className="w-6 text-right font-body text-xs font-bold text-[#49658A]">
                  #{i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-body text-[15px] font-semibold text-[#0F1F3D]">
                    {t.name}
                  </p>
                  <p className="font-body text-xs text-[#49658A]">
                    {t.initiative ?? '—'}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-body text-[15px] font-bold text-[#0F1F3D]">
                    {t.roiPercent != null ? `${t.roiPercent}%` : '—'}
                  </p>
                  <p className="font-body text-xs text-[#49658A]">
                    {t.computedBenefit != null ? fmt$(t.computedBenefit) : '—'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Alerts */}
      {(data?.alerts ?? []).length > 0 && (
        <div className="space-y-2">
          {(data?.alerts ?? []).map((a, i) => {
            const cfg =
              a.severity === 'HIGH'
                ? ALERT_INTENT_CLASSES.danger
                : ALERT_INTENT_CLASSES.warning;
            return (
              <div
                key={i}
                className={cn('rounded-card border px-4 py-3', cfg.card)}
              >
                <p className={cn('font-body text-sm', cfg.text)}>
                  {ptInsight(a.message)}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Top insights */}
      {(data?.topInsights ?? []).length > 0 && (
        <NavyPanel
          title="Principais conclusões automáticas"
          icon={Lightbulb}
          aside={
            data?.confidence && CONFIDENCE_LABELS[data.confidence] ? (
              <span className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 font-body text-xs font-semibold">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor:
                      CONFIDENCE_DOT[data.confidence] ?? '#9CA3AF',
                  }}
                />
                {CONFIDENCE_LABELS[data.confidence]}
              </span>
            ) : undefined
          }
        >
          <ul className="grid grid-cols-1 gap-2 md:grid-cols-2">
            {(data?.topInsights ?? []).slice(0, 4).map((ins, i) => {
              const warn = ins.includes('⚠');
              return (
                <NavyPanelRow
                  key={i}
                  icon={warn ? TriangleAlert : Info}
                  iconClassName={warn ? 'text-[#FBBF24]' : 'text-[#7CC4FF]'}
                >
                  {ptInsight(ins).replace(/⚠️?\s*/g, '')}
                </NavyPanelRow>
              );
            })}
          </ul>
        </NavyPanel>
      )}
    </div>
  );
}
