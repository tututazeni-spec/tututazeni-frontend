// components/micro-learning/PlayerView.tsx
// Vista "Player": reprodução/leitura do conteúdo, like/save, quiz e
// marcação de conclusão. Extraído de
// app/(platform)/micro-learning/page.tsx.

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { apiClient } from '@/lib/apiClient';
import { sanitizeHtml } from '@/lib/sanitize';
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
    <div className="max-w-3xl mx-auto">
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5"
      >
        ← Voltar ao feed
      </button>

      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-5">
        {/* Thumbnail / Media */}
        <div className="relative aspect-video bg-gray-900">
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
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center">
                  <div className="text-6xl mb-4">🎧</div>
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
        <div className="p-5">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className={`text-xs px-2 py-0.5 rounded font-medium ${typeCfg.cls}`}
                >
                  {typeCfg.label}
                </span>
                <StatusBadge value={item.level} map={LEVEL_CFG} />
                <span className="text-xs text-gray-400">
                  ⏱ {fmtDuration(item.durationSeconds)}
                </span>
                <span className="text-amber-500 text-xs font-medium">
                  +{item.xpReward} XP
                </span>
              </div>
              <h1 className="text-lg font-bold text-gray-900">{item.title}</h1>
              {item.description && (
                <p className="text-sm text-gray-500 mt-1">{item.description}</p>
              )}
            </div>

            {/* Acções */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => handleInteract('LIKE')}
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-colors ${
                  liked
                    ? 'bg-red-50 text-red-500'
                    : 'bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-400'
                }`}
              >
                ❤
              </button>
              <button
                onClick={() => handleInteract('SAVE')}
                className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-colors ${
                  saved
                    ? 'bg-blue-50 text-blue-600'
                    : 'bg-gray-100 text-gray-400 hover:bg-blue-50 hover:text-blue-400'
                }`}
              >
                🔖
              </button>
            </div>
          </div>

          {/* Barra de progresso */}
          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Progresso</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${completed ? 'bg-emerald-500' : 'bg-blue-500'}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {item.tags.map((t) => (
              <span
                key={t}
                className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded"
              >
                #{t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Conteúdo de texto */}
      {item.contentType === 'TEXT' && item.textContent && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-5">
          <div
            className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.textContent) }}
          />
        </div>
      )}

      {/* Takeaways */}
      {item.takeaways.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 mb-5">
          <div className="text-sm font-semibold text-blue-800 mb-3">
            💡 Pontos-chave
          </div>
          <ul className="space-y-2">
            {item.takeaways.map((t, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-blue-700"
              >
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-200 text-blue-700 flex items-center justify-center text-xs font-bold">
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
        <div className="bg-white border border-gray-200 rounded-2xl p-5 mb-5">
          <div className="text-sm font-semibold text-gray-900 mb-4">
            ❓ Quiz — {quizQs.length} perguntas
          </div>
          {quizQs.map((q, idx) => (
            <div
              key={q.id}
              className="mb-5 pb-5 border-b border-gray-100 last:border-0"
            >
              <div className="text-sm font-medium text-gray-800 mb-3">
                {idx + 1}. {q.question}
              </div>
              <div className="space-y-2">
                {q.options.map((opt, oi) => (
                  <label
                    key={oi}
                    className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${
                      quiz.answers[idx] === oi
                        ? 'border-blue-400 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`q-${idx}`}
                      checked={quiz.answers[idx] === oi}
                      onChange={() => quiz.setAnswer(idx, oi)}
                      className="text-blue-600"
                    />
                    <span className="text-sm text-gray-700">{opt.text}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button
            onClick={quiz.submit}
            disabled={quiz.answers.length < quizQs.length || quiz.submitting}
            className="w-full py-2.5 bg-blue-700 text-white text-sm font-medium rounded-xl hover:bg-blue-800 disabled:opacity-50"
          >
            {quiz.submitting ? 'A corrigir…' : 'Submeter respostas'}
          </button>
        </div>
      )}

      {/* Resultado quiz */}
      {quiz.result && (
        <div
          className={`border rounded-2xl p-5 mb-5 ${quiz.result.score >= 60 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}
        >
          <div
            className={`text-center mb-4 ${quiz.result.score >= 60 ? 'text-emerald-700' : 'text-red-700'}`}
          >
            <div className="text-4xl font-bold font-mono">
              {quiz.result.score}%
            </div>
            <div className="text-sm font-medium mt-1">
              {quiz.result.score >= 60 ? '🎉 Aprovado!' : '😔 Tenta novamente'}
            </div>
            <div className="text-xs mt-0.5">
              {quiz.result.correct}/{quiz.result.total} correctas
            </div>
          </div>
        </div>
      )}

      {/* Botão concluir (para não-quiz) */}
      {item.contentType !== 'QUIZ' && !completed && (
        <button
          onClick={markComplete}
          className="w-full py-3 bg-emerald-600 text-white text-sm font-semibold rounded-2xl hover:bg-emerald-700 mb-5"
        >
          ✅ Marcar como concluído
        </button>
      )}

      {completed && (
        <div className="py-3 text-center text-emerald-700 font-semibold text-sm bg-emerald-50 rounded-2xl border border-emerald-200 mb-5">
          ✓ Concluído · +{item.xpReward} XP ganho!
        </div>
      )}
    </div>
  );
}
