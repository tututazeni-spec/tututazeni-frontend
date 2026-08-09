// components/content-library/types.ts
// Tipos do domínio "biblioteca de conteúdos" — movidos verbatim de
// app/(platform)/content-library/page.tsx.

export type Tab = 'home' | 'catalogue' | 'paths' | 'my-progress' | 'analytics';

export interface Content {
  id: number;
  title: string;
  description?: string;
  type: string;
  url: string;
  thumbnailUrl?: string;
  author?: string;
  durationMin?: number;
  level?: string;
  category?: string;
  language?: string;
  mandatory?: boolean;
  isMicrolearning?: boolean;
  hasCertification?: boolean;
  viewCount?: number;
  avgRating?: number;
  progress?: { progress: number } | null;
  isBookmarked?: boolean;
  createdAt: string;
  completed?: boolean;
}

export interface ProgressEntry {
  contentId: number;
  progress: number;
  content?: Content;
}

export interface MyProgressResponse {
  data: ProgressEntry[];
  stats: { completed: number };
}

export interface MyContentStats {
  viewCount: number;
  completions: number;
  bookmarkCount: number;
  totalHours: number;
}

export interface FormatBreakdownItem {
  format: string;
  count: number;
}

export interface MostViewedItem {
  content?: { title: string; type?: string };
  weeklyViews: number;
}

export interface RecentlyAddedItem {
  id: number;
  type: string;
  title: string;
  createdAt: string;
}

export interface ContentAnalytics {
  kpis: {
    totalContent?: number;
    activeContent?: number;
    totalViews?: number;
    totalCompletions?: number;
  };
  formatBreakdown?: FormatBreakdownItem[];
  mostViewed?: MostViewedItem[];
  recentlyAdded?: RecentlyAddedItem[];
}

export interface LearningPath {
  id: number;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  hasCertification?: boolean;
  xpReward?: number;
  totalItems?: number;
  completedItems?: number;
  overallProgress?: number;
}
