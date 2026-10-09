// components/courses/AdminDashboardView.tsx
// Vista "Dashboard (Admin)" — cobre docs/06-modulo-courses.md secção
// "Dashboard Admin → Cursos". Extraído de app/(platform)/courses/page.tsx.

'use client';

import {
  BookOpen,
  CheckCircle,
  FileText,
  Pause,
  Trash2,
  GraduationCap,
  Layers,
  ListChecks,
  Users,
  Clock,
  Award,
  Star,
  TrendingUp,
  CheckCircle2,
  Timer,
  PlusCircle,
  Settings,
  ClipboardCheck,
  FileBarChart,
  Radio,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card } from '@/components/ui/Card';
import { AlertCard } from '@/components/ui/AlertCard';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
import { rateTone } from '@/components/dashboard-rh/rateTone';
import { Skeleton, fmtDuration } from './shared';
import type { AdminDashboard, TopLevelView } from './types';

interface AdminDashboardViewProps {
  onSelect: (id: number) => void;
  onNavigate: (view: TopLevelView) => void;
  onCreateCourse: () => void;
}

const ALERT_TITLE = {
  warning: 'Atenção',
  danger: 'Urgente',
  info: 'Informação',
} as const;

function CourseRankList({
  title,
  items,
  suffix,
  onSelect,
}: {
  title: string;
  items: Array<{ id: number; title: string; value: number }>;
  suffix: string;
  onSelect: (id: number) => void;
}) {
  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-[#0F1F3D]/60 text-xs font-medium text-white uppercase tracking-wide">
        {title}
      </div>
      {items.length === 0 ? (
        <p className="p-4 text-xs text-ink-faint">Sem dados</p>
      ) : (
        items.map((c, idx) => (
          <div
            key={c.id}
            className="flex items-start gap-3 px-4 py-2.5 border-b border-border last:border-0 cursor-pointer hover:bg-surface-sunken"
            onClick={() => onSelect(c.id)}
          >
            <span className="text-sm font-bold font-mono text-ink-faint w-5 text-center">
              {idx + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="break-words text-xs font-medium text-ink">
                {c.title}
              </div>
            </div>
            <div className="text-xs text-ink-muted flex-shrink-0">
              {c.value}
              {suffix}
            </div>
          </div>
        ))
      )}
    </Card>
  );
}

const SHORTCUTS: Array<{
  icon: typeof PlusCircle;
  label: string;
  action: (nav: (v: TopLevelView) => void, create: () => void) => void;
}> = [
  { icon: PlusCircle, label: 'Criar curso', action: (_n, create) => create() },
  { icon: Settings, label: 'Gerir cursos', action: (n) => n('catalog') },
  {
    icon: Layers,
    label: 'Gerir módulos e lições',
    action: (n) => n('catalog'),
  },
  {
    icon: ClipboardCheck,
    label: 'Gerir inscrições',
    action: (n) => n('inscricoes'),
  },
  {
    icon: Award,
    label: 'Gerir certificados',
    action: (n) => n('certificates'),
  },
  { icon: FileBarChart, label: 'Ver progresso', action: (n) => n('progresso') },
];

export function AdminDashboardView({
  onSelect,
  onNavigate,
  onCreateCourse,
}: AdminDashboardViewProps) {
  const { data, isLoading } = useApiQuery<AdminDashboard>(
    queryKeys.courses.adminDashboard(),
    '/courses/admin/dashboard',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading || !data) return <Skeleton rows={3} />;

  const { counts, rates } = data;

  return (
    <div className="space-y-6">
      {/* Atalhos */}
      <div className="flex flex-wrap gap-2">
        {SHORTCUTS.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => s.action(onNavigate, onCreateCourse)}
            className="inline-flex min-h-11 items-center gap-2.5 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 active:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
          >
            <s.icon size={16} strokeWidth={1.75} />
            {s.label}
          </button>
        ))}
      </div>

      {/* Alertas e pendências */}
      {data.alerts.length > 0 && (
        <div className="grid grid-cols-1 items-start gap-2 md:grid-cols-2">
          {data.alerts.map((a, i) => (
            <AlertCard
              key={i}
              variant={a.severity}
              compact
              title={ALERT_TITLE[a.severity]}
              message={a.message}
            />
          ))}
        </div>
      )}

      {/* KPIs principais */}
      <div className="grid grid-cols-1 min-[420px]:grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <NavyStatCard
          label="Total de cursos"
          value={counts.total}
          tone="blue"
          icon={BookOpen}
        />
        <NavyStatCard
          label="Publicados"
          value={counts.published}
          tone="green"
          icon={CheckCircle}
        />
        <NavyStatCard
          label="Rascunhos"
          value={counts.draft}
          tone="orange"
          icon={FileText}
        />
        <NavyStatCard
          label="Em pausa"
          value={counts.paused}
          tone="orange"
          icon={Pause}
        />
        <NavyStatCard
          label="Arquivados"
          value={counts.archived}
          tone="red"
          icon={Trash2}
        />
        <NavyStatCard
          label="Módulos"
          value={counts.totalModules}
          tone="blue"
          icon={Layers}
        />
        <NavyStatCard
          label="Lições"
          value={counts.totalLessons}
          tone="blue"
          icon={ListChecks}
        />
        <NavyStatCard
          label="Inscritos"
          value={counts.totalEnrollments}
          tone="blue"
          icon={Users}
        />
        <NavyStatCard
          label="Formandos"
          value={counts.totalLearners}
          tone="blue"
          icon={GraduationCap}
        />
        <NavyStatCard
          label="Conclusões"
          value={counts.completions}
          tone="green"
          icon={CheckCircle2}
        />
        <NavyStatCard
          label="Inscrições pendentes"
          value={counts.pendingEnrollments}
          tone={counts.pendingEnrollments > 0 ? 'orange' : 'blue'}
          icon={Clock}
        />
        <NavyStatCard
          label="Certificados emitidos"
          value={counts.certificatesIssued}
          tone="green"
          icon={Award}
        />
        <NavyStatCard
          label="Obrigatórios / opcionais"
          value={`${counts.mandatoryCourses}/${counts.optionalCourses}`}
          tone="blue"
          icon={BookOpen}
        />
        <NavyStatCard
          label="Taxa de Conclusão"
          value={`${rates.avgCompletionRate}%`}
          tone={rateTone(rates.avgCompletionRate, { warning: 50, danger: 25 })}
          icon={TrendingUp}
        />
        <NavyStatCard
          label="Taxa de Aprovação"
          value={`${rates.avgPassRate}%`}
          tone={rateTone(rates.avgPassRate, { warning: 50, danger: 25 })}
          icon={CheckCircle2}
        />
        <NavyStatCard
          label="Nota média"
          value={rates.avgRating || '—'}
          tone="orange"
          icon={Star}
        />
        <NavyStatCard
          label="Horas de aprendizagem"
          value={fmtDuration(rates.totalLearningHours)}
          tone="blue"
          icon={Timer}
        />
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-1 gap-4">
        <CourseRankList
          title="Cursos mais populares"
          items={data.topCourses.map((c) => ({
            id: c.id,
            title: c.title,
            value: c.enrollments,
          }))}
          suffix=" matrículas"
          onSelect={onSelect}
        />
      </div>

      {/* Próximas sessões ao vivo */}
      {data.upcomingLiveSessions.length > 0 && (
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border text-xs font-medium text-ink-faint uppercase tracking-wide flex items-center gap-2">
            <Radio size={14} strokeWidth={1.75} /> Próximas formações/sessões
          </div>
          {data.upcomingLiveSessions.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between px-4 py-2.5 border-b border-border last:border-0"
            >
              <div>
                <div className="text-xs font-medium text-ink">{s.title}</div>
                <div className="text-xs text-ink-faint">
                  {s.course.title}
                  {s.instructor ? ` · ${s.instructor}` : ''}
                </div>
              </div>
              <div className="text-xs text-ink-muted">
                {s.liveDate
                  ? new Date(s.liveDate).toLocaleString('pt', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })
                  : '—'}
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Actividade recente */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-[#0F1F3D]/60 text-xs font-medium text-white uppercase tracking-wide">
            Últimas inscrições
          </div>
          {data.recentActivity.enrollments.length === 0 ? (
            <p className="p-4 text-xs text-ink-faint">Sem dados</p>
          ) : (
            data.recentActivity.enrollments.map((e) => (
              <div
                key={e.id}
                className="px-4 py-2 border-b border-border last:border-0 text-xs"
              >
                <span className="font-medium text-ink">{e.user.fullName}</span>{' '}
                <span className="text-ink-faint">inscreveu-se em</span>{' '}
                <span className="text-ink-muted">{e.course.title}</span>
              </div>
            ))
          )}
        </Card>
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-[#0F1F3D]/60 text-xs font-medium text-white uppercase tracking-wide">
            Últimas conclusões
          </div>
          {data.recentActivity.completions.length === 0 ? (
            <p className="p-4 text-xs text-ink-faint">Sem dados</p>
          ) : (
            data.recentActivity.completions.map((e) => (
              <div
                key={e.id}
                className="px-4 py-2 border-b border-border last:border-0 text-xs"
              >
                <span className="font-medium text-ink">{e.user.fullName}</span>{' '}
                <span className="text-ink-faint">concluiu</span>{' '}
                <span className="text-ink-muted">{e.course.title}</span>
              </div>
            ))
          )}
        </Card>
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-[#0F1F3D]/60 text-xs font-medium text-white uppercase tracking-wide">
            Últimas avaliações
          </div>
          {data.recentActivity.feedbacks.length === 0 ? (
            <p className="p-4 text-xs text-ink-faint">Sem dados</p>
          ) : (
            data.recentActivity.feedbacks.map((f) => (
              <div
                key={f.id}
                className="px-4 py-2 border-b border-border last:border-0 text-xs"
              >
                <span className="font-medium text-ink">{f.user.fullName}</span>{' '}
                <span className="text-ink-faint">avaliou</span>{' '}
                <span className="text-ink-muted">{f.course.title}</span>{' '}
                <span className="text-warning-ink">({f.rating}★)</span>
              </div>
            ))
          )}
        </Card>
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-[#0F1F3D]/60 text-xs font-medium text-white uppercase tracking-wide">
            Últimos certificados emitidos
          </div>
          {data.recentActivity.certificates.length === 0 ? (
            <p className="p-4 text-xs text-ink-faint">Sem dados</p>
          ) : (
            data.recentActivity.certificates.map((c) => (
              <div
                key={c.id}
                className="px-4 py-2 border-b border-border last:border-0 text-xs"
              >
                <span className="font-medium text-ink">
                  {c.user?.fullName ?? '—'}
                </span>{' '}
                <span className="text-ink-faint">certificado em</span>{' '}
                <span className="text-ink-muted">{c.course?.title ?? '—'}</span>
              </div>
            ))
          )}
        </Card>
      </div>

      {/* Recentemente criados/actualizados, próximos do término */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-[#0F1F3D]/60 text-xs font-medium text-white uppercase tracking-wide">
            Recentemente criados
          </div>
          {data.recentlyCreated.map((c) => (
            <div
              key={c.id}
              className="px-4 py-2 border-b border-border last:border-0 text-xs text-ink-muted break-words cursor-pointer hover:bg-surface-sunken"
              onClick={() => onSelect(c.id)}
            >
              {c.title}
            </div>
          ))}
        </Card>
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-[#0F1F3D]/60 text-xs font-medium text-white uppercase tracking-wide">
            Recentemente actualizados
          </div>
          {data.recentlyUpdated.map((c) => (
            <div
              key={c.id}
              className="px-4 py-2 border-b border-border last:border-0 text-xs text-ink-muted break-words cursor-pointer hover:bg-surface-sunken"
              onClick={() => onSelect(c.id)}
            >
              {c.title}
            </div>
          ))}
        </Card>
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-[#0F1F3D]/60 text-xs font-medium text-white uppercase tracking-wide">
            Próximos do término
          </div>
          {data.endingSoon.length === 0 ? (
            <p className="p-4 text-xs text-ink-faint">
              Nenhum nos próximos 14 dias
            </p>
          ) : (
            data.endingSoon.map((c) => (
              <div
                key={c.id}
                className="px-4 py-2 border-b border-border last:border-0 text-xs text-ink-muted break-words cursor-pointer hover:bg-surface-sunken flex items-start justify-between gap-2"
                onClick={() => onSelect(c.id)}
              >
                <span className="min-w-0 break-words">{c.title}</span>
                <span className="text-ink-faint flex-shrink-0">
                  {new Date(c.endDate).toLocaleDateString('pt')}
                </span>
              </div>
            ))
          )}
        </Card>
      </div>
    </div>
  );
}
