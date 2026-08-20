// components/micro-learning/PlayerView.tsx
// Vista "Player": reprodução/leitura do conteúdo, like/save, quiz e
// marcação de conclusão. Extraído de
// app/(platform)/micro-learning/page.tsx.
//
// Barra de progresso: o `ProgressBar` da fundação é mono-cor
// (bg-accent) — a informação de "concluído vs. em curso" que a versão
// original comunicava recolorindo a barra (azul/emerald) passa para a
// cor da percentagem adjacente, mesmo padrão de
// components/engagement/AnalyticsTab.tsx (scoreTextClass).

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { apiClient } from '@/lib/apiClient';
import { sanitizeHtml } from '@/lib/sanitize';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { LEVEL_CFG, TYPE_CFG } from './constants';
import { fmtDuration } from './utils';
import { useMicroLearningProgress, useQuizAttempt } from './hooks';
import type {
  InteractResult,
  MicroLearning,
  ParsedQuizQuestion,
  QuizOption,
} from './types';

interface PlayerViewProps {
  item: MicroLearning;
  onBack: () => void;
  onNext?: () => void;
}

export function PlayerView({ item, onBack, onNext }: PlayerViewProps) {
  const { progress, completed, markComplete } = useMicroLearningProgress(item);
  const quiz = useQuizAttempt(item, markComplete);
  const [liked, setLiked] = useState(item.userLiked ?? false);
  const [saved, setSaved] = useState(item.userSaved ?? false);

  const handleInteract = async (action: 'LIKE' | 'SAVE') => {
    try {
      const res = await apiClient.post<InteractResult>(
        '/micro-learning/interact',
        {
          microLearningId: item.id,
          action,
        },
      );
      if (action === 'LIKE') setLiked(res.active);
      if (action === 'SAVE') setSaved(res.active);
    } catch {
      /* ignorar */
    }
  };

  const typeCfg = TYPE_CFG[item.contentType];

  let quizQs: ParsedQuizQuestion[] = [];
  try {
    quizQs =
      item.quizQuestions?.map((q) => ({
        ...q,
        options: JSON.parse(q.options) as QuizOption[],
      })) ?? [];
  } catch {
    quizQs = [];
  }

  return (
    <div className="mx-auto max-w-3xl">
      <button
        onClick={onBack}
        className="mb-5 flex items-center gap-1.5 font-body text-sm text-ink-muted hover:text-ink"
      >
        ← Voltar ao feed
      </button>

      {/* Header */}
      <Card className="mb-5 overflow-hidden">
        {/* Thumbnail / Media */}
        <div className="relative aspect-video bg-ink">
          {item.thumbnailUrl && (
            <Image
              src={item.thumbnailUrl}
              alt=""
              fill
              className="object-cover opacity-60"
            />
          )}
          {(item.contentType === 'VIDEO' || item.contentType === 'AUDIO') &&
          item.mediaUrl ? (
            <div className="absolute inset-0 flex items-center justify-center">
              {item.contentType === 'VIDEO' ? (
                <video
                  src={item.mediaUrl}
                  controls
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="text-center">
                  <div className="mb-4 text-6xl">🎧</div>
                  <audio
                    src={item.mediaUrl}
                    controls
                    className="w-full max-w-sm"
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-30">
              {typeCfg.icon}
            </div>
          )}
        </div>

        {/* Info */}
        <CardBody>
          <div className="mb-3 flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <span
                  className={`rounded px-2 py-0.5 font-body text-xs font-medium ${typeCfg.cls}`}
                >
                  {typeCfg.label}
                </span>
                <StatusBadge value={item.level} map={LEVEL_CFG} />
                <span className="font-body text-xs text-ink-faint">
                  ⏱ {fmtDuration(item.durationSeconds)}
                </span>
                <span className="font-body text-xs font-medium text-accent">
                  +{item.xpReward} XP
                </span>
              </div>
              <h1 className="font-display text-lg font-bold text-ink">
                {item.title}
              </h1>
              {item.description && (
                <p className="mt-1 font-body text-sm text-ink-muted">
                  {item.description}
                </p>
              )}
            </div>

            {/* Acções */}
            <div className="flex flex-shrink-0 items-center gap-2">
              <button
                onClick={() => handleInteract('LIKE')}
                className={`flex h-9 w-9 items-center justify-center rounded-control text-sm transition-colors ${
                  liked
                    ? 'bg-danger-subtle text-danger-ink'
                    : 'bg-surface-sunken text-ink-faint hover:bg-danger-subtle hover:text-danger-ink'
                }`}
              >
                
              </button>
              <button
                onClick={() => handleInteract('SAVE')}
                className={`flex h-9 w-9 items-center justify-center rounded-control text-sm transition-colors ${
                  saved
                    ? 'bg-info-subtle text-info-ink'
                    : 'bg-surface-sunken text-ink-faint hover:bg-info-subtle hover:text-info-ink'
                }`}
              >
                
              </button>
            </div>
          </div>

          {/* Barra de progresso */}
          <div className="mb-4">
            <div className="mb-1 flex justify-between font-body text-xs text-ink-faint">
              <span>Progresso</span>
              <span
                className={`font-data ${completed ? 'text-success' : 'text-info'}`}
              >
                {Math.round(progress)}%
              </span>
            </div>
            <ProgressBar value={progress} />
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {item.tags.map((t) => (
              <span
                key={t}
                className="rounded-control bg-surface-sunken px-2 py-0.5 font-body text-xs text-ink-muted"
              >
                #{t}
              </span>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Conteúdo de texto */}
      {item.contentType === 'TEXT' && item.textContent && (
        <Card className="mb-5">
          <CardBody>
            <div
              className="prose prose-sm max-w-none leading-relaxed text-ink-muted"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.textContent) }}
            />
          </CardBody>
        </Card>
      )}

      {/* Takeaways */}
      {item.takeaways.length > 0 && (
        <div className="mb-5 rounded-card border border-info bg-info-subtle p-5">
          <div className="mb-3 font-body text-sm font-semibold text-info-ink">
             Pontos-chave
          </div>
          <ul className="space-y-2">
            {item.takeaways.map((t, i) => (
              <li
                key={i}
                className="flex items-start gap-2 font-body text-sm text-info-ink"
              >
                <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-info text-xs font-bold text-canvas">
                  {i + 1}
                </span>
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Quiz */}
      {item.contentType === 'QUIZ' && quizQs.length > 0 && !quiz.result && (
        <Card className="mb-5">
          <CardBody>
            <div className="mb-4 font-display text-sm font-semibold text-ink">
              ❓ Quiz — {quizQs.length} perguntas
            </div>
            {quizQs.map((q, idx) => (
              <div
                key={q.id}
                className="mb-5 border-b border-border pb-5 last:border-0"
              >
                <div className="mb-3 font-body text-sm font-medium text-ink">
                  {idx + 1}. {q.question}
                </div>
                <div className="space-y-2">
                  {q.options.map((opt, oi) => (
                    <label
                      key={oi}
                      className={`flex items-center gap-3 rounded-control border p-3 transition-colors ${
                        quiz.answers[idx] === oi
                          ? 'border-info bg-info-subtle'
                          : 'border-border hover:border-border-strong'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`q-${idx}`}
                        checked={quiz.answers[idx] === oi}
                        onChange={() => quiz.setAnswer(idx, oi)}
                        className="accent-primary"
                      />
                      <span className="font-body text-sm text-ink-muted">
                        {opt.text}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
            <Button
              onClick={quiz.submit}
              disabled={quiz.answers.length < quizQs.length || quiz.submitting}
              className="w-full"
            >
              {quiz.submitting ? 'A corrigir…' : 'Submeter respostas'}
            </Button>
          </CardBody>
        </Card>
      )}

      {/* Resultado quiz */}
      {quiz.result && (
        <div
          className={`mb-5 rounded-card border p-5 ${quiz.result.score >= 60 ? 'border-success bg-success-subtle' : 'border-danger bg-danger-subtle'}`}
        >
          <div
            className={`mb-4 text-center ${quiz.result.score >= 60 ? 'text-success-ink' : 'text-danger-ink'}`}
          >
            <div className="font-data text-4xl font-bold">
              {quiz.result.score}%
            </div>
            <div className="mt-1 font-body text-sm font-medium">
              {quiz.result.score >= 60 ? ' Aprovado!' : ' Tenta novamente'}
            </div>
            <div className="mt-0.5 font-body text-xs">
              {quiz.result.correct}/{quiz.result.total} correctas
            </div>
          </div>
        </div>
      )}

      {/* Botão concluir (para não-quiz) */}
      {item.contentType !== 'QUIZ' && !completed && (
        <Button
          intent="success"
          onClick={markComplete}
          className="mb-5 w-full rounded-card py-3"
        >
          ✅ Marcar como concluído
        </Button>
      )}

      {completed && (
        <div className="mb-5 rounded-card border border-success bg-success-subtle py-3 text-center font-body text-sm font-semibold text-success-ink">
          ✓ Concluído · +{item.xpReward} XP ganho!
        </div>
      )}
    </div>
  );
}
