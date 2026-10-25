// components/courses/CourseListCard.tsx
// Cartão de curso (separadores "Cursos", "Meus cursos" e "Gestão") — desenho
// escuro de "card para cursos criados" (public/images): fundo em gradiente na
// cor da paleta de cada curso, título em maiúsculas, imagem recortada no canto
// superior direito, métricas empilhadas, linhas com seta e painel de progresso.
// A imagem vem sempre de `thumbnailUrl`, definida na criação do curso — o
// cartão só a mostra, nunca oferece upload.

'use client';

import { Fragment, type ReactNode } from 'react';
import {
  BookOpen,
  Building2,
  CalendarDays,
  ChevronRight,
  Clock,
  GraduationCap,
  MonitorPlay,
  Tag,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { PALETTE } from '@/components/onboarding/TemplateCard';
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
import { formatDateNumeric } from '@/lib/format';

/** Campos do curso que o cartão usa — comum a `Course` e `MyEnrollment.course`. */
export interface CourseCardData {
  title: string;
  shortDescription?: string | null;
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
  /** Identificador do curso — escolhe a cor do cartão. */
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
  /** Menu de ações (vista de gestão) — fica sobre a imagem, no canto superior. */
  actions?: ReactNode;
  /** Legenda da barra de progresso (ex.: "Progresso médio"). */
  progressLabel?: string;
}

/** Cada palavra com mais de 3 letras fica na sua linha; as curtas juntam-se à vizinha. */
export function titleLines(title: string): string[] {
  const lines: string[] = [];
  let short: string[] = [];
  for (const word of title.split(/\s+/).filter(Boolean)) {
    if (word.length > 3) {
      lines.push([...short, word].join(' '));
      short = [];
    } else {
      short.push(word);
    }
  }
  if (short.length) {
    if (lines.length) lines[lines.length - 1] += ' ' + short.join(' ');
    else lines.push(short.join(' '));
  }
  return lines;
}

export function Metric({
  icon: Icon,
  children,
}: {
  icon: LucideIcon;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 text-[15px] font-medium text-white">
      <Icon size={22} strokeWidth={1.5} className="shrink-0 text-[#9DB8E0]" />
      <span>{children}</span>
    </div>
  );
}

export interface InfoRowProps {
  icon?: LucideIcon;
  /** Substitui o ícone (ex.: avatar do instrutor). */
  leading?: ReactNode;
  children: ReactNode;
}

export function InfoRow({ icon: Icon, leading, children }: InfoRowProps) {
  return (
    <div className="flex items-center gap-3 py-2.5 text-[15px] text-white">
      {leading ??
        (Icon && (
          <Icon
            size={24}
            strokeWidth={1.5}
            className="shrink-0 text-on-brand-muted"
          />
        ))}
      <span className="min-w-0 flex-1 break-words">{children}</span>
      <ChevronRight
        size={18}
        strokeWidth={1.75}
        className="shrink-0 text-on-brand-muted"
      />
    </div>
  );
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
  // Cada curso mantém a sua cor própria, escolhida pelo id.
  const palette = PALETTE[Math.abs(courseId) % PALETTE.length];
  const modality = c.modality ? COURSE_MODALITY_LABELS[c.modality] : null;
  const managing = c.status !== undefined;
  const categoryLine = [c.category, c.level && COURSE_LEVEL_MAP[c.level]?.label]
    .filter(Boolean)
    .join(' · ');
  const title = (
    <h3 className="font-body text-2xl font-extrabold uppercase leading-tight tracking-wide">
      {titleLines(c.title).map((line, i) => (
        <Fragment key={i}>
          {i > 0 && ' '}
          <span className="block whitespace-nowrap">{line}</span>
        </Fragment>
      ))}
    </h3>
  );

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
        'relative flex h-full cursor-pointer flex-col overflow-hidden rounded-panel border border-white/10 text-white shadow-[0_4px_14px_rgba(21,47,89,0.25)] transition-all duration-200 ease-out hover:scale-[1.03] hover:shadow-[0_10px_24px_rgba(21,47,89,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 motion-reduce:hover:scale-100',
      )}
      style={{
        background: `linear-gradient(165deg, ${palette[1]} 0%, ${palette[2]} 60%, ${palette[2]} 100%)`,
      }}
    >
      {/* Zona de topo: texto à esquerda, imagem recortada à direita */}
      <div className="relative min-h-[240px] shrink-0">
        <div
          aria-hidden
          className="absolute -right-6 -top-4 h-[231px] w-[62%] rotate-6 rounded-[48px] opacity-80"
          style={{ background: palette[0] }}
        />
        <div className="absolute right-0 top-0 h-[220px] w-[57%] overflow-hidden rounded-bl-[56px] rounded-tl-[48px] bg-white/10">
          <CourseThumbnail
            src={c.thumbnailUrl}
            alt={`Imagem do curso ${c.title}`}
            className="object-cover"
            fallbackClassName="text-white/60"
          />
        </div>
        {actions && (
          <div
            className="absolute right-3 top-3 z-20 rounded-full bg-brand/70"
            onClick={(ev) => ev.stopPropagation()}
            onKeyDown={(ev) => ev.stopPropagation()}
          >
            {actions}
          </div>
        )}
        <div className="relative z-10 w-[56%] px-5 pt-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
              <GraduationCap size={20} strokeWidth={1.75} />
            </span>
            <span className="line-clamp-2 text-sm font-medium leading-tight">
              {c.department?.name || c.category || 'Curso'}
            </span>
          </div>
          <div className="pt-5">
            {actions ? (
              <button type="button" className="block max-w-full text-left">
                {title}
              </button>
            ) : (
              title
            )}
            {c.shortDescription && (
              <p className="line-clamp-2 pt-2 text-sm text-on-brand-muted">
                {c.shortDescription}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex min-h-[28px] flex-wrap items-center gap-2 px-5 pt-3">
        {c.status && <StatusBadge value={c.status} map={COURSE_STATUS_MAP} />}
        {mandatory && <Badge intent="danger">Obrigatório</Badge>}
        {c.level && <StatusBadge value={c.level} map={COURSE_LEVEL_MAP} />}
      </div>

      <div className="space-y-3 px-5 pt-4">
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
              ? formatDateNumeric(c.publishedAt)
              : '—'}
          </Metric>
        )}
      </div>

      <div className="mx-5 mt-4 flex-1 divide-y divide-white/10 border-t border-white/15">
        {c.primaryInstructor !== undefined && (
          <InfoRow
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
          <InfoRow icon={Tag}>
            <span className="line-clamp-1">{categoryLine || '—'}</span>
          </InfoRow>
        )}
        <InfoRow icon={BookOpen}>
          <span className="line-clamp-1">
            {c.type ? COURSE_TYPE_LABELS[c.type] : '—'}
          </span>
        </InfoRow>
        <InfoRow icon={Building2}>
          <span className="line-clamp-1">{c.department?.name || '—'}</span>
        </InfoRow>
        <InfoRow icon={MonitorPlay}>
          <span className="line-clamp-1">{modality || '—'}</span>
        </InfoRow>
      </div>

      {(myStatus || deadlineLabel || progress !== undefined) && (
        <div className="m-4 mt-2 space-y-2 rounded-panel bg-white/10 px-4 py-3">
          {(myStatus || deadlineLabel) && (
            <div className="flex items-center justify-between font-body text-xs">
              {deadlineLabel ? (
                <span
                  className={cn(
                    'font-medium',
                    overdue ? 'text-[#FF9AA8]' : 'text-on-brand-muted',
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
            <p className="text-xs text-on-brand-muted">{progressLabel}</p>
          )}
          {progress !== undefined && (
            <div className="flex items-center gap-3">
              <ProgressBar
                value={progress}
                color={palette[3]}
                className="flex-1"
              />
              <span className="text-xs tabular-nums text-on-brand-muted">
                {progress}%
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
