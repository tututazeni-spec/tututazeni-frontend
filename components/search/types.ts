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

export const TYPE_CONFIG: Record<
  string,
  { label: string; icon: LucideIcon; color: string; bg: string; path: string }
> = {
  user: {
    label: 'Colaboradores',
    icon: Users,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    path: 'users',
  },
  course: {
    label: 'Cursos',
    icon: BookOpen,
    color: 'text-teal-600',
    bg: 'bg-teal-50',
    path: 'courses',
  },
  content: {
    label: 'Conteúdos',
    icon: Zap,
    color: 'text-blue-600',
    bg: 'bg-blue-50',
    path: 'content',
  },
  document: {
    label: 'Documentos',
    icon: FileText,
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    path: 'documents',
  },
  pdi: {
    label: 'PDIs',
    icon: Target,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    path: 'pdi',
  },
  competency: {
    label: 'Competências',
    icon: Brain,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    path: 'competencies',
  },
  scenario: {
    label: 'Simulações',
    icon: Award,
    color: 'text-pink-600',
    bg: 'bg-pink-50',
    path: 'scenarios',
  },
};
