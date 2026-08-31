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

// Todos os tipos de resultado partilham agora a mesma aparência: fundo igual
// ao do rectângulo "Colaboradores" (bg-primary-subtle) e rótulo/ícone a preto
// (text-ink). Mantém-se a forma { color, bg } para não mexer nos consumidores.
export const TYPE_CONFIG: Record<
  string,
  { label: string; icon: LucideIcon; color: string; bg: string; path: string }
> = {
  user: {
    label: 'Colaboradores',
    icon: Users,
    color: 'text-ink',
    bg: 'bg-primary-subtle',
    path: 'users',
  },
  course: {
    label: 'Cursos',
    icon: BookOpen,
    color: 'text-ink',
    bg: 'bg-primary-subtle',
    path: 'courses',
  },
  content: {
    label: 'Conteúdos',
    icon: Zap,
    color: 'text-ink',
    bg: 'bg-primary-subtle',
    path: 'content',
  },
  document: {
    label: 'Documentos',
    icon: FileText,
    color: 'text-ink',
    bg: 'bg-primary-subtle',
    path: 'documents',
  },
  pdi: {
    label: 'PDIs',
    icon: Target,
    color: 'text-ink',
    bg: 'bg-primary-subtle',
    path: 'pdi',
  },
  competency: {
    label: 'Competências',
    icon: Brain,
    color: 'text-ink',
    bg: 'bg-primary-subtle',
    path: 'competencies',
  },
  scenario: {
    label: 'Simulações',
    icon: Award,
    color: 'text-ink',
    bg: 'bg-primary-subtle',
    path: 'scenarios',
  },
};
