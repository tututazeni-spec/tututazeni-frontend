// components/content-library/constants.ts
// Constantes de domínio partilhadas pelos componentes de apresentação do
// módulo. Extraído verbatim de app/(platform)/content-library/page.tsx.

import {
  BookOpen,
  Brain,
  FileText,
  Globe,
  Headphones,
  Shield,
  Star,
  TrendingUp,
  Video,
  Zap,
  type LucideIcon,
} from 'lucide-react';

export const FORMAT_ICON: Record<string, LucideIcon> = {
  VIDEO: Video,
  ARTICLE: FileText,
  PODCAST: Headphones,
  PDF: FileText,
  EBOOK: BookOpen,
  SCORM: Brain,
  COURSE: BookOpen,
  MICROLEARNING: Zap,
  QUIZ: Brain,
  WEBINAR: Video,
  HTML5: Globe,
  DEFAULT: BookOpen,
};

export const FORMAT_COLOR: Record<string, string> = {
  VIDEO: 'bg-red-100 text-red-700',
  ARTICLE: 'bg-blue-100 text-blue-700',
  PODCAST: 'bg-purple-100 text-purple-700',
  PDF: 'bg-orange-100 text-orange-700',
  SCORM: 'bg-indigo-100 text-indigo-700',
  MICROLEARNING: 'bg-amber-100 text-amber-700',
  COURSE: 'bg-emerald-100 text-emerald-700',
  QUIZ: 'bg-pink-100 text-pink-700',
};

export const LEVEL_COLOR: Record<string, string> = {
  BEGINNER: 'text-emerald-600',
  INTERMEDIATE: 'text-amber-600',
  ADVANCED: 'text-orange-600',
  EXPERT: 'text-red-600',
};

// Definido no ficheiro original mas nunca ligado a nenhum elemento (sem
// nenhum lugar na UI que renderize categoria+ícone). Mantido — mapeamento
// categoria→ícone tem valor de domínio e é candidato natural a um futuro
// filtro/badge de categoria no catálogo — mas continua por usar, tal como
// no original.
export const CATEGORY_ICON: Record<string, LucideIcon> = {
  HARD_SKILLS: Brain,
  SOFT_SKILLS: Star,
  COMPLIANCE: Shield,
  ONBOARDING: BookOpen,
  LANGUAGES: Globe,
  LEADERSHIP: TrendingUp,
};
