// components/avatar-training/cards.tsx
// Cartões do módulo Avatar Training, reutilizando os desenhos do módulo Cursos:
//  - PhotoCard (public/images/card para cursos criados.jpeg) → formações com
//    avatar e sessões da Sala de Formação Virtual;
//  - NavyCard (public/images/inscrições.jpeg) → sessões disponíveis nas abas
//    Simulações, Base de Conhecimento, Avaliações, Competências e Progresso.

'use client';

import type { ReactNode } from 'react';
import {
  Bot,
  CalendarDays,
  Clock,
  Globe,
  GraduationCap,
  Layers,
  Star,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { QueryError } from '@/components/ui/QueryError';
import { Skeleton } from '@/components/ui/Skeleton';
import { formatDate } from '@/lib/format';
import { PhotoCard } from '@/components/courses/PhotoCard';
import {
  NavyBadge,
  NavyCard,
  type NavyTone,
} from '@/components/courses/NavyCard';
import { useSessionList } from './SessionPicker';
import {
  ASSIGNMENT_STATUS,
  DIFFICULTY_LABEL,
  EXPERIENCE_LABEL,
  PROGRAM_STATUS,
} from './constants';
import type {
  AssignmentStatus,
  AvatarProgram,
  MyAssignment,
  ProgramStatus,
  SessionListItem,
} from './types';

const PROGRAM_TONE: Record<ProgramStatus, NavyTone> = {
  DRAFT: 'neutral',
  IN_REVIEW: 'warning',
  PUBLISHED: 'success',
  ARCHIVED: 'neutral',
};

export const ASSIGNMENT_TONE: Record<AssignmentStatus, NavyTone> = {
  ASSIGNED: 'info',
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
  OVERDUE: 'danger',
  CANCELLED: 'neutral',
};

/** Classe dos botões de acção sobre os cartões escuros. */
export const CARD_BTN =
  'inline-flex h-8 items-center justify-center rounded-full bg-white/90 px-3 text-xs font-semibold text-brand hover:bg-white disabled:opacity-50';
export const CARD_BTN_GHOST =
  'inline-flex h-8 items-center justify-center rounded-full bg-brand/70 px-3 text-xs font-medium text-white/90 hover:bg-white/25 hover:text-white disabled:opacity-50';

export function CardGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {children}
    </div>
  );
}

// ─── Formações com avatar (design "cursos criados") ─────────────────────────

export interface ProgramCardProps {
  program: AvatarProgram;
  footer?: ReactNode;
  onSelect: () => void;
}

export function ProgramCard({
  program: p,
  footer,
  onSelect,
}: ProgramCardProps) {
  const sessions = p._count?.sessions;
  return (
    <PhotoCard
      seed={p.id}
      kicker={p.category ?? 'Formação com avatar'}
      kickerIcon={GraduationCap}
      title={p.title}
      subtitle={p.description ?? p.code}
      image={p.avatar?.imageUrl}
      fallback={<Bot size={64} strokeWidth={1.25} />}
      badges={
        <>
          <NavyBadge tone={PROGRAM_TONE[p.status]}>
            {PROGRAM_STATUS[p.status].label}
          </NavyBadge>
          <NavyBadge tone="info">
            {EXPERIENCE_LABEL[p.experienceType]}
          </NavyBadge>
          <NavyBadge tone="warning">
            {DIFFICULTY_LABEL[p.difficulty] ?? p.difficulty}
          </NavyBadge>
        </>
      }
      metrics={[
        {
          icon: Clock,
          text: p.durationMinutes ? `${p.durationMinutes} min` : 'Sem duração',
        },
        {
          icon: Layers,
          text: `${sessions ?? 0} ${sessions === 1 ? 'sessão' : 'sessões'}`,
        },
        {
          icon: Globe,
          text: `${(p.language ?? 'pt').toUpperCase()} · v${p.version}`,
        },
      ]}
      rows={[
        { icon: Bot, text: p.avatar?.name ?? 'Sem avatar' },
        { icon: GraduationCap, text: p.course?.title ?? 'Sem curso associado' },
      ]}
      footer={footer}
      onSelect={onSelect}
    />
  );
}

// ─── Sessões atribuídas (Sala = cursos criados; Simulações = inscrições) ────

function assignmentFacts(a: MyAssignment) {
  const last = a.attempts[0];
  const progress = Math.max(0, Math.min(100, Math.round(last?.progress ?? 0)));
  return {
    last,
    progress,
    duration: a.session.durationMinutes
      ? `${a.session.durationMinutes} min`
      : 'Sem duração',
    due: a.dueDate ? formatDate(a.dueDate) : 'Sem prazo',
    score: last?.score != null ? String(last.score) : '—',
  };
}

