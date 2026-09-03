// components/knowledge/ArticleDetailView.tsx
// Separador "Artigo" — conteúdo, comentários, acções (bookmark/
// confirmação/avaliação), estatísticas e Q&A. Dados próprios +
// apresentação. Extraído de app/(platform)/knowledge/page.tsx. Migrado
// para a fundação de design: Avatar/Skeleton locais passam a
// components/ui/; textarea/botões de comentário passam a Textarea/Button;
// badge "Obrigatório" passa a Badge.

'use client';

import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Bookmark,
  Check,
  Calendar,
  Clock,
  Eye,
  MessageSquare,
  HelpCircle,
} from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { reportError } from '@/lib/errorReporting';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { sanitizeHtml } from '@/lib/sanitize';
import { formatDate as fmtDate } from '@/lib/format';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/providers/ToastProvider';
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
  const notify = useToast();
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
      reportError(e, { source: 'ArticleDetailView.handleBookmark' });
      notify({
        title: e instanceof Error ? e.message : String(e),
        intent: 'danger',
      });
    }
  };

  const handleRate = async (score: number) => {
    try {
      await apiClient.post('/knowledge/rate', { articleId, score });
      setRating(score);
    } catch (e) {
      reportError(e, { source: 'ArticleDetailView.handleRate' });
      notify({
        title: e instanceof Error ? e.message : String(e),
        intent: 'danger',
      });
    }
  };

  const commentMutation = useApiMutation(
    () =>
      apiClient.post('/knowledge/comments', { articleId, content: comment }),
    {
      invalidateKeys: [articleKey],
      onSuccess: () => setComment(''),
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
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
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
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
          className="mb-5 flex items-center gap-1 font-body text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft size={14} strokeWidth={1.75} />
          Voltar
        </button>

        {/* Header */}
        <div className="mb-5 rounded-card border border-border bg-surface p-6">
          {article.category && (
            <div className="mb-2 flex items-center gap-1.5">
              {article.category.icon && <span>{article.category.icon}</span>}
              <span className="font-body text-xs font-medium text-primary">
                {article.category.name}
              </span>
            </div>
          )}
          <h1 className="mb-3 font-display text-2xl font-bold text-ink">
            {article.title}
          </h1>
          {article.summary && (
            <p className="mb-4 font-body text-sm text-ink-muted">
              {article.summary}
            </p>
          )}

          <div className="mb-4 flex flex-wrap items-center gap-4 font-body text-xs text-ink-faint">
            <div className="flex items-center gap-2">
              <Avatar
                name={article.author.fullName}
                url={article.author.avatarUrl ?? undefined}
                size="sm"
              />
              <span>{article.author.fullName}</span>
            </div>
            <span className="inline-flex items-center gap-1">
              <Calendar size={12} strokeWidth={1.75} />{' '}
              {fmtDate(article.updatedAt)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock size={12} strokeWidth={1.75} /> {article.readingMinutes}{' '}
              min de leitura
            </span>
            <span className="inline-flex items-center gap-1">
              <Eye size={12} strokeWidth={1.75} /> {article.viewCount}{' '}
              visualizações
            </span>
            <StatusBadge value={article.status} map={ARTICLE_STATUS_MAP} />
            {article.mandatory && <Badge intent="danger">Obrigatório</Badge>}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {article.tags.map((t) => (
              <span
                key={t.id}
                className="rounded bg-primary-subtle px-2 py-0.5 font-body text-xs text-primary"
              >
                #{t.name}
              </span>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="mb-5 rounded-card border border-border bg-surface p-6">
          <div
            className="prose prose-sm max-w-none text-ink"
            dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }}
          />
        </div>

        {/* Comentários */}
        <div className="rounded-card border border-border bg-surface p-5">
          <div className="mb-4 font-body text-sm font-semibold text-ink">
            <MessageSquare
              size={16}
              strokeWidth={1.75}
              className="inline align-[-3px]"
            />{' '}
            Comentários ({article._count.comments})
          </div>
          <div className="mb-4 flex gap-3">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={2}
              placeholder="Escreve um comentário…"
              className="flex-1 resize-none rounded-card"
            />
            <Button
              size="sm"
              onClick={handleComment}
              disabled={!comment.trim() || posting}
              className="flex-shrink-0 self-end"
            >
              {posting ? '…' : 'Enviar'}
            </Button>
          </div>
          <div className="space-y-4">
            {article.comments?.map((c) => (
              <div key={c.id} className="flex gap-3">
                <Avatar
                  name={c.author.fullName}
                  url={c.author.avatarUrl ?? undefined}
                  size="sm"
                />
                <div className="flex-1">
                  <div className="mb-1 flex items-center gap-2">
                    <span className="font-body text-xs font-medium text-ink">
                      {c.author.fullName}
                    </span>
                    <span className="font-body text-xs text-ink-faint">
                      {timeAgo(c.createdAt)}
                    </span>
                  </div>
                  <p className="font-body text-sm text-ink-muted">
                    {c.content}
                  </p>
                  {c.replies?.map((r) => (
                    <div key={r.id} className="ml-4 mt-2 flex gap-2">
                      <Avatar
                        name={r.author.fullName}
                        url={r.author.avatarUrl ?? undefined}
                        size="sm"
                      />
                      <div>
                        <span className="font-body text-xs font-medium text-ink">
                          {r.author.fullName}{' '}
                        </span>
                        <span className="font-body text-sm text-ink-muted">
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
        <div className="space-y-3 rounded-card border border-border bg-surface p-4">
          <Button
            onClick={handleBookmark}
            intent={article.userBookmarked ? 'secondary' : 'ghost'}
            className="w-full"
          >
            <Bookmark size={16} strokeWidth={1.75} />
            {article.userBookmarked ? 'Guardado' : 'Guardar'}
          </Button>

          {article.mandatory && !article.userAcknowledged && (
            <Button
              onClick={handleAcknowledge}
              disabled={acknowledging}
              intent="success"
              className="w-full"
            >
              <Check size={16} strokeWidth={1.75} />
              {acknowledging ? '…' : 'Li e estou ciente'}
            </Button>
          )}
          {article.userAcknowledged && (
            <div className="rounded-control bg-success-subtle py-2.5 text-center font-body text-xs font-medium text-success-ink">
              ✓ Confirmado
            </div>
          )}
        </div>

        {/* Rating */}
        <div className="rounded-card border border-border bg-surface p-4">
          <div className="mb-2 font-body text-xs text-ink-faint">
            Avaliar artigo
          </div>
          <div className="mb-1 flex gap-1">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                onClick={() => handleRate(s)}
                onMouseEnter={() => setHovRating(s)}
                onMouseLeave={() => setHovRating(0)}
                className={`text-2xl transition-colors hover:scale-110 ${
                  s <= displayRating ? 'text-accent' : 'text-border-strong'
                }`}
              >
                ★
              </button>
            ))}
          </div>
          {article.avgRating && (
            <div className="font-body text-xs text-ink-faint">
              Média: {article.avgRating.toFixed(1)}/5
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="space-y-2 rounded-card bg-surface-sunken p-4 font-body text-xs text-ink-muted">
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
              <span className="font-medium text-ink">{v}</span>
            </div>
          ))}
        </div>

        {/* Q&A */}
        {article.questions && article.questions.length > 0 && (
          <div className="rounded-card border border-border bg-surface p-4">
            <div className="mb-3 font-body text-xs font-medium text-ink-muted">
              <HelpCircle
                size={16}
                strokeWidth={1.75}
                className="inline align-[-3px]"
              />{' '}
              Perguntas ({article._count.questions})
            </div>
            {article.questions.slice(0, 3).map((q) => (
              <div
                key={q.id}
                className="mb-3 border-b border-border pb-3 last:border-0"
              >
                <p className="mb-1 font-body text-xs font-medium text-ink">
                  {q.question}
                </p>
                {q.answer ? (
                  <p className="border-l-2 border-success-subtle pl-2 font-body text-xs text-ink-muted">
                    {q.answer}
                  </p>
                ) : (
                  <p className="font-body text-xs italic text-ink-faint">
                    Sem resposta
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
