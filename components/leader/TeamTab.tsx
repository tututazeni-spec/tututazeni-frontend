// components/leader/TeamTab.tsx
// Tab "Equipa": resumo, pesquisa, lista de membros e modal de
// feedback. Extraído de app/(platform)/leader/page.tsx.

'use client';

import { useState } from 'react';
import { MessageSquare, Users } from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { RISK_INTENT } from './constants';
import { FeedbackForm } from './FeedbackForm';
import type { TeamData } from './types';

function scoreTextClass(score: number): string {
  if (score >= 4) return 'text-success';
  if (score >= 3) return 'text-warning';
  return 'text-danger';
}

export function TeamTab() {
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState<{
    userId: number;
    name: string;
  } | null>(null);
  const { data, isLoading: loading } = useApiQuery<TeamData>(
    queryKeys.leader.team(),
    '/leaders/my-team',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (loading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="space-y-3"
        itemClassName="skeleton-shimmer h-16 rounded-card"
      />
    );

  const filtered = (data?.data ?? []).filter(
    (u) => !search || u.fullName.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="space-y-4">
      {/* Summary */}
      {data?.summary && (
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total', value: data.summary.headcount },
            {
              label: 'Em Risco',
              value: data.summary.atRisk,
              className:
                data.summary.atRisk > 0 ? 'text-danger' : 'text-success',
            },
            {
              label: 'Pontuação Média',
              value: data.summary.avgScore?.toFixed(1) ?? '–',
            },
            {
              label: 'Antiguidade Média',
              value: `${data.summary.avgTenureMonths}m`,
            },
          ].map((s) => (
            <Card key={s.label} className="p-3 text-center">
              <p
                className={`font-display text-xl font-bold ${s.className ?? 'text-ink'}`}
              >
                {s.value}
              </p>
              <p className="font-body text-[10px] text-ink-faint">{s.label}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Search */}
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Pesquisar membro..."
        className="w-full"
      />

      {/* Team list */}
      <Card>
        <div className="divide-y divide-border">
          {filtered.map((u, i) => (
            <div
              key={i}
              className="flex items-center gap-3 px-4 py-3 hover:bg-surface-sunken"
            >
              <Avatar name={u.fullName} url={u.avatarUrl} />
              <div className="min-w-0 flex-1">
                <p className="font-body text-sm font-semibold text-ink">
                  {u.fullName}
                </p>
                <p className="font-body text-[10px] text-ink-faint">
                  {u.position?.name} · {u.tenure}m empresa
                </p>
              </div>

              {/* PDI progress */}
              {u.activePlan && (
                <div className="hidden w-20 md:block">
                  <p className="mb-0.5 font-body text-[9px] text-ink-faint">
                    PDI
                  </p>
                  <ProgressBar value={u.planProgress ?? 0} />
                  <p className="text-right font-body text-[9px] text-ink-faint">
                    {u.planProgress}%
                  </p>
                </div>
              )}

              {/* Score */}
              {u.latestPerfScore !== null && (
                <span
                  className={`font-body text-sm font-bold ${scoreTextClass(u.latestPerfScore ?? 0)}`}
                >
                  {u.latestPerfScore?.toFixed(1)}
                </span>
              )}

              {/* Risk */}
              <Badge intent={RISK_INTENT[u.riskLevel] ?? RISK_INTENT.NONE}>
                {u.riskLevel}
              </Badge>

              {/* Actions */}
              <div className="flex shrink-0 gap-1">
                <IconButton
                  icon={MessageSquare}
                  label="Dar feedback"
                  intent="ghost"
                  size="sm"
                  onClick={() =>
                    setFeedback({ userId: u.id, name: u.fullName })
                  }
                />
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <EmptyState
              title="Sem membros na equipa"
              description="Nenhum membro corresponde à pesquisa actual."
            />
          )}
        </div>
      </Card>

      {/* Feedback modal */}
      {feedback && (
        <Modal open onOpenChange={(open) => !open && setFeedback(null)}>
          <ModalContent title={`Feedback para ${feedback.name}`}>
            <div className="mt-4">
              <FeedbackForm
                recipientId={feedback.userId}
                onClose={() => setFeedback(null)}
              />
            </div>
          </ModalContent>
        </Modal>
      )}
    </div>
  );
}