export function AssignmentPhotoCard({
  assignment: a,
  footer,
}: {
  assignment: MyAssignment;
  footer?: ReactNode;
}) {
  const f = assignmentFacts(a);
  return (
    <PhotoCard
      seed={a.sessionId}
      kicker={a.session.program.title}
      kickerIcon={Bot}
      title={a.session.title}
      subtitle={EXPERIENCE_LABEL[a.session.experienceType]}
      fallback={<Bot size={64} strokeWidth={1.25} />}
      badges={
        <>
          <NavyBadge tone={ASSIGNMENT_TONE[a.status]}>
            {ASSIGNMENT_STATUS[a.status].label}
          </NavyBadge>
          {a.mandatory && <NavyBadge tone="danger">Obrigatória</NavyBadge>}
        </>
      }
      metrics={[
        { icon: Clock, text: f.duration },
        { icon: CalendarDays, text: `Prazo: ${f.due}` },
        { icon: Star, text: `Melhor nota: ${f.score}` },
      ]}
      progress={{ value: f.progress, label: 'Progresso' }}
      footer={footer}
    />
  );
}

export function AssignmentNavyCard({
  assignment: a,
  footer,
}: {
  assignment: MyAssignment;
  footer?: ReactNode;
}) {
  const f = assignmentFacts(a);
  return (
    <NavyCard
      seed={a.sessionId}
      kicker={a.session.program.title}
      kickerIcon={Bot}
      title={a.session.title}
      subtitle={EXPERIENCE_LABEL[a.session.experienceType]}
      badge={
        <>
          <NavyBadge tone={ASSIGNMENT_TONE[a.status]}>
            {ASSIGNMENT_STATUS[a.status].label}
          </NavyBadge>
          {a.mandatory && <NavyBadge tone="danger">Obrigatória</NavyBadge>}
        </>
      }
      infos={[
        { icon: Clock, value: f.duration, label: 'Duração' },
        { icon: CalendarDays, value: f.due, label: 'Prazo' },
        { icon: Star, value: f.score, label: 'Melhor nota' },
      ]}
      progress={{ value: f.progress, label: 'Progresso' }}
      footer={footer}
    />
  );
}

// ─── Sessões disponíveis (design "inscrições") ──────────────────────────────

export interface SessionNavyCardProps {
  session: SessionListItem;
  selected?: boolean;
  onSelect: () => void;
}

export function SessionNavyCard({
  session: s,
  selected,
  onSelect,
}: SessionNavyCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onKeyDown={(ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          onSelect();
        }
      }}
      className={`rounded-panel outline-none focus-visible:ring-2 focus-visible:ring-accent ${selected ? 'ring-4 ring-accent ring-offset-2' : ''}`}
    >
      <NavyCard
        seed={s.id}
        kicker={s.program.title}
        kickerIcon={Bot}
        title={s.title}
        badge={
          <NavyBadge tone={PROGRAM_TONE[s.status]}>
            {PROGRAM_STATUS[s.status].label}
          </NavyBadge>
        }
        infos={[
          {
            icon: Layers,
            value: EXPERIENCE_LABEL[s.experienceType],
            label: 'Experiência',
          },
          { icon: GraduationCap, value: `v${s.version}`, label: 'Versão' },
        ]}
        onClick={onSelect}
      />
    </div>
  );
}

/** Sessões disponíveis em cartões; substitui o seletor nas abas de autoria. */
export function SessionCardPicker({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (id: number) => void;
}) {
  const { data, error, refetch } = useSessionList();
  if (error) return <QueryError error={error} onRetry={() => refetch()} />;
  if (!data)
    return (
      <Skeleton rows={2} itemClassName="h-40 rounded-panel bg-surface-sunken" />
    );
  if (data.length === 0)
    return (
      <p className="rounded-card border border-dashed border-border-strong bg-surface p-4 text-center font-body text-sm text-ink-faint">
        Ainda não existem sessões disponíveis.
      </p>
    );
  return (
    <section className="space-y-2" aria-label="Sessões disponíveis">
      <h2 className="font-display text-sm font-semibold text-ink">
        Sessões disponíveis <Badge dot={false}>{data.length}</Badge>
      </h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {data.map((s) => (
          <SessionNavyCard
            key={s.id}
            session={s}
            selected={s.id === value}
            onSelect={() => onChange(s.id)}
          />
        ))}
      </div>
    </section>
  );
}
