// components/micro-learning/types.ts
// Tipos do domínio de micro-learning: conteúdo, progresso, dashboard,
// quiz e navegação. Extraído de app/(platform)/micro-learning/page.tsx.

export type ContentType = 'VIDEO' | 'TEXT' | 'AUDIO' | 'INFOGRAPHIC' | 'QUIZ';
export type ContentLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

export interface MicroLearning {
  id: number;
  title: string;
  description: string | null;
  contentType: ContentType;
  level: ContentLevel;
  durationSeconds: number | null;
  thumbnailUrl: string | null;
  mediaUrl: string | null;
  textContent: string | null;
  tags: string[];
  takeaways: string[];
  xpReward: number;
  viewCount: number;
  author: { id: number; fullName: string; avatarUrl: string | null } | null;
  category: { id: number; name: string } | null;
  userProgress?: {
    progress: number;
    watchedSeconds: number;
    completedAt: string | null;
  } | null;
  userLiked?: boolean;
  userSaved?: boolean;
  isCompleted?: boolean;
  quizQuestions?: QuizQuestion[];
  _count: { likes: number; comments: number };
}

export interface RecentActivityEntry {
  id: number;
  progress: number;
  completedAt: string | null;
  microLearning?: { contentType: ContentType; title: string } | null;
}

export interface MyDashboard {
  streak: { current: number; longest: number; lastActivity: string | null };
  stats: {
    completed: number;
    totalMinutes: number;
    totalXp: number;
    avgQuizScore: number;
  };
  recentActivity: RecentActivityEntry[];
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string; // JSON
}

export interface QuizOption {
  text: string;
}

export interface ParsedQuizQuestion extends Omit<QuizQuestion, 'options'> {
  options: QuizOption[];
}

export interface QuizResult {
  score: number;
  correct: number;
  total: number;
}

export interface InteractResult {
  active: boolean;
}

export type TabKey = 'feed' | 'saved' | 'dashboard';

export type Nav =
  | { view: 'feed' }
  | { view: 'saved' }
  | { view: 'dashboard' }
  | { view: 'player'; item: MicroLearning };
