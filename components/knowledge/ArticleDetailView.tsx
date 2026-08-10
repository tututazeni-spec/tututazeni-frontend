// components/knowledge/ArticleDetailView.tsx
// Separador "Artigo" — conteúdo, comentários, acções (bookmark/
// confirmação/avaliação), estatísticas e Q&A. Dados próprios +
// apresentação. Extraído de app/(platform)/knowledge/page.tsx.

'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { sanitizeHtml } from '@/lib/sanitize';
import { formatDate as fmtDate } from '@/lib/format';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar, Skeleton } from './atoms';
import { ARTICLE_STATUS_MAP } from './constants';
import { timeAgo } from './utils';
import type { Article } from './types';

interface ArticleDetailViewProps {
  articleId: number;
  onBack: () => void;
}

export function ArticleDetailView({
  articleId,
  onBack,
}: ArticleDetailViewProps) {
  const qc = useQueryClient();
  const [comment, setComment] = useState('');
  const [rating, setRating] = useState(0);
  const [hovRating, setHovRating] = useState(0);

  const articleKey = queryKeys.knowledge.article(articleId);
  const { data: article, isLoading: loading } = useApiQuery<Article>(
    articleKey,
    `/knowledge/${articleId}`,
    { enabled: !!articleId, staleTime: STALE_TIME.DYNAMIC },
  );

  const handleBookmark = async () => {
    if (!article) return;
    try {
      const res = await apiClient.post<{ active: boolean }>(
        '/knowledge/interact',
        { articleId, action: 'BOOKMARK' },
      );
      qc.setQueryData<Article>(articleKey, (prev) =>
        prev ? { ...prev, userBookmarked: res.active } : prev,
      );
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  const handleRate = async (score: number) => {
    try {
      await apiClient.post('/knowledge/rate', { articleId, score });
      setRating(score);
    } catch (e) {
      alert(e instanceof Error ? e.message : String(e));
    }
  };

  const commentMutation = useApiMutation(
    () =>
      apiClient.post('/knowledge/comments', { articleId, content: comment }),
    {
      invalidateKeys: [articleKey],
      onSuccess: () => setComment(''),
      onError: (e) => alert(e.message),
    },
  );
  const posting = commentMutation.isPending;
  const handleComment = () => {
    if (comment.trim()) commentMutation.mutate(undefined);
  };

  const acknowledgeMutation = useApiMutation(
    () => apiClient.post('/knowledge/acknowledge', { articleId }),
    {
      onSuccess: () =>
        qc.setQueryData<Article>(articleKey, (prev) =>
          prev ? { ...prev, userAcknowledged: true } : prev,
        ),
      onError: (e) => alert(e.message),
    },
  );
  const acknowledging = acknowledgeMutation.isPending;
  const handleAcknowledge = () => acknowledgeMutation.mutate(undefined);

  const displayRating = hovRating || rating || article?.userRating || 0;

  if (loading || !article) return <Skeleton rows={6} />;

  return (
    <div className="grid grid-cols-[1fr_260px] gap-6">
      {/* Main content */}
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-5"
        >
          ← Voltar
        </button>

        {/* Header */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-5">
          {article.category && (
            <div className="flex items-center gap-1.5 mb-2">
              {article.category.icon && <span>{article.category.icon}</span>}
              <span className="text-xs text-blue-600 font-medium">
                {article.category.name}
              </span>
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            {article.title}
          </h1>
          {article.summary && (
            <p className="text-sm text-gray-600 mb-4">{article.summary}</p>
          )}

          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 mb-4">
            <div className="flex items-center gap-2">
              <Avatar
                name={article.author.fullName}
                avatarUrl={article.author.avatarUrl}
                size="sm"
              />
              <span>{article.author.fullName}</span>
            </div>
            <span>📅 {fmtDate(article.updatedAt)}</span>
            <span>⏱ {article.readingMinutes} min de leitura</span>
            <span>👁 {article.viewCount} visualizações</span>
            <StatusBadge value={article.status} map={ARTICLE_STATUS_MAP} />
            {article.mandatory && (
              <span className="bg-red-50 text-red-700 px-2 py-0.5 rounded">
                Obrigatório
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {article.tags.map((t) => (
              <span
                key={t.id}
                className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded"
              >
                #{t.name}
              </span>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-5">
          <div
            className="prose prose-sm max-w-none text-gray-700"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }}
          />
        </div>

        {/* Comentários */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="text-sm font-semibold text-gray-900 mb-4">
            💬 Comentários ({article._count.comments})
          </div>
          <div className="flex gap-3 mb-4">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              placeholder="Escreve um comentário…"
              className="flex-1 text-sm border border-gray-200 rounded-xl px-4 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleComment}
              disabled={!comment.trim() || posting}
              className="px-4 py-2 bg-blue-700 text-white text-xs font-medium rounded-xl disabled:opacity-50 flex-shrink-0"
            >
              {posting ? '…' : 'Enviar'}
            </button>
          </div>
          <div className="space-y-4">
            {article.comments?.map((c) => (
              <div key={c.id} className="flex gap-3">
                <Avatar
                  name={c.author.fullName}
                  avatarUrl={c.author.avatarUrl}
                  size="sm"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-900">
                      {c.author.fullName}
                    </span>
                    <span className="text-xs text-gray-400">
                      {timeAgo(c.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{c.content}</p>
                  {c.replies?.map((r) => (
                    <div key={r.id} className="flex gap-2 mt-2 ml-4">
                      <Avatar
                        name={r.author.fullName}
                        avatarUrl={r.author.avatarUrl}
                        size="sm"
                      />
                      <div>
                        <span className="text-xs font-medium text-gray-800">
                          {r.author.fullName}{' '}
                        </span>
                        <span className="text-sm text-gray-700">
                          {r.content}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {/* Acções */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
          <button
            onClick={handleBookmark}
            className={`w-full py-2.5 text-sm font-medium rounded-lg transition-colors ${
              article.userBookmarked
                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {article.userBookmarked ? '🔖 Guardado' : '🔖 Guardar'}
          </button>

          {article.mandatory && !article.userAcknowledged && (
            <button
              onClick={handleAcknowledge}
              disabled={acknowledging}
              className="w-full py-2.5 text-sm font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {acknowledging ? '…' : '✅ Li e estou ciente'}
            </button>
          )}
          {article.userAcknowledged && (
            <div className="py-2.5 text-center text-xs text-emerald-700 font-medium bg-emerald-50 rounded-lg">
              ✓ Confirmado
            </div>
          )}
        </div>

        {/* Rating */}
        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="text-xs text-gray-400 mb-2">Avaliar artigo</div>
          <div className="flex gap-1 mb-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onClick={() => handleRate(s)}
                onMouseEnter={() => setHovRating(s)}
                onMouseLeave={() => setHovRating(0)}
                className={`text-2xl transition-colors hover:scale-110 ${
                  s <= displayRating ? 'text-amber-400' : 'text-gray-200'
                }`}
              >
                ★
              </button>
            ))}
          </div>
          {article.avgRating && (
            <div className="text-xs text-gray-400">
              Média: {article.avgRating.toFixed(1)}/5
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-xs text-gray-500">
          {[
            ['Visualizações', article.viewCount],
            ['Comentários', article._count.comments],
            ['Perguntas', article._count.questions],
            ['Confirmações', article._count.acknowledgements],
            [
              'Publicado',
              article.publishedAt ? fmtDate(article.publishedAt) : '—',
            ],
            ['Actualizado', fmtDate(article.updatedAt)],
          ].map(([l, v]) => (
            <div key={String(l)} className="flex justify-between">
              <span>{l}</span>
              <span className="font-medium text-gray-800">{v}</span>
            </div>
          ))}
        </div>

        {/* Q&A */}
        {article.questions && article.questions.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="text-xs font-medium text-gray-700 mb-3">
              ❓ Perguntas ({article._count.questions})
            </div>
            {article.questions.slice(0, 3).map((q) => (
              <div
                key={q.id}
                className="mb-3 pb-3 border-b border-gray-100 last:border-0"
              >
                <p className="text-xs font-medium text-gray-800 mb-1">
                  {q.question}
                </p>
                {q.answer ? (
                  <p className="text-xs text-gray-600 pl-2 border-l-2 border-emerald-300">
                    {q.answer}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 italic">Sem resposta</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
