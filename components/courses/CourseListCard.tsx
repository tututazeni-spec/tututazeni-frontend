// components/courses/CourseListCard.tsx
// Cartão de curso (separador "Cursos" e "Meus cursos") — mesmo desenho e
// lógica do cartão de evento publicado (components/events/EventCard.tsx):
// faixa de título com a cor da paleta, imagem, badges por baixo da foto,
// métricas e linhas de informação. A imagem vem sempre de `thumbnailUrl`, definida na
// criação do curso — o cartão só a mostra, nunca oferece upload.

'use client';

import type { ReactNode } from 'react';
import {
  BookOpen,
  Building2,
  CalendarDays,
  Clock,
  MonitorPlay,
  Tag,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { InfoRow, Metric } from '@/components/events/EventListCard';
import {
  headerBackground,
  PALETTE,
} from '@/components/onboarding/TemplateCard';
import { CourseThumbnail } from './CourseThumbnail';
import {
  COURSE_LEVEL_MAP,
  COURSE_MODALITY_LABELS,
  COURSE_STATUS_MAP,
  COURSE_TYPE_LABELS,
  ENROLLMENT_STATUS_MAP,
  fmtDuration,
} from './shared';
import type {
  CourseLevel,
  CourseModality,
  CourseStatus,
  CourseType,
  EnrollmentStatus,
} from './types';

/** Campos do curso que o cartão usa — comum a `Course` e `MyEnrollment.course`. */
export interface CourseCardData {
  title: string;
  thumbnailUrl: string | null;
  category: string | null;
  workloadHours: number | null;
  level?: CourseLevel;
  modality?: CourseModality | null;
  department?: { id: number; name: string } | null;
  _count?: { enrollments: number };
  // Vista de gestão (separador "Cursos" do admin) — só aparecem se vierem.
  status?: CourseStatus;
  type?: CourseType | null;
  publishedAt?: string | null;
  primaryInstructor?: { fullName: string; avatarUrl: string | null } | null;
}

interface CourseListCardProps {
  /** Identificador do curso — escolhe a cor da faixa. */
  courseId: number;
  course: CourseCardData;
  onSelect: () => void;
  /** Estado da minha inscrição (como `myStatus` no cartão de evento). */
  myStatus?: EnrollmentStatus;
  /** Progresso da minha inscrição, 0–100. Sem valor, a barra não aparece. */
  progress?: number;
  mandatory?: boolean;
  /** Texto do prazo da minha inscrição (já formatado). */
  deadlineLabel?: string;
  overdue?: boolean;
  /** Menu de ações (vista de gestão) — fica no canto da faixa de título. */
  actions?: ReactNode;
  /** Legenda da barra de progresso (ex.: "Progresso médio"). */
  progressLabel?: string;
}

export function CourseListCard({
  courseId,
  course: c,
  onSelect,
  myStatus,
  progress,
  mandatory,
  deadlineLabel,
  overdue,
  actions,
  progressLabel,
}: CourseListCardProps) {
  const palette = PALETTE[Math.abs(courseId) % PALETTE.length];
  const modality = c.modality ? COURSE_MODALITY_LABELS[c.modality] : null;
  const managing = c.status !== undefined;
  const categoryLine = [c.category, c.level && COURSE_LEVEL_MAP[c.level]?.label]
    .filter(Boolean)
    .join(' · ');

  return (
    <div
      // Com menu de ações o cartão não é um "botão" (botões aninhados): o
      // clique continua a abrir o curso e o título passa a ser o botão.
      role={actions ? undefined : 'button'}
      tabIndex={actions ? undefined : 0}
      onClick={onSelect}
      onKeyDown={(ev) => {
        if (ev.target !== ev.currentTarget) return;
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          onSelect();
        }
      }}
      className={cn(
        'relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-[#D8E2F0] bg-white shadow-[0_4px_14px_rgba(21,47,89,0.08)] transition-all duration-200 ease-out hover:scale-[1.03] hover:shadow-[0_10px_24px_rgba(21,47,89,0.16)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 motion-reduce:hover:scale-100',
      )}
    >
      {/* Faixa de título */}
      <div
        className={cn(
          'relative flex min-h-[60px] shrink-0 items-center justify-center py-2 text-center text-white',
          actions ? 'px-11' : 'px-4',
        )}
        style={{ background: headerBackground(palette) }}
      >
        <div className="min-w-0">
          {actions ? (
            <button type="button" className="block max-w-full text-center">
              <h3 className="line-clamp-2 font-body text-lg font-semibold leading-tight">
                {c.title}
              </h3>
            </button>
          ) : (
            <h3 className="line-clamp-2 font-body text-lg font-semibold leading-tight">
              {c.title}
            </h3>
          )}
        </div>
        {actions && (
          <div
            className="absolute right-2 top-1/2 -translate-y-1/2"
            onClick={(ev) => ev.stopPropagation()}
            onKeyDown={(ev) => ev.stopPropagation()}
          >
            {actions}
          </div>
        )}
      </div>
      {/* Imagem do curso (definida na criação) ou ícone */}
      <div className="relative h-[140px] shrink-0 bg-[#E3EAF4]">
        <CourseThumbnail
          src={c.thumbnailUrl}
          alt={`Imagem do curso ${c.title}`}
          className="object-cover"
        />
      </div>

      <div className="flex min-h-[28px] flex-wrap items-center gap-2 px-5 pt-3">
        {c.status && <StatusBadge value={c.status} map={COURSE_STATUS_MAP} />}
        {mandatory && <Badge intent="danger">Obrigatório</Badge>}
        {c.level && <StatusBadge value={c.level} map={COURSE_LEVEL_MAP} />}
      </div>

      <div className="flex flex-wrap items-center gap-y-2 divide-x divide-[#E6ECF4] px-5 pt-3">
        <Metric icon={Clock}>{fmtDuration(c.workloadHours)}</Metric>
        {c._count && (
          <Metric icon={Users}>
            {managing
              ? `Formandos: ${c._count.enrollments}`
              : c._count.enrollments}
          </Metric>
        )}
        {c.publishedAt !== undefined && (
          <Metric icon={CalendarDays}>
            {c.publishedAt
              ? new Date(c.publishedAt).toLocaleDateString('pt')
              : '—'}
          </Metric>
        )}
      </div>

      <div className="flex-1 space-y-2 px-5 py-4">
        {c.primaryInstructor !== undefined && (
          <InfoRow
            accent={palette[3]}
            leading={
              <Avatar
                name={c.primaryInstructor?.fullName ?? '?'}
                url={c.primaryInstructor?.avatarUrl ?? undefined}
                size="sm"
              />
            }
          >
            <span className="line-clamp-1">
              {c.primaryInstructor?.fullName ?? 'Sem instrutor'}
            </span>
          </InfoRow>
        )}
        {/* Linhas sempre presentes (com "—" se vazias) para alinhar os cartões */}
        {managing && (
          <InfoRow icon={Tag} accent={palette[3]}>
            <span className="line-clamp-1">{categoryLine || '—'}</span>
          </InfoRow>
        )}
        <InfoRow icon={BookOpen} accent={palette[3]}>
          <span className="line-clamp-1">
            {c.type ? COURSE_TYPE_LABELS[c.type] : '—'}
          </span>
        </InfoRow>
        <InfoRow icon={Building2} accent={palette[3]}>
          <span className="line-clamp-1">{c.department?.name || '—'}</span>
        </InfoRow>
        <InfoRow icon={MonitorPlay} accent={palette[3]}>
          <span className="line-clamp-1">{modality || '—'}</span>
        </InfoRow>

        {(myStatus || deadlineLabel) && (
          <div className="flex items-center justify-between pt-1 font-body text-xs">
            {deadlineLabel ? (
              <span
                className={cn(
                  'font-medium',
                  overdue ? 'text-danger' : 'text-ink-muted',
                )}
              >
                {deadlineLabel}
              </span>
            ) : (
              <span />
            )}
            {myStatus && (
              <StatusBadge value={myStatus} map={ENROLLMENT_STATUS_MAP} />
            )}
          </div>
        )}
        {progress !== undefined && progressLabel && (
          <p className="pt-1 text-xs text-ink-muted">{progressLabel}</p>
        )}
        {progress !== undefined && (
          <div className="flex items-center gap-3">
            <ProgressBar
              value={progress}
              color={palette[3]}
              className="flex-1"
            />
            <span className="text-xs tabular-nums text-ink-muted">
              {progress}%
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
