// components/knowledge/ArticleCard.tsx
// Cartão de artigo (portal/biblioteca). Extraído de
// app/(platform)/knowledge/page.tsx.

'use client';

import { Avatar } from './atoms';
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
      className="bg-white border border-gray-200 rounded-xl p-5 cursor-pointer hover:shadow-md hover:border-blue-200 transition-all group"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1">
          {article.category && (
            <div className="flex items-center gap-1.5 mb-1.5">
              {article.category.icon && (
                <span className="text-sm">{article.category.icon}</span>
              )}
              <span className="text-xs text-blue-600 font-medium">
                {article.category.name}
              </span>
            </div>
          )}
          <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors leading-tight">
            {article.title}
          </div>
        </div>
        {article.mandatory && (
          <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded flex-shrink-0">
            Obrigatório
          </span>
        )}
      </div>

      {article.summary && (
        <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">
          {article.summary}
        </p>
      )}

      <div className="flex flex-wrap gap-1.5 mb-3">
        {article.tags.slice(0, 4).map((t) => (
          <span
            key={t.id}
            className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
          >
            #{t.name}
          </span>
        ))}
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <Avatar
            name={article.author.fullName}
            avatarUrl={article.author.avatarUrl}
            size="sm"
          />
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
