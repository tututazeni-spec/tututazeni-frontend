'use client';
// Feedback e Utilização (ADMIN/RH): NPS, mensagens recebidas e ecrãs mais usados.
// Dados de GET /product-experience/summary e /product-experience/feedback.

import { useState } from 'react';
import { MessageSquareHeart } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useHasRole } from '@/hooks/useCurrentRole';
import { ADMIN_ROLES } from '@/lib/roles';
import { PageHeader } from '@/components/ui/PageHeader';
import { PeriodPills } from '@/components/ui/Pills';
import { KpiCard } from '@/components/ui/KpiCard';
import { Card, CardBody } from '@/components/ui/Card';
import { AlertCard } from '@/components/ui/AlertCard';
import { QueryBoundary } from '@/components/ui/QueryBoundary';

interface Summary {
  days: number;
  activeUsers: number;
  pageViews: number;
  topPages: Array<{ path: string; views: number }>;
  dailyActiveUsers: Array<{ day: string; users: number }>;
  feedbackByKind: Record<string, number>;
  nps: {
    nps: number | null;
    promoters: number;
    passives: number;
    detractors: number;
    total: number;
  };
}

interface FeedbackRow {
  id: string;
  kind: string;
  score: number | null;
  comment: string | null;
  page: string | null;
  createdAt: string;
  user: { id: number; fullName: string } | null;
}

const KIND_LABEL: Record<string, string> = {
  IDEA: 'Ideia',
  PROBLEM: 'Problema',
  PRAISE: 'Elogio',
  NPS: 'Sondagem',
};

const PERIODS = [
  { value: 7, label: '7 dias' },
  { value: 30, label: '30 dias' },
  { value: 90, label: '90 dias' },
] as const;

export default function FeedbackPage() {
  const allowed = useHasRole(ADMIN_ROLES);
  const [days, setDays] = useState<number>(30);

  const summary = useApiQuery<Summary>(
    ['product-experience', 'summary', days],
    '/product-experience/summary',
    { params: { days }, enabled: allowed },
  );
  const feedback = useApiQuery<FeedbackRow[]>(
    ['product-experience', 'feedback'],
    '/product-experience/feedback',
    { params: { limit: 50 }, enabled: allowed },
  );

  if (!allowed) {
    return (
      <AlertCard
        variant="info"
        title="Sem acesso a esta página"
        message="Esta área é só para administradores e RH. Use o botão de feedback no topo para partilhar a sua opinião."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        icon={MessageSquareHeart}
        title="Feedback e Utilização"
        description="O que os utilizadores dizem e o que realmente usam."
        actions={
          <PeriodPills
            label="Período"
            options={PERIODS}
            value={days}
            onChange={setDays}
          />
        }
      />

      <QueryBoundary query={summary}>
        {(s) => (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <KpiCard
                label="NPS"
                value={s.nps.nps ?? '—'}
                sub={
                  s.nps.total
                    ? `${s.nps.total} respostas`
                    : 'Ainda sem respostas'
                }
                intent={
                  s.nps.nps === null
                    ? 'info'
                    : s.nps.nps >= 30
                      ? 'success'
                      : s.nps.nps >= 0
                        ? 'warning'
                        : 'danger'
                }
              />
              <KpiCard label="Utilizadores activos" value={s.activeUsers} />
              <KpiCard label="Ecrãs vistos" value={s.pageViews} />
              <KpiCard
                label="Mensagens recebidas"
                value={Object.entries(s.feedbackByKind)
                  .filter(([k]) => k !== 'NPS')
                  .reduce((n, [, c]) => n + c, 0)}
                sub={`${s.feedbackByKind.PROBLEM ?? 0} problemas`}
              />
            </div>

            <Card>
              <CardBody>
                <h2 className="font-display text-lg font-bold text-ink">
                  Ecrãs mais usados
                </h2>
                {s.topPages.length === 0 ? (
                  <p className="mt-2 text-sm text-ink-muted">
                    Ainda sem dados de utilização neste período.
                  </p>
                ) : (
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <caption className="sr-only">
                        Ecrãs mais vistos no período
                      </caption>
                      <thead>
                        <tr className="text-ink-muted">
                          <th scope="col" className="py-2 pr-4 font-semibold">
                            Ecrã
                          </th>
                          <th scope="col" className="py-2 text-right font-semibold">
                            Visualizações
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {s.topPages.map((p) => (
                          <tr key={p.path} className="border-t border-border">
                            <td className="py-2 pr-4 text-ink">{p.path}</td>
                            <td className="py-2 text-right text-ink">{p.views}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardBody>
            </Card>
          </>
        )}
      </QueryBoundary>

      <Card>
        <CardBody>
          <h2 className="font-display text-lg font-bold text-ink">
            Mensagens recentes
          </h2>
          <QueryBoundary query={feedback}>
            {(rows) =>
              rows.length === 0 ? (
                <p className="mt-2 text-sm text-ink-muted">
                  Ainda não recebeu feedback.
                </p>
              ) : (
                <ul className="mt-3 flex flex-col divide-y divide-border">
                  {rows.map((r) => (
                    <li key={r.id} className="py-3">
                      <p className="text-xs text-ink-muted">
                        {KIND_LABEL[r.kind] ?? r.kind}
                        {r.score !== null ? ` · nota ${r.score}` : ''}
                        {' · '}
                        {r.user?.fullName ?? 'Utilizador removido'}
                        {r.page ? ` · ${r.page}` : ''}
                        {' · '}
                        {new Date(r.createdAt).toLocaleDateString('pt-PT')}
                      </p>
                      {r.comment && (
                        <p className="mt-1 text-sm text-ink">{r.comment}</p>
                      )}
                    </li>
                  ))}
                </ul>
              )
            }
          </QueryBoundary>
        </CardBody>
      </Card>
    </div>
  );
}
