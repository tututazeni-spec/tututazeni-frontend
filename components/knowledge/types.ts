// components/knowledge/types.ts
// Tipos do domínio de base de conhecimento (portal, biblioteca,
// artigo, dashboard admin). Extraído de
// app/(platform)/knowledge/page.tsx.

export type ArticleStatus = 'DRAFT' | 'IN_REVIEW' | 'PUBLISHED' | 'ARCHIVED';
export type ArticleAccess = 'PUBLIC' | 'DEPARTMENT' | 'ROLE' | 'CONFIDENTIAL';

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
  color: string | null;
  _count: { articles: number };
  children?: Category[];
}

export interface Article {
  id: number;
  title: string;
  summary: string | null;
  content: string;
  status: ArticleStatus;
  accessLevel: ArticleAccess;
  mandatory: boolean;
  readingMinutes: number;
  viewCount: number;
  avgRating: number | null;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  author: { id: number; fullName: string; avatarUrl: string | null };
  category: {
    id: number;
    name: string;
    icon: string | null;
    color: string | null;
  } | null;
  tags: Array<{ id: number; name: string }>;
  _count: { comments: number; questions: number; acknowledgements: number };
  userBookmarked?: boolean;
  userRating?: number | null;
  userAcknowledged?: boolean;
  comments?: Comment[];
  questions?: Question[];
}

export interface Comment {
  id: number;
  content: string;
  createdAt: string;
  author: { id: number; fullName: string; avatarUrl: string | null };
  replies?: Comment[];
}

export interface Question {
  id: number;
  question: string;
  answer: string | null;
  answeredAt: string | null;
  createdAt: string;
  askedBy: { id: number; fullName: string };
}

export interface SearchResult {
  id: number;
  title: string;
  summary: string | null;
  category: { name: string; icon: string | null } | null;
  tags: Array<{ name: string }>;
  viewCount: number;
}

export interface Dashboard {
  articles: { total: number; published: number; stale: number };
  views: number;
  emptySearches: number;
  topArticles: Article[];
  recentlyUpdated: Article[];
  knowledgeGaps: Array<{ query: string; searches: number }>;
}

export type View = 'portal' | 'library' | 'article' | 'dashboard';

// view e selectedId eram dois useState separados sempre definidos em conjunto
// — um único estado torna "article sem id" irrepresentável.
export type Nav =
  { view: Exclude<View, 'article'> } | { view: 'article'; selectedId: number };
