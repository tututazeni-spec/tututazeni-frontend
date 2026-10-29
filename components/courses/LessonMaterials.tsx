// components/courses/LessonMaterials.tsx
// "Material da aula": um cartão por formato que a aula tem (Texto, PDF, PPTX,
// Vídeo…). O cartão do formato principal fica realçado; clicar leva ao leitor.

import type { ComponentType } from 'react';
import {
  ArrowRight,
  FileText,
  HelpCircle,
  Link2,
  Music,
  Package,
  PenLine,
  Presentation,
  Radio,
  Video,
} from 'lucide-react';
import type { LessonProgress } from '@/components/courses-learn/types';

interface Format {
  key: string;
  label: string;
  hint: string;
  color: string;
  Icon: ComponentType<{ size?: number; strokeWidth?: number }>;
}

const FORMATS: Record<string, Format> = {
  TEXT: {
    key: 'TEXT',
    label: 'Texto',
    hint: 'Leia o conteúdo da aula',
    color: '#2563EB',
    Icon: PenLine,
  },
  PDF: {
    key: 'PDF',
    label: 'PDF',
    hint: 'Baixe o material',
    color: '#DC2626',
    Icon: FileText,
  },
  SLIDE: {
    key: 'SLIDE',
    label: 'PPTX',
    hint: 'Apresentação da aula',
    color: '#EA580C',
    Icon: Presentation,
  },
  VIDEO: {
    key: 'VIDEO',
    label: 'Vídeo',
    hint: 'Assista ao vídeo',
    color: '#7C3AED',
    Icon: Video,
  },
  AUDIO: {
    key: 'AUDIO',
    label: 'Áudio',
    hint: 'Ouça a aula',
    color: '#0891B2',
    Icon: Music,
  },
  LINK: {
    key: 'LINK',
    label: 'Ligação',
    hint: 'Abra o conteúdo',
    color: '#0D9488',
    Icon: Link2,
  },
  SCORM: {
    key: 'SCORM',
    label: 'Interactivo',
    hint: 'Conteúdo interactivo',
    color: '#4F46E5',
    Icon: Package,
  },
  QUIZ: {
    key: 'QUIZ',
    label: 'Questionário',
    hint: 'Responda ao questionário',
    color: '#D97706',
    Icon: HelpCircle,
  },
  LIVE: {
    key: 'LIVE',
    label: 'Aula ao vivo',
    hint: 'Entre na sessão',
    color: '#E11D48',
    Icon: Radio,
  },
};

/** Formatos presentes na aula, o principal (type) primeiro. */
export function lessonFormats(lesson: LessonProgress): Format[] {
  const keys: string[] = [lesson.type];
  if (lesson.textContent?.trim() && !keys.includes('TEXT')) keys.push('TEXT');
  const hasPdf = !!lesson.hasFile || /^https?:/i.test(lesson.contentUrl ?? '');
  if (lesson.type === 'TEXT' && hasPdf) keys.push('PDF');
  if (lesson.quizId && !keys.includes('QUIZ')) keys.push('QUIZ');
  return keys.map((k) => FORMATS[k] ?? FORMATS.PDF);
}

interface LessonMaterialsProps {
  lesson: LessonProgress;
  /** id do elemento do leitor para onde o clique faz scroll. */
  targetId: string;
}

export function LessonMaterials({ lesson, targetId }: LessonMaterialsProps) {
  const formats = lessonFormats(lesson);
  return (
    <section aria-label="Material da aula">
      <h3 className="mb-3 font-display text-xl font-extrabold text-[#0F1F3D]">
        Material da aula
      </h3>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {formats.map(({ key, label, hint, color, Icon }, i) => (
          <button
            key={key}
            type="button"
            onClick={() =>
              document
                .getElementById(targetId)
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
            className={`flex flex-col gap-3 rounded-panel border bg-surface p-4 text-left shadow-[0_4px_14px_rgba(15,31,61,0.06)] transition-colors hover:bg-brand-soft ${
              i === 0 ? 'border-[#0F1F3D]' : 'border-brand-line'
            }`}
          >
            <span
              className="flex h-11 w-11 items-center justify-center rounded-card text-white"
              style={{ background: color }}
            >
              <Icon size={22} strokeWidth={1.75} />
            </span>
            <span className="font-body text-base font-extrabold text-[#0F1F3D]">
              {label}
            </span>
            <span className="flex items-center justify-between gap-2 text-xs text-brand-muted">
              {hint}
              <ArrowRight size={14} strokeWidth={1.75} className="shrink-0" />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
