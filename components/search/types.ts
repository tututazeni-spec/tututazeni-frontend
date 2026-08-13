// components/search/types.ts

import type { LucideIcon } from 'lucide-react';
import {
  Users,
  BookOpen,
  FileText,
  Target,
  Brain,
  Zap,
  Award,
} from 'lucide-react';

export interface SearchResult {
  type: string;
  id: number | string;
  title: string;
  subtitle: string;
  url?: string;
  avatarUrl?: string;
  thumbnailUrl?: string;
  mandatory?: boolean;
}

export interface SearchResponse {
  query: string;
  grouped: Record<string, SearchResult[]>;
  counts: Record<string, number>;
}

export interface SuggestionsData {
  trendingSearches?: string[];
  recommendedCourses?: SearchResult[];
  popularContent?: SearchResult[];
}

export interface HistoryEntry {
  query: string;
}
export interface HistoryResponse {
  history?: HistoryEntry[];
}

export interface AutocompleteSuggestion {
  text: string;
  type: string;
}
export interface AutocompleteResponse {
  suggestions?: AutocompleteSuggestion[];
}

export interface ByTypeSearchResponse {
  results: SearchResult[];
  count: number;
}

// Cores mapeadas para os tokens semânticos da fundação de design (Fase A) —
// 7 tipos de resultado, 7 tokens de intenção distintos (primary/accent/
// success/warning/danger/info/neutral), mesma forma { color, bg } de antes.
export const TYPE_CONFIG: Record<
  string,
  { label: string; icon: LucideIcon; color: string; bg: string; path: string }
> = {
  user: {
    label: 'Colaboradores',
    icon: Users,
    color: 'text-primary',
    bg: 'bg-primary-subtle',
    path: 'users',
  },
  course: {
    label: 'Cursos',
    icon: BookOpen,
    color: 'text-accent',
    bg: 'bg-accent-subtle',
    path: 'courses',
  },
  content: {
    label: 'Conteúdos',
    icon: Zap,
    color: 'text-info-ink',
    bg: 'bg-info-subtle',
    path: 'content',
  },
  document: {
    label: 'Documentos',
    icon: FileText,
    color: 'text-warning-ink',
    bg: 'bg-warning-subtle',
    path: 'documents',
  },
  pdi: {
    label: 'PDIs',
    icon: Target,
    color: 'text-success-ink',
    bg: 'bg-success-subtle',
    path: 'pdi',
  },
  competency: {
    label: 'Competências',
    icon: Brain,
    color: 'text-danger-ink',
    bg: 'bg-danger-subtle',
    path: 'competencies',
  },
  scenario: {
    label: 'Simulações',
    icon: Award,
    color: 'text-ink-muted',
    bg: 'bg-surface-sunken',
    path: 'scenarios',
  },
};
