// components/content-library/AnalyticsTab.tsx
// Separador "Analytics" — KPIs, distribuição por formato, mais vistos e
// adicionados recentemente. Dados próprios (useApiQuery) + apresentação.
// Extraído de app/(platform)/content-library/page.tsx.
//
// docs/biblioteca.md pedia um separador "Relatórios" dedicado; em vez de
// duplicar navegação optou-se por acrescentar aqui a secção "Compliance de
// Leitura Obrigatória" (GET /documents/compliance-overview) — este
// separador já É o relatório da Biblioteca, só lhe faltava a peça de
// confirmação de leitura dos Documentos Corporativos.

'use client';

import { useComplianceOverview } from '@/components/documents/hooks';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card, CardBody } from '@/components/ui/Card';
import { KpiCard } from '@/components/ui/KpiCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { FORMAT_CLS, FORMAT_CLS_FALLBACK } from './constants';
import type { ContentAnalytics } from './types';

// Espelha @Roles(...) em GET /documents/compliance-overview.
const COMPLIANCE_ROLES = ['ADMIN', 'RH', 'DIRECTOR'];

export function AnalyticsTab() {
  const role = useCurrentRole();
  const { data, isLoading } = useApiQuery<ContentAnalytics>(
    queryKeys.contentLibrary.analytics(),
    '/content-library/analytics/dashboard',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const canSeeCompliance = !!role && COMPLIANCE_ROLES.includes(role);
  const { data: compliance, loading: complianceLoading } =
    useComplianceOverview(canSeeCompliance);

  if (isLoading) return <Skeleton rows={4} />;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KpiCard
          label="Total de Conteúdos"
          value={data?.kpis.totalContent ?? 0}
          intent="primary"
          className="w-full"
        />
        <KpiCard
          label="Activos"
          value={data?.kpis.activeContent ?? 0}
          intent="success"
          className="w-full"
        />
        <KpiCard
          label="Visualizações"
          value={data?.kpis.totalViews ?? 0}
          intent="info"
          className="w-full"
        />
        <KpiCard
          label="Conclusões"
          value={data?.kpis.totalCompletions ?? 0}
          intent="accent"
          className="w-full"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Format breakdown */}
        <Card>
          <CardBody>
            <h3 className="mb-4 font-body font-semibold text-ink">
              Distribuição por Formato
            </h3>
            <div className="space-y-2">
              {(data?.formatBreakdown ?? []).map((f) => {
                const total = (data?.formatBreakdown ?? []).reduce(
                  (s, x) => s + x.count,
                  0,
                );
                const pct = total > 0 ? Math.round((f.count / total) * 100) : 0;
                return (
                  <div key={f.format} className="flex items-center gap-3">
                    <span
                      className={`w-24 rounded px-1.5 py-0.5 text-center font-body text-[10px] font-medium ${FORMAT_CLS[f.format] ?? FORMAT_CLS_FALLBACK}`}
                    >
                      {f.format}
                    </span>
                    <div className="flex-1">
                      <ProgressBar value={pct} className="h-2" />
                    </div>
                    <span className="w-8 text-right font-body text-xs font-semibold text-ink-muted">
                      {f.count}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>

        {/* Most viewed */}
        <Card>
          <CardBody>
            <h3 className="mb-4 font-body font-semibold text-ink">
              Mais Vistos (30 dias)
            </h3>
            <div className="space-y-3">
              {(data?.mostViewed ?? []).map((v, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className="w-4 font-body text-xs font-bold text-ink-faint">
                    #{i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-body text-xs font-medium text-ink">
                      {v.content?.title}
                    </p>
                    <p className="font-body text-[10px] text-ink-faint">
                      {v.content?.type}
                    </p>
                  </div>
                  <span className="shrink-0 font-body text-xs font-bold text-primary">
                    {v.weeklyViews} views
                  </span>
                </div>
              ))}
              {(data?.mostViewed ?? []).length === 0 && (
                <p className="py-6 text-center font-body text-sm text-ink-faint">
                  Sem dados ainda
                </p>
              )}
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recently added */}
      {(data?.recentlyAdded?.length ?? 0) > 0 && (
        <Card>
          <CardBody>
            <h3 className="mb-3 font-body font-semibold text-ink">
              Adicionados Recentemente
            </h3>
            <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
              {(data?.recentlyAdded ?? []).map((c) => (
                <div
                  key={c.id}
                  className="flex items-center gap-3 rounded-control p-2 hover:bg-surface-sunken"
                >
                  <span
                    className={`w-20 rounded px-1.5 py-0.5 text-center font-body text-[10px] font-medium ${FORMAT_CLS[c.type] ?? FORMAT_CLS_FALLBACK}`}
                  >
                    {c.type}
                  </span>
                  <p className="flex-1 truncate font-body text-sm font-medium text-ink">
                    {c.title}
                  </p>
                  <p className="shrink-0 font-body text-[10px] text-ink-faint">
                    {new Date(c.createdAt).toLocaleDateString('pt')}
                  </p>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Compliance de leitura obrigatória — Documentos Corporativos (ADMIN/RH/DIRECTOR) */}
      {canSeeCompliance && (
      <Card>
        <CardBody>
          <h3 className="mb-4 font-body font-semibold text-ink">
            Compliance de Leitura Obrigatória
          </h3>
          {complianceLoading ? (
            <Skeleton rows={3} />
          ) : compliance.length === 0 ? (
            <p className="py-6 text-center font-body text-sm text-ink-faint">
              Nenhum documento exige confirmação de leitura no momento.
            </p>
          ) : (
            <div className="space-y-3">
              {compliance.map((c) => (
                <div key={c.id} className="flex items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-body text-xs font-medium text-ink">{c.title}</p>
                    <ProgressBar value={c.percentage} className="mt-1 h-2" />
                  </div>
                  <span className="shrink-0 font-body text-xs font-bold text-ink-muted">
                    {c.confirmedCount}/{c.totalRequired} ({c.percentage}%)
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
      )}
    </div>
  );
}
