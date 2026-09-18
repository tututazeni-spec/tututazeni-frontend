// components/courses/AdminDashboardView.tsx
// Vista "Dashboard (Admin)" — cobre docs/06-modulo-courses.md secção
// "Dashboard Admin → Cursos". Extraído de app/(platform)/courses/page.tsx.

'use client';

import {
  BookOpen,
  Check,
  FileEdit,
  Pause,
  Archive,
  Layers,
  ListChecks,
  Users,
  Clock,
  Award,
  Star,
  TrendingUp,
  CheckCircle2,
  Timer,
  AlertTriangle,
  AlertCircle,
  Info,
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
import { KpiCard } from '@/components/ui/KpiCard';
import { Button } from '@/components/ui/Button';
import { Skeleton, fmtDuration } from './shared';
import type { AdminDashboard, TopLevelView } from './types';

interface AdminDashboardViewProps {
  onSelect: (id: number) => void;
  onNavigate: (view: TopLevelView) => void;
  onCreateCourse: () => void;
}

const ALERT_ICON = { warning: AlertTriangle, danger: AlertCircle, info: Info } as const;
const ALERT_CLASS = {
  warning: 'bg-warning-subtle text-warning-ink',
  danger: 'bg-danger-subtle text-danger-ink',
  info: 'bg-info-subtle text-info-ink',
} as const;

/** Lista de distribuição — barra horizontal proporcional ao máximo + contagem
 * sempre visível em texto (nunca só cor, ver skill dataviz "never color alone"). */
function DistributionList({
  title,
  items,
}: {
  title: string;
  items: Array<{ label: string; count: number }>;
}) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <Card className="p-4">
      <div className="text-xs font-medium text-ink-faint uppercase tracking-wide mb-3">
        {title}
      </div>
      {items.length === 0 ? (
        <p className="text-xs text-ink-faint">Sem dados</p>
      ) : (
        <div className="space-y-2">
          {items.slice(0, 6).map((item, i) => (
            <div key={i}>
              <div className="flex items-center justify-between text-xs mb-0.5">
                <span className="text-ink-muted truncate pr-2">{item.label}</span>
                <span className="font-data text-ink-faint flex-shrink-0">{item.count}</span>
              </div>
              <div className="h-1.5 rounded-full bg-surface-sunken overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${(item.count / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

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
      <div className="px-4 py-3 border-b border-border text-xs font-medium text-ink-faint uppercase tracking-wide">
        {title}
      </div>
      {items.length === 0 ? (
        <p className="p-4 text-xs text-ink-faint">Sem dados</p>
      ) : (
        items.map((c, idx) => (
          <div
            key={c.id}
            className="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-0 cursor-pointer hover:bg-surface-sunken"
            onClick={() => onSelect(c.id)}
          >
            <span className="text-sm font-bold font-mono text-ink-faint w-5 text-center">
              {idx + 1}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-ink truncate">{c.title}</div>
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
  { icon: Settings, label: 'Gerir cursos', action: (n) => n('gestao') },
  { icon: Layers, label: 'Gerir módulos e lições', action: (n) => n('gestao') },
  { icon: ClipboardCheck, label: 'Gerir inscrições', action: (n) => n('gestao') },
  { icon: Award, label: 'Gerir certificados', action: (n) => n('certificates') },
  { icon: FileBarChart, label: 'Consultar relatórios', action: (n) => n('gestao') },
];

export function AdminDashboardView({ onSelect, onNavigate, onCreateCourse }: AdminDashboardViewProps) {
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
          <Button
            key={s.label}
            intent="secondary"
            size="sm"
            onClick={() => s.action(onNavigate, onCreateCourse)}
          >
            <s.icon size={14} strokeWidth={1.75} />
            {s.label}
          </Button>
        ))}
      </div>

      {/* Alertas e pendências */}
      {data.alerts.length > 0 && (
        <div className="space-y-2">
          {data.alerts.map((a, i) => {
            const Icon = ALERT_ICON[a.severity];
            return (
              <div
                key={i}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-card text-xs font-medium ${ALERT_CLASS[a.severity]}`}
              >
                <Icon size={14} strokeWidth={1.75} />
                {a.message}
              </div>
            );
          })}
        </div>
      )}

      {/* KPIs principais */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard icon={BookOpen} label="Total de cursos" value={counts.total} intent="primary" className="w-full" />
        <KpiCard icon={Check} label="Publicados" value={counts.published} intent="success" className="w-full" />
        <KpiCard icon={FileEdit} label="Rascunhos" value={counts.draft} intent="info" className="w-full" />
        <KpiCard icon={Pause} label="Em pausa" value={counts.paused} intent="warning" className="w-full" />
        <KpiCard icon={Archive} label="Arquivados" value={counts.archived} intent="accent" className="w-full" />
        <KpiCard icon={Layers} label="Módulos" value={counts.totalModules} intent="primary" className="w-full" />
        <KpiCard icon={ListChecks} label="Lições" value={counts.totalLessons} intent="primary" className="w-full" />
        <KpiCard icon={Users} label="Inscritos" value={counts.totalEnrollments} intent="primary" className="w-full" />
        <KpiCard icon={Clock} label="Inscrições pendentes" value={counts.pendingEnrollments} intent={counts.pendingEnrollments > 0 ? 'warning' : 'primary'} className="w-full" />
        <KpiCard icon={Award} label="Certificados emitidos" value={counts.certificatesIssued} intent="success" className="w-full" />
        <KpiCard icon={BookOpen} label="Obrigatórios / opcionais" value={`${counts.mandatoryCourses}/${counts.optionalCourses}`} intent="primary" className="w-full" />
        <KpiCard icon={TrendingUp} label="Taxa de conclusão" value={`${rates.avgCompletionRate}%`} intent="success" className="w-full" />
        <KpiCard icon={CheckCircle2} label="Taxa de aprovação" value={`${rates.avgPassRate}%`} intent="success" className="w-full" />
        <KpiCard icon={Star} label="Nota média" value={rates.avgRating || '—'} intent="warning" className="w-full" />
        <KpiCard icon={Timer} label="Horas de aprendizagem" value={fmtDuration(rates.totalLearningHours)} intent="primary" className="w-full" />
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <CourseRankList
          title="Cursos mais populares"
          items={data.topCourses.map((c) => ({ id: c.id, title: c.title, value: c.enrollments }))}
          suffix=" matrículas"
          onSelect={onSelect}
        />
        <CourseRankList
          title="Maior taxa de conclusão"
          items={data.bestCompletion.map((c) => ({ id: c.id, title: c.title, value: c.rate }))}
          suffix="%"
          onSelect={onSelect}
        />
        <CourseRankList
          title="Menor taxa de conclusão / maior abandono"
          items={data.worstCompletion.map((c) => ({ id: c.id, title: c.title, value: c.rate }))}
          suffix="%"
          onSelect={onSelect}
        />
      </div>

      {/* Distribuições */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <DistributionList
          title="Por categoria"
          items={data.byCategory.map((c) => ({ label: c.category, count: c.count }))}
        />
        <DistributionList
          title="Por nível"
          items={data.byLevel.map((c) => ({ label: c.level, count: c.count }))}
        />
        <DistributionList
          title="Por unidade"
          items={data.byUnit.map((c) => ({ label: c.unit, count: c.count }))}
        />
        <DistributionList
          title="Por departamento"
          items={data.byDepartment.map((c) => ({ label: c.department, count: c.count }))}
        />
        <DistributionList
          title="Por instrutor"
          items={data.byInstructor.map((c) => ({ label: c.instructor, count: c.count }))}
        />
        <DistributionList
          title="Competências mais desenvolvidas"
          items={data.topCompetencies.map((c) => ({ label: c.name, count: c.count }))}
        />
      </div>

      {/* Próximas sessões ao vivo */}
      {data.upcomingLiveSessions.length > 0 && (
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border text-xs font-medium text-ink-faint uppercase tracking-wide flex items-center gap-2">
            <Radio size={14} strokeWidth={1.75} /> Próximas formações/sessões
          </div>
          {data.upcomingLiveSessions.map((s) => (
            <div key={s.id} className="flex items-center justify-between px-4 py-2.5 border-b border-border last:border-0">
              <div>
                <div className="text-xs font-medium text-ink">{s.title}</div>
                <div className="text-xs text-ink-faint">
                  {s.course.title}
                  {s.instructor ? ` · ${s.instructor}` : ''}
                </div>
              </div>
              <div className="text-xs text-ink-muted">
                {s.liveDate ? new Date(s.liveDate).toLocaleString('pt', { dateStyle: 'short', timeStyle: 'short' }) : '—'}
              </div>
            </div>
          ))}
        </Card>
      )}

      {/* Actividade recente */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border text-xs font-medium text-ink-faint uppercase tracking-wide">
            Últimas inscrições
          </div>
          {data.recentActivity.enrollments.length === 0 ? (
            <p className="p-4 text-xs text-ink-faint">Sem dados</p>
          ) : (
            data.recentActivity.enrollments.map((e) => (
              <div key={e.id} className="px-4 py-2 border-b border-border last:border-0 text-xs">
                <span className="font-medium text-ink">{e.user.fullName}</span>{' '}
                <span className="text-ink-faint">inscreveu-se em</span>{' '}
                <span className="text-ink-muted">{e.course.title}</span>
              </div>
            ))
          )}
        </Card>
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border text-xs font-medium text-ink-faint uppercase tracking-wide">
            Últimas conclusões
          </div>
          {data.recentActivity.completions.length === 0 ? (
            <p className="p-4 text-xs text-ink-faint">Sem dados</p>
          ) : (
            data.recentActivity.completions.map((e) => (
              <div key={e.id} className="px-4 py-2 border-b border-border last:border-0 text-xs">
                <span className="font-medium text-ink">{e.user.fullName}</span>{' '}
                <span className="text-ink-faint">concluiu</span>{' '}
                <span className="text-ink-muted">{e.course.title}</span>
              </div>
            ))
          )}
        </Card>
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border text-xs font-medium text-ink-faint uppercase tracking-wide">
            Últimas avaliações
          </div>
          {data.recentActivity.feedbacks.length === 0 ? (
            <p className="p-4 text-xs text-ink-faint">Sem dados</p>
          ) : (
            data.recentActivity.feedbacks.map((f) => (
              <div key={f.id} className="px-4 py-2 border-b border-border last:border-0 text-xs">
                <span className="font-medium text-ink">{f.user.fullName}</span>{' '}
                <span className="text-ink-faint">avaliou</span>{' '}
                <span className="text-ink-muted">{f.course.title}</span>{' '}
                <span className="text-warning-ink">({f.rating}★)</span>
              </div>
            ))
          )}
        </Card>
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border text-xs font-medium text-ink-faint uppercase tracking-wide">
            Últimos certificados emitidos
          </div>
          {data.recentActivity.certificates.length === 0 ? (
            <p className="p-4 text-xs text-ink-faint">Sem dados</p>
          ) : (
            data.recentActivity.certificates.map((c) => (
              <div key={c.id} className="px-4 py-2 border-b border-border last:border-0 text-xs">
                <span className="font-medium text-ink">{c.user?.fullName ?? '—'}</span>{' '}
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
          <div className="px-4 py-3 border-b border-border text-xs font-medium text-ink-faint uppercase tracking-wide">
            Recentemente criados
          </div>
          {data.recentlyCreated.map((c) => (
            <div
              key={c.id}
              className="px-4 py-2 border-b border-border last:border-0 text-xs text-ink-muted truncate cursor-pointer hover:bg-surface-sunken"
              onClick={() => onSelect(c.id)}
            >
              {c.title}
            </div>
          ))}
        </Card>
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border text-xs font-medium text-ink-faint uppercase tracking-wide">
            Recentemente actualizados
          </div>
          {data.recentlyUpdated.map((c) => (
            <div
              key={c.id}
              className="px-4 py-2 border-b border-border last:border-0 text-xs text-ink-muted truncate cursor-pointer hover:bg-surface-sunken"
              onClick={() => onSelect(c.id)}
            >
              {c.title}
            </div>
          ))}
        </Card>
        <Card className="overflow-hidden">
          <div className="px-4 py-3 border-b border-border text-xs font-medium text-ink-faint uppercase tracking-wide">
            Próximos do término
          </div>
          {data.endingSoon.length === 0 ? (
            <p className="p-4 text-xs text-ink-faint">Nenhum nos próximos 14 dias</p>
          ) : (
            data.endingSoon.map((c) => (
              <div
                key={c.id}
                className="px-4 py-2 border-b border-border last:border-0 text-xs text-ink-muted truncate cursor-pointer hover:bg-surface-sunken flex items-center justify-between gap-2"
                onClick={() => onSelect(c.id)}
              >
                <span className="truncate">{c.title}</span>
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
