// components/leadership/Feedback360View.tsx
// Separador "Feedback 360°" — resumo próprio + submissão anónima de
// feedback a um líder. Dados próprios + apresentação. Extraído de
// app/(platform)/leadership/page.tsx.
//
// O ProgressBar da fundação é mono-cor (bg-accent) — a cor que aqui
// comunicava o nível da média por competência passa para o texto do
// score (competencyScoreClass).

'use client';

import { useState } from 'react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { Textarea } from '@/components/ui/Textarea';
import { COMP_LABELS } from './constants';
import type { Competency, Feedback360Summary } from './types';

function competencyScoreClass(avgScore: number): string {
  if (avgScore >= 4) return 'text-success-ink';
  if (avgScore >= 3) return 'text-info-ink';
  return 'text-warning-ink';
}

export function Feedback360View() {
  const notify = useToast();
  const [feedbackForm, setFeedbackForm] = useState<Record<string, number>>({});
  const [targetLeader, setTargetLeader] = useState('');
  const [qualitative, setQualitative] = useState('');

  const { data: summary, isLoading: loading } = useApiQuery<Feedback360Summary>(
    queryKeys.leadership.feedback360Summary(),
    '/leadership/feedback-360/my/summary',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  const competencies: Competency[] = [
    'COMMUNICATION',
    'DEVELOPMENT',
    'RECOGNITION',
    'AUTONOMY',
    'FAIRNESS',
    'EXAMPLE',
  ];

  const submit360 = useApiMutation(
    () => {
      const responses = Object.entries(feedbackForm).map(
        ([competency, score]) => ({ competency, score }),
      );
      return apiClient.post('/leadership/feedback-360', {
        leaderId: parseInt(targetLeader),
        responses,
        qualitativeFeedback: qualitative || undefined,
        anonymous: true,
      });
    },
    {
      invalidateKeys: [queryKeys.leadership.feedback360Summary()],
      onSuccess: () => {
        setFeedbackForm({});
        setTargetLeader('');
        setQualitative('');
        notify({
          title: 'Feedback 360° submetido anonimamente!',
          intent: 'success',
        });
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );
  const submitting = submit360.isPending;

  const handleSubmit360 = () => {
    if (!targetLeader || Object.keys(feedbackForm).length < 3) {
      notify({ title: 'Preencha pelo menos 3 competências', intent: 'danger' });
      return;
    }
    submit360.mutate(undefined);
  };

  return (
    <div className="grid grid-cols-2 gap-5">
      {/* Meu resumo 360° */}
      <div>
        <div className="mb-3 font-body text-sm font-semibold text-ink">
          O meu feedback 360°
        </div>
        {loading ? (
          <Skeleton rows={3} />
        ) : summary && summary.totalResponses > 0 ? (
          <div className="space-y-3">
            <div className="rounded-card border border-info bg-info-subtle p-4 text-center">
              <div className="font-mono text-3xl font-bold text-info-ink">
                {summary.avgScore}
              </div>
              <div className="font-body text-xs text-info-ink">
                média global · {summary.totalResponses} respostas
              </div>
            </div>
            {summary.byCompetency.map((c) => (
              <Card key={c.competency} className="p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="font-body text-xs font-medium text-ink">
                    {COMP_LABELS[c.competency as Competency] ?? c.competency}
                  </span>
                  <span
                    className={`font-mono text-xs font-bold ${competencyScoreClass(c.avgScore)}`}
                  >
                    {c.avgScore}/5
                  </span>
                </div>
                <ProgressBar value={(c.avgScore / 5) * 100} />
                {c.insight && (
                  <div className="mt-1 font-body text-xs text-warning-ink">
                    {c.insight}
                  </div>
                )}
              </Card>
            ))}
          </div>
        ) : (
          <div className="rounded-card border border-dashed border-border-strong py-10 text-center font-body text-sm text-ink-faint">
            Ainda sem respostas de feedback 360°
          </div>
        )}
      </div>

      {/* Submeter feedback a líder */}
      <div>
        <div className="mb-3 font-body text-sm font-semibold text-ink">
          Avaliar líder (anónimo)
        </div>
        <Card className="space-y-4 p-5">
          <div>
            <div className="mb-1 font-body text-xs text-ink-muted">
              ID do líder
            </div>
            <Input
              type="number"
              placeholder="ID do colaborador"
              value={targetLeader}
              onChange={(e) => setTargetLeader(e.target.value)}
              className="w-full"
            />
          </div>

          <div>
            <div className="mb-2 font-body text-xs text-ink-muted">
              Avaliação por competência (1-5)
            </div>
            {competencies.map((comp) => (
              <div
                key={comp}
                className="mb-2.5 flex items-center justify-between"
              >
                <span className="font-body text-xs text-ink">
                  {COMP_LABELS[comp]}
                </span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      onClick={() =>
                        setFeedbackForm((prev) => ({ ...prev, [comp]: s }))
                      }
                      className={`h-8 w-8 rounded-control font-mono text-xs transition-colors ${
                        feedbackForm[comp] === s
                          ? 'bg-primary text-canvas'
                          : 'bg-surface-sunken text-ink-muted hover:bg-border'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div>
            <div className="mb-1 font-body text-xs text-ink-muted">
              Comentário qualitativo (opcional)
            </div>
            <Textarea
              value={qualitative}
              onChange={(e) => setQualitative(e.target.value)}
              rows={3}
              placeholder="O que poderia melhorar? O que faz muito bem?"
              className="w-full resize-none"
            />
          </div>

          <Button
            onClick={handleSubmit360}
            disabled={submitting}
            loading={submitting}
            className="w-full"
          >
            {submitting ? 'A submeter…' : '📤 Submeter (anónimo)'}
          </Button>
        </Card>
      </div>
    </div>
  );
}
