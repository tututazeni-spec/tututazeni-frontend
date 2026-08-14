// components/knowledge/constants.ts
// Badge de estado do artigo e navegação do módulo. Extraído de
// app/(platform)/knowledge/page.tsx. Cores mapeadas para os tokens
// semânticos da fundação de design (Fase A).

import type { StatusBadgeMap } from '@/lib/statusBadge';
import type { ArticleStatus, View } from './types';

export const ARTICLE_STATUS_MAP: StatusBadgeMap<ArticleStatus> = {
  DRAFT: { label: 'Rascunho', cls: 'bg-surface-sunken text-ink-muted' },
  IN_REVIEW: { label: 'Em revisão', cls: 'bg-warning-subtle text-warning-ink' },
  PUBLISHED: { label: 'Publicado', cls: 'bg-success-subtle text-success-ink' },
  ARCHIVED: { label: 'Arquivado', cls: 'bg-surface-sunken text-ink-faint' },
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
