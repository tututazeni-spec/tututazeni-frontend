// components/knowledge/ArticleCard.tsx
// Cartão de artigo (portal/biblioteca). Extraído de
// app/(platform)/knowledge/page.tsx. Migrado para a fundação de design:
// Avatar local passa a components/ui/Avatar; wrapper clicável implementado
// com div própria (role="button" + tabIndex + onKeyDown manual) em vez do
// `Card` da fundação com a prop `interactive` — bug conhecido (ver plano
// de rollout), mesmo padrão já usado em components/micro-learning/MicroCard.tsx.

'use client';

import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { timeAgo } from './utils';
import type { Article } from './types';

interface ArticleCardProps {
  article: Article;
  onClick: () => void;
}

export function ArticleCard({ article, onClick }: ArticleCardProps) {
  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="group cursor-pointer rounded-card border border-border bg-surface p-5 shadow-resting transition-shadow duration-150 hover:shadow-hover"
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <div className="flex-1">
          {article.category && (
            <div className="mb-1.5 flex items-center gap-1.5">
              {article.category.icon && (
                <span className="text-sm">{article.category.icon}</span>
              )}
              <span className="font-body text-xs font-medium text-primary">
                {article.category.name}
              </span>
            </div>
          )}
          <div className="font-body text-sm font-semibold leading-tight text-ink transition-colors group-hover:text-primary">
            {article.title}
          </div>
        </div>
        {article.mandatory && (
          <Badge intent="danger" className="flex-shrink-0">
            Obrigatório
          </Badge>
        )}
      </div>

      {article.summary && (
        <p className="mb-3 line-clamp-2 font-body text-xs leading-relaxed text-ink-muted">
          {article.summary}
        </p>
      )}

      <div className="mb-3 flex flex-wrap gap-1.5">
        {article.tags.slice(0, 4).map((t) => (
          <span
            key={t.id}
            className="rounded bg-surface-sunken px-1.5 py-0.5 font-body text-xs text-ink-muted"
          >
            #{t.name}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between font-body text-xs text-ink-faint">
        <div className="flex items-center gap-2">
          <Avatar name={article.author.fullName} url={article.author.avatarUrl ?? undefined} size="sm" />
          <span>{article.author.fullName}</span>
        </div>
        <div className="flex items-center gap-3">
          <span>👁 {article.viewCount}</span>
          <span>⏱ {article.readingMinutes}min</span>
          {article.avgRating && <span>★ {article.avgRating.toFixed(1)}</span>}
          <span>{timeAgo(article.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
}
