// components/analytics/OverviewView.tsx
// Separador "Visão geral" — KPIs organizacionais. Dados próprios +
// apresentação. Extraído de app/(platform)/analytics/page.tsx.
// Migrado para a fundação de design: os 4 KPIs principais passam a
// components/ui/KpiCard (icon+intent); os pares agrupados (Cursos/
// Matrículas/Gamificação) usam o padrão de "tile" plano já estabelecido
// em components/micro-learning/DashboardView.tsx, mais leve do que
// aninhar KpiCard dentro de Card.

'use client';

import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import {
  Award,
  BookOpen,
  FileBadge,
  Users,
  CheckCircle2,
  ClipboardList,
  TrendingUp,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import type { OrgOverview } from './types';

type Tone = 'blue' | 'green' | 'gold';

interface ToneStyle {
  header: string;
  title: string;
  iconBg: string;
  iconText: string;
  track: string;
  fill: string;
  number: string;
}

const TONES: { [K in Tone]: ToneStyle } = {
  blue: {
    header: 'bg-[#2B6CC4]',
    title: 'text-white/80',
    iconBg: 'bg-[#BCD0EC]',
    iconText: 'text-[#2B6CC4]',
    track: 'bg-[#C9D9F0]',
    fill: 'bg-[#2B6CC4]',
    number: 'text-[#2B6CC4]',
  },
  green: {
    header: 'bg-[#2E8B3E]',
    title: 'text-white/80',
    iconBg: 'bg-[#B5DBB8]',
    iconText: 'text-[#2E8B3E]',
    track: 'bg-[#C8E4CA]',
    fill: 'bg-[#2E8B3E]',
    number: 'text-[#2E7D32]',
  },
  gold: {
    header: 'bg-[#C9A227]',
    title: 'text-white/80',
    iconBg: 'bg-[#F0E0AE]',
    iconText: 'text-[#B8912A]',
    track: 'bg-[#EADFB8]',
    fill: 'bg-[#B8912A]',
    number: 'text-[#B8912A]',
  },
};

function Tile({
  label,
  value,
  tone,
}: {
  label: string;
  value: string | number;
  tone: Tone;
}) {
  return (
    <div className="rounded-2xl border border-border bg-white p-4 shadow-resting">
      <div className="mb-2 font-body text-sm text-black">{label}</div>
      <div className={`font-data text-4xl font-bold ${TONES[tone].number}`}>
        {value}
      </div>
    </div>
  );
}

type KpiTone = 'blue' | 'green' | 'gold' | 'red';

const KPI_TONES: { [K in KpiTone]: { bar: string; text: string } } = {
  blue: { bar: 'bg-[#2B6CC4]', text: 'text-[#2B6CC4]' },
  green: { bar: 'bg-[#2E8B3E]', text: 'text-[#2E8B3E]' },
  gold: { bar: 'bg-[#C9A227]', text: 'text-[#B8912A]' },
  red: { bar: 'bg-[#C0453F]', text: 'text-[#C0453F]' },
};

function TopBarCard({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string | number;
  tone: KpiTone;
  icon: React.ReactNode;
}) {
  const t = KPI_TONES[tone];
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-resting">
      <div className={`h-1.5 w-full ${t.bar}`} />
      <div className="p-5 pt-6">
        <div className={t.text}>{icon}</div>
        <div className={`mt-4 font-data text-4xl font-bold ${t.text}`}>
          {value}
        </div>
        <div className="mt-1 font-body text-sm text-black">{label}</div>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  tone,
  icon,
  caption,
  progress = 0,
  children,
}: {
  title: string;
  tone: Tone;
  icon: React.ReactNode;
  caption: string | number;
  progress?: number;
  children: React.ReactNode;
}) {
  const t = TONES[tone];
  const width = Math.max(8, Math.min(100, progress));

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-resting">
        <div
          className={`px-4 py-2.5 font-body text-base font-semibold uppercase tracking-wide ${t.header} ${t.title}`}
        >
          {title}
        </div>
        <div className="p-4">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-full ${t.iconBg} ${t.iconText}`}
          >
            {icon}
          </div>
          <div className="mt-2 font-body text-sm text-black">{caption}</div>
          <div
            className={`mt-1 h-1.5 w-full overflow-hidden rounded-full ${t.track}`}
          >
            <div
              className={`h-full rounded-full ${t.fill}`}
              style={{ width: `${width}%` }}
            />
          </div>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

export function OverviewView() {
  const { data, isLoading } = useApiQuery<OrgOverview>(
    queryKeys.analyticsPage.overview(),
    '/analytics/overview',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  if (isLoading || !data) return <Skeleton rows={4} />;

  return (
    <div className="space-y-8">
      {/* KPIs principais */}
      <div className="mt-6 grid grid-cols-4 gap-4">
        <TopBarCard
          label="Colaboradores activos"
          value={data.users.active}
          tone="blue"
          icon={<Users className="h-6 w-6" />}
        />
        <TopBarCard
          label="Taxa de conclusão"
          value={`${data.enrollments.completionRate}%`}
          tone="green"
          icon={<CheckCircle2 className="h-6 w-6" />}
        />
        <TopBarCard
          label="Adopção de PDI"
          value={`${data.pdi.adoptionRate}%`}
          tone="gold"
          icon={<ClipboardList className="h-6 w-6" />}
        />
        <TopBarCard
          label="Performance média"
          value={data.performance.avgScore}
          tone="red"
          icon={<TrendingUp className="h-6 w-6" />}
        />
      </div>

      {/* Segunda linha */}
      <div className="grid grid-cols-3 gap-4">
        <SummaryCard
          title="Cursos"
          tone="blue"
          icon={<BookOpen className="h-6 w-6" />}
          caption="Total"
          progress={
            data.courses.total > 0
              ? (data.courses.published / data.courses.total) * 100
              : 0
          }
        >
          <Tile label="Total" value={data.courses.total} tone="blue" />
          <Tile label="Publicados" value={data.courses.published} tone="blue" />
        </SummaryCard>

        <SummaryCard
          title="Matrículas"
          tone="green"
          icon={<FileBadge className="h-6 w-6" />}
          caption={`${data.enrollments.completionRate}%`}
          progress={data.enrollments.completionRate}
        >
          <Tile
            label="Concluídas"
            value={data.enrollments.completed}
            tone="green"
          />
          <Tile
            label="Adoção de PDI"
            value={data.pdi.adoptionRate}
            tone="green"
          />
        </SummaryCard>

        <SummaryCard
          title="Gamificação"
          tone="gold"
          icon={<Award className="h-6 w-6" />}
          caption={data.engagement.totalBadges}
          progress={0}
        >
          <Tile
            label="Pontos de Experiência total"
            value={data.engagement.totalXp}
            tone="gold"
          />
          <Tile
            label="Distintivos"
            value={data.engagement.totalBadges}
            tone="gold"
          />
        </SummaryCard>
      </div>
    </div>
  );
}
