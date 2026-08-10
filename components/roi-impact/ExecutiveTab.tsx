// components/roi-impact/ExecutiveTab.tsx
// Tab "Executivo": ROI hero, breakdown por domínio, alertas e
// insights automáticos. Extraído de app/(platform)/roi-impact/page.tsx.

'use client';

import { AlertTriangle, BookOpen, Brain, Star, Users } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { ConfidenceBadge, Skeleton } from './atoms';
import { fmt$ } from './utils';
import type { ExecutiveData } from './types';

export function ExecutiveTab() {
  const { data, isLoading: loading } = useApiQuery<ExecutiveData>(
    queryKeys.roiImpact.executive(),
    '/roi-impact/executive',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  if (loading) return <Skeleton />;

  const h = data?.headline ?? {};
  const d = data?.domains ?? {};

  return (
    <div className="space-y-6">
      {/* ROI Hero */}
      <div
        className={`rounded-2xl p-6 ${(h.overallRoi ?? 0) >= 100 ? 'bg-gradient-to-br from-emerald-600 to-teal-700' : (h.overallRoi ?? 0) >= 0 ? 'bg-gradient-to-br from-amber-500 to-orange-600' : 'bg-gradient-to-br from-red-600 to-rose-700'} text-white`}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-white/70 text-sm mb-1">
              ROI Total do Investimento em Pessoas
            </p>
            <p className="text-6xl font-black">{h.overallRoi ?? 0}%</p>
            <p className="text-white/80 text-sm mt-1">
              BCR:{' '}
              {(h.totalCost ?? 0) > 0
                ? ((h.totalBenefit ?? 0) / (h.totalCost ?? 1)).toFixed(2)
                : '–'}{' '}
              · Status: {h.status}
            </p>
          </div>
          <div className="text-right">
            <p className="text-white/70 text-xs mb-1">Benefício Total</p>
            <p className="text-3xl font-bold">{fmt$(h.totalBenefit ?? 0)}</p>
            <p className="text-white/70 text-xs mt-1">
              Custo: {fmt$(h.totalCost ?? 0)}
            </p>
          </div>
        </div>
        {h.narrative && (
          <p className="text-white/90 text-sm bg-white/10 rounded-xl px-4 py-3 leading-relaxed">
            💡 {h.narrative}
          </p>
        )}
      </div>

      {/* Domain breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            label: 'Aprendizagem',
            icon: BookOpen,
            value: `${d.learning?.roi ?? 0}%`,
            sub: `${fmt$(d.learning?.cost ?? 0)} investido · ${d.learning?.completions ?? 0} conclusões`,
            color: 'text-blue-600',
            bg: 'bg-blue-50',
          },
          {
            label: 'Retenção',
            icon: Users,
            value: fmt$(d.retention?.savedValue ?? 0),
            sub: `Turnover: ${d.retention?.turnoverRate ?? 0}%`,
            color: 'text-emerald-600',
            bg: 'bg-emerald-50',
          },
          {
            label: 'Performance',
            icon: Star,
            value: d.performance?.lift ? `+${d.performance.lift}pts` : '–',
            sub: `Benefício produtivo: ${fmt$(d.performance?.benefit ?? 0)}`,
            color: 'text-amber-600',
            bg: 'bg-amber-50',
          },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-white rounded-xl border border-slate-100 p-4"
          >
            <div className={`p-2 rounded-lg ${item.bg} w-fit mb-3`}>
              <item.icon size={16} className={item.color} />
            </div>
            <p className="text-2xl font-bold text-slate-800">{item.value}</p>
            <p className="text-xs text-slate-500 mb-1">{item.label}</p>
            <p className="text-[10px] text-slate-400">{item.sub}</p>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {(data?.alerts ?? []).length > 0 && (
        <div className="space-y-2">
          {(data?.alerts ?? []).map((a, i) => (
            <div
              key={i}
              className={`border rounded-xl px-4 py-3 flex items-center gap-3 ${a.severity === 'HIGH' ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}
            >
              <AlertTriangle
                size={14}
                className={
                  a.severity === 'HIGH' ? 'text-red-600' : 'text-amber-600'
                }
              />
              <p
                className={`text-sm ${a.severity === 'HIGH' ? 'text-red-700' : 'text-amber-700'}`}
              >
                {a.message}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Top insights */}
      {(data?.topInsights ?? []).length > 0 && (
        <div className="bg-violet-50 border border-violet-100 rounded-xl p-5">
          <h4 className="font-semibold text-violet-700 mb-3 flex items-center gap-2">
            <Brain size={14} />
            Insights Automáticos
          </h4>
          {(data?.topInsights ?? []).slice(0, 4).map((ins, i) => (
            <p key={i} className="text-xs text-violet-800 mb-1">
              {ins}
            </p>
          ))}
          {data?.confidence && (
            <div className="mt-2">
              <ConfidenceBadge level={data.confidence} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
