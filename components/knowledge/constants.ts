// components/knowledge/constants.ts
// Badge de estado do artigo e navegação do módulo. Extraído de
// app/(platform)/knowledge/page.tsx.

import type { StatusBadgeMap } from '@/lib/statusBadge';
import type { ArticleStatus, View } from './types';

export const ARTICLE_STATUS_MAP: StatusBadgeMap<ArticleStatus> = {
  DRAFT: { label: 'Rascunho', cls: 'bg-gray-100 text-gray-500' },
  IN_REVIEW: { label: 'Em revisão', cls: 'bg-amber-50 text-amber-700' },
  PUBLISHED: { label: 'Publicado', cls: 'bg-emerald-50 text-emerald-700' },
  ARCHIVED: { label: 'Arquivado', cls: 'bg-gray-100 text-gray-400' },
};

export const NAV: Array<{ id: Exclude<View, 'article'>; label: string }> = [
  { id: 'portal', label: '🏠 Portal' },
  { id: 'library', label: '📚 Biblioteca' },
  { id: 'dashboard', label: '📊 Admin' },
];

export const TITLES: Record<View, string> = {
  portal: 'Base de Conhecimento',
  library: 'Biblioteca de Artigos',
  article: 'Artigo',
  dashboard: 'Dashboard Admin',
};
