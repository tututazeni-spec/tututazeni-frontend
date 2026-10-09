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
import { TopBarCard } from '@/components/ui/TopBarCard';
import { GaugeChart } from '@/components/ui/charts/GaugeChart';
import { Skeleton, fmtDuration } from './shared';
import type { AdminDashboard, TopLevelView } from './types';

interface AdminDashboardViewProps {
  onSelect: (id: number) => void;
  onNavigate: (view: TopLevelView) => void;
  onCreateCourse: () => void;
}

const ALERT_ICON = {
  warning: AlertTriangle,
  danger: AlertCircle,
  info: Info,
} as const;
const ALERT_CLASS = {
  warning: 'bg-warning-subtle text-black',
  danger: 'bg-danger-subtle text-black',
  info: 'bg-info-subtle text-black',
} as const;

/** Cores das barras, alinhadas com os tons dos cards (azul, verde, dourado, vermelho). */
const BAR_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-violet-500',
  'bg-cyan-500',
] as const;

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
    <Card className="overflow-hidden">
      <div className="px-4 py-3 bg-[#0F1F3D]/60 text-xs font-medium text-white uppercase tracking-wide">
        {title}
      </div>
      {items.length === 0 ? (
        <p className="p-4 text-xs text-ink-faint">Sem dados</p>
      ) : (
        <div className="space-y-2 p-4">
          {items.slice(0, 6).map((item, i) => (
            <div key={i} className="flex items-center gap-3">
  <span
    className="w-28 flex-shrink-0 truncate text-xs text-ink-muted"
    title={item.label}
  >
    {item.label}
  </span>
  <div className="flex flex-1 items-center gap-2">
    <div
      className={`h-2.5 rounded-md ${BAR_COLORS[i % BAR_COLORS.length]}`}
      style={{ width: `${(item.count / max) * 88}%` }}
    />
    <span className="flex-shrink-0 font-data text-xs text-ink">
      {item.count}
    </span>
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
      <div className="px-4 py-3 border-b border-border bg-[#0F1F3D]/60 text-xs font-medium text-white uppercase tracking-wide">
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
              <div className="text-xs font-medium text-ink truncate">
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

function CourseLollipopList({
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
        items.map((c) => {
          const pct = Math.min(100, Math.max(0, c.value));
          return (
            <div
              key={c.id}
              className="px-4 py-2.5 border-b border-border last:border-0 cursor-pointer hover:bg-surface-sunken"
              onClick={() => onSelect(c.id)}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-medium text-ink truncate">
                  {c.title}
                </span>
                <span className="text-xs font-data text-ink-muted flex-shrink-0">
                  {c.value}
                  {suffix}
                </span>
              </div>
              <div className="relative h-4">
                <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-border" />
                <div
                  className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-primary"
                  style={{ width: `${pct}%` }}
                />
                <div
                  className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-primary shadow-resting"
                  style={{ left: `${pct}%` }}
                />
              </div>
            </div>
          );
        })
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
  className="inline-flex h-11 items-center gap-2.5 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 active:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2"
>
  <s.icon size={16} strokeWidth={1.75} />
  {s.label}
</button>
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
                <TopBarCard
          label="Total de cursos"
          value={counts.total}
          tone="blue"
          icon={<BookOpen className="h-6 w-6" />}
        />
        <TopBarCard
          label="Publicados"
          value={counts.published}
          tone="green"
          icon={<Check className="h-6 w-6" />}
        />
        <TopBarCard
          label="Rascunhos"
          value={counts.draft}
          tone="gold"
          icon={<FileEdit className="h-6 w-6" />}
        />
        <TopBarCard
          label="Em pausa"
          value={counts.paused}
          tone="gold"
          icon={<Pause className="h-6 w-6" />}
        />
        <TopBarCard
          label="Arquivados"
          value={counts.archived}
          tone="red"
          icon={<Archive className="h-6 w-6" />}
        />
        <TopBarCard
          label="Módulos"
          value={counts.totalModules}
          tone="blue"
          icon={<Layers className="h-6 w-6" />}
        />
        <TopBarCard
          label="Lições"
          value={counts.totalLessons}
          tone="blue"
          icon={<ListChecks className="h-6 w-6" />}
        />
        <TopBarCard
          label="Inscritos"
          value={counts.totalEnrollments}
          tone="blue"
          icon={<Users className="h-6 w-6" />}
        />
        <TopBarCard
          label="Formandos"
          value={counts.totalLearners}
          tone="blue"
          icon={<Users className="h-6 w-6" />}
        />
        <TopBarCard
          label="Conclusões"
          value={counts.completions}
          tone="green"
          icon={<CheckCircle2 className="h-6 w-6" />}
        />
        <TopBarCard
          label="Inscrições pendentes"
          value={counts.pendingEnrollments}
          tone={counts.pendingEnrollments > 0 ? 'gold' : 'blue'}
          icon={<Clock className="h-6 w-6" />}
        />
        <TopBarCard
          label="Certificados emitidos"
          value={counts.certificatesIssued}
          tone="green"
          icon={<Award className="h-6 w-6" />}
        />
        <TopBarCard
          label="Obrigatórios / opcionais"
          value={`${counts.mandatoryCourses}/${counts.optionalCourses}`}
          tone="blue"
          icon={<BookOpen className="h-6 w-6" />}
        />
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-white p-4 shadow-resting transition-all duration-200 hover:scale-105 hover:shadow-md motion-reduce:hover:scale-100">
          <GaugeChart
            value={rates.avgCompletionRate}
            label="Taxa de Conclusão"
            thresholds={{ warning: 50, danger: 25 }}
            size={110}
          />
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-white p-4 shadow-resting transition-all duration-200 hover:scale-105 hover:shadow-md motion-reduce:hover:scale-100">
          <GaugeChart
            value={rates.avgPassRate}
            label="Taxa de Aprovação"
            thresholds={{ warning: 50, danger: 25 }}
            size={110}
          />
        </div>
        <TopBarCard
          label="Nota média"
          value={rates.avgRating || '—'}
          tone="gold"
          icon={<Star className="h-6 w-6" />}
        />
        <TopBarCard
          label="Horas de aprendizagem"
          value={fmtDuration(rates.totalLearningHours)}
          tone="blue"
          icon={<Timer className="h-6 w-6" />}
        />
      </div>

      {/* Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
        <CourseLollipopList
          title="Maior taxa de conclusão"
          items={data.bestCompletion.map((c) => ({
            id: c.id,
            title: c.title,
            value: c.rate,
          }))}
          suffix="%"
          onSelect={onSelect}
        />
        <CourseLollipopList
          title="Menor taxa de conclusão / maior abandono"
          items={data.worstCompletion.map((c) => ({
            id: c.id,
            title: c.title,
            value: c.rate,
          }))}
          suffix="%"
          onSelect={onSelect}
        />
      </div>

      {/* Distribuições */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <DistributionList
          title="Por categoria"
          items={data.byCategory.map((c) => ({
            label: c.category,
            count: c.count,
          }))}
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
          items={data.byDepartment.map((c) => ({
            label: c.department,
            count: c.count,
          }))}
        />
        <DistributionList
          title="Por instrutor"
          items={data.byInstructor.map((c) => ({
            label: c.instructor,
            count: c.count,
          }))}
        />
        <DistributionList
          title="Competências mais desenvolvidas"
          items={data.topCompetencies.map((c) => ({
            label: c.name,
            count: c.count,
          }))}
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
              className="px-4 py-2 border-b border-border last:border-0 text-xs text-ink-muted truncate cursor-pointer hover:bg-surface-sunken"
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
              className="px-4 py-2 border-b border-border last:border-0 text-xs text-ink-muted truncate cursor-pointer hover:bg-surface-sunken"
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
