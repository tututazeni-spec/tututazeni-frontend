// components/content-library/constants.ts
// Constantes de domínio partilhadas pelos componentes de apresentação do
// módulo. Extraído verbatim de app/(platform)/content-library/page.tsx.
//
// Migrado para a fundação de design: as cores decorativas por formato/nível
// passam a tokens semânticos (bg-*-subtle/text-*-ink). Sem correspondência
// directa "1 cor decorativa = 1 formato" — cada valor recebe um token só
// para manter a distinção visual entre formatos/níveis, mesmo padrão de
// components/micro-learning/constants.ts (TYPE_CFG/LEVEL_CFG).

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

export const FORMAT_CLS: Record<string, string> = {
  VIDEO: 'bg-danger-subtle text-danger-ink',
  ARTICLE: 'bg-info-subtle text-info-ink',
  PODCAST: 'bg-accent-subtle text-accent',
  PDF: 'bg-warning-subtle text-warning-ink',
  SCORM: 'bg-primary-subtle text-primary',
  MICROLEARNING: 'bg-accent-subtle text-accent',
  COURSE: 'bg-success-subtle text-success-ink',
  QUIZ: 'bg-danger-subtle text-danger-ink',
};
export const FORMAT_CLS_FALLBACK = 'bg-surface-sunken text-ink-muted';

export const LEVEL_CLS: Record<string, string> = {
  BEGINNER: 'text-success',
  INTERMEDIATE: 'text-warning',
  ADVANCED: 'text-warning',
  EXPERT: 'text-danger',
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
