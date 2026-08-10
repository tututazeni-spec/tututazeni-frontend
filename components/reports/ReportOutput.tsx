// components/reports/ReportOutput.tsx
// Renderização genérica do resultado de um relatório: insights,
// KPIs de resumo, distribuição por departamento e lista top.
// Extraído de app/(platform)/reports/page.tsx.

'use client';

import { Brain } from 'lucide-react';
import { ProgressBar } from './atoms';
import type { ReportData } from './types';

interface ReportOutputProps {
  data: ReportData;
  reportKey: string;
}

export function ReportOutput({ data }: ReportOutputProps) {
  const summary = data.summary ?? {};

  return (
    <div className="space-y-4">
      {/* Insights */}
      {(data.insights ?? []).length > 0 && (
        <div className="bg-violet-50 border border-violet-100 rounded-xl p-4">
          <h4 className="text-xs font-semibold text-violet-700 uppercase tracking-wide mb-2 flex items-center gap-1">
            <Brain size={12} />
            Insights
          </h4>
          {(data.insights ?? []).map((ins, i) => (
            <p key={i} className="text-xs text-violet-800 mb-1">
              {ins}
            </p>
          ))}
        </div>
      )}

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(summary)
          .slice(0, 8)
          .map(([k, v]) => {
            if (typeof v === 'object') return null;
            const label = k
              .replace(/([A-Z])/g, ' $1')
              .replace(/^./, (c) => c.toUpperCase());
            const isRate =
              k.toLowerCase().includes('rate') ||
              k.toLowerCase().includes('pct') ||
              k.toLowerCase().includes('ratio');
            return (
              <div
                key={k}
                className="bg-white rounded-xl border border-slate-100 p-3"
              >
                <p className="text-xl font-bold text-slate-800">
                  {typeof v === 'number' ? (isRate ? `${v}%` : v) : String(v)}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">{label}</p>
              </div>
            );
          })}
      </div>

      {/* By Department */}
      {(data.byDepartment ?? []).length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h4 className="font-semibold text-slate-700 mb-4">
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
                  <div className="flex justify-between text-xs mb-0.5">
                    <span className="text-slate-600 truncate">
                      {d.department ?? d.name}
                    </span>
                    <span className="font-semibold text-slate-700">
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
        </div>
      )}

      {/* Top list */}
      {(
        data.topPerformers ??
        data.topCourses ??
        data.skills ??
        data.topContent ??
        []
      ).length > 0 && (
        <div className="bg-white rounded-xl border border-slate-100 p-5">
          <h4 className="font-semibold text-slate-700 mb-4">
            {data.topPerformers
              ? 'Top Performers'
              : data.topCourses
                ? 'Top Cursos'
                : data.skills
                  ? 'Gaps Críticos'
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
              return (
                <div key={i} className="flex items-center gap-3">
                  <span className="text-xs text-slate-300 font-bold w-5 text-right">
                    #{i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-700 truncate">
                      {name}
                    </p>
                    {sub && <p className="text-[10px] text-slate-400">{sub}</p>}
                  </div>
                  <span
                    className={`text-sm font-bold shrink-0 ${
                      isGap
                        ? val >= 2
                          ? 'text-red-500'
                          : 'text-amber-500'
                        : typeof val === 'number' && val >= 70
                          ? 'text-emerald-600'
                          : 'text-slate-700'
                    }`}
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
        </div>
      )}
    </div>
  );
}
