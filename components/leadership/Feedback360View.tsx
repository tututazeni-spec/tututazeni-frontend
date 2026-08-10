// components/leadership/Feedback360View.tsx
// Separador "Feedback 360°" — resumo próprio + submissão anónima de
// feedback a um líder. Dados próprios + apresentação. Extraído de
// app/(platform)/leadership/page.tsx.

'use client';

import { useState } from 'react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Skeleton } from './atoms';
import { COMP_LABELS } from './constants';
import type { Competency, Feedback360Summary } from './types';

export function Feedback360View() {
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
        alert('Feedback 360° submetido anonimamente!');
      },
      onError: (e) => alert(e.message),
    },
  );
  const submitting = submit360.isPending;

  const handleSubmit360 = () => {
    if (!targetLeader || Object.keys(feedbackForm).length < 3) {
      alert('Preencha pelo menos 3 competências');
      return;
    }
    submit360.mutate(undefined);
  };

  return (
    <div className="grid grid-cols-2 gap-5">
      {/* Meu resumo 360° */}
      <div>
        <div className="text-sm font-semibold text-gray-900 mb-3">
          O meu feedback 360°
        </div>
        {loading ? (
          <Skeleton rows={3} />
        ) : summary && summary.totalResponses > 0 ? (
          <div className="space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold font-mono text-blue-700">
                {summary.avgScore}
              </div>
              <div className="text-xs text-blue-500">
                média global · {summary.totalResponses} respostas
              </div>
            </div>
            {summary.byCompetency.map((c) => (
              <div
                key={c.competency}
                className="bg-white border border-gray-200 rounded-xl p-3"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-gray-800">
                    {COMP_LABELS[c.competency as Competency] ?? c.competency}
                  </span>
                  <span className="text-xs font-mono font-bold text-blue-700">
                    {c.avgScore}/5
                  </span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${c.avgScore >= 4 ? 'bg-emerald-500' : c.avgScore >= 3 ? 'bg-blue-500' : 'bg-amber-500'}`}
                    style={{ width: `${(c.avgScore / 5) * 100}%` }}
                  />
                </div>
                {c.insight && (
                  <div className="text-xs text-amber-700 mt-1">{c.insight}</div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center text-sm text-gray-400 border border-dashed border-gray-200 rounded-xl">
            Ainda sem respostas de feedback 360°
          </div>
        )}
      </div>

      {/* Submeter feedback a líder */}
      <div>
        <div className="text-sm font-semibold text-gray-900 mb-3">
          Avaliar líder (anónimo)
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4">
          <div>
            <div className="text-xs text-gray-500 mb-1">ID do líder</div>
            <input
              type="number"
              placeholder="ID do colaborador"
              value={targetLeader}
              onChange={(e) => setTargetLeader(e.target.value)}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <div className="text-xs text-gray-500 mb-2">
              Avaliação por competência (1-5)
            </div>
            {competencies.map((comp) => (
              <div
                key={comp}
                className="flex items-center justify-between mb-2.5"
              >
                <span className="text-xs text-gray-700">
                  {COMP_LABELS[comp]}
                </span>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      onClick={() =>
                        setFeedbackForm((prev) => ({ ...prev, [comp]: s }))
                      }
                      className={`w-8 h-8 text-xs font-mono rounded-lg transition-colors ${
                        feedbackForm[comp] === s
                          ? 'bg-blue-700 text-white'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
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
            <div className="text-xs text-gray-500 mb-1">
              Comentário qualitativo (opcional)
            </div>
            <textarea
              value={qualitative}
              onChange={(e) => setQualitative(e.target.value)}
              rows={3}
              placeholder="O que poderia melhorar? O que faz muito bem?"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={handleSubmit360}
            disabled={submitting}
            className="w-full py-2.5 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 disabled:opacity-50"
          >
            {submitting ? 'A submeter…' : '📤 Submeter (anónimo)'}
          </button>
        </div>
      </div>
    </div>
  );
}
