// components/ai-tutor/OverviewView.tsx
// Vista "Visão Geral" (docs/ai-tutor.md secção 1). Para ADMIN/RH mostra
// estatísticas da plataforma; para os restantes, uma versão pessoal das
// mesmas métricas (endpoint /ai-tutor/overview é role-adaptive no backend).

'use client';

import {
  MessageCircle,
  Users,
  GraduationCap,
  CheckCircle2,
  Clock,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Card } from '@/components/ui/Card';
import { NavyStatCard } from '@/components/ui/NavyStatCard';
import { Skeleton } from '@/components/ui/Skeleton';
import type { AiTutorOverview } from './types';

const PRIVILEGED_ROLES = new Set(['ADMIN', 'RH']);

export function OverviewView() {
  const role = useCurrentRole();
  const isPrivileged = !!role && PRIVILEGED_ROLES.has(role);

  const { data, isLoading: loading } = useApiQuery<AiTutorOverview>(
    queryKeys.aiTutor.overview(),
    '/ai-tutor/overview',
    { staleTime: STALE_TIME.DYNAMIC },
  );

  if (loading)
    return (
      <Skeleton
        rows={4}
        wrapperClassName="grid grid-cols-2 gap-4 md:grid-cols-4"
        itemClassName="skeleton-shimmer h-[155px] rounded-2xl"
      />
    );
  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <NavyStatCard
          tone="blue"
          icon={MessageCircle}
          label="Conversas hoje"
          value={data.conversasHoje}
        />
        {isPrivileged && (
          <NavyStatCard
            tone="blue"
            icon={Users}
            label="Utilizadores activos"
            value={data.utilizadoresAtivos ?? 0}
          />
        )}
        <NavyStatCard
          tone="blue"
          icon={Sparkles}
          label="Sessões de aprendizagem"
          value={data.sessoesAprendizagem}
        />
        <NavyStatCard
          tone="blue"
          icon={MessageCircle}
          label="Perguntas respondidas"
          value={data.perguntasRespondidas}
        />
        {isPrivileged && (
          <NavyStatCard
            tone="green"
            icon={GraduationCap}
            label="Cursos apoiados"
            value={data.cursosApoiados ?? 0}
          />
        )}
        <NavyStatCard
          tone="green"
          icon={CheckCircle2}
          label="Taxa de conclusão"
          value={`${data.taxaConclusao}%`}
        />
        <NavyStatCard
          tone="orange"
          icon={Clock}
          label="Horas de aprendizagem com IA"
          value={`${data.horasAprendizagem}h`}
        />
      </div>

      {isPrivileged && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="overflow-hidden">
            <div className="px-4 py-3 bg-[#0F1F3D]/60 font-body text-xs font-medium text-white uppercase tracking-wide">
              Perguntas mais frequentes
            </div>
            {(data.perguntasFrequentes ?? []).length === 0 ? (
              <div className="px-4 py-4 font-body text-sm text-ink-faint">
                Ainda sem perguntas repetidas registadas.
              </div>
            ) : (
              data.perguntasFrequentes!.map((q, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border last:border-0"
                >
                  <span className="font-body text-sm text-ink truncate">
                    {q.question}
                  </span>
                  <span className="font-body text-xs text-ink-faint flex-shrink-0">
                    {q.count}×
                  </span>
                </div>
              ))
            )}
          </Card>

          <Card className="overflow-hidden">
            <div className="px-4 py-3 bg-[#0F1F3D]/60 font-body text-xs font-medium text-white uppercase tracking-wide">
              Cursos mais utilizados
            </div>
            {(data.cursosMaisUtilizados ?? []).length === 0 ? (
              <div className="px-4 py-4 font-body text-sm text-ink-faint">
                Sem sessões associadas a cursos ainda.
              </div>
            ) : (
              data.cursosMaisUtilizados!.map((c, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-2.5 border-b border-border last:border-0"
                >
                  <BookOpen
                    size={14}
                    strokeWidth={1.75}
                    className="text-primary flex-shrink-0"
                  />
                  <span className="font-body text-sm text-ink flex-1 truncate">
                    {c.title}
                  </span>
                  <span className="font-body text-xs text-ink-faint flex-shrink-0">
                    {c.count} sessões
                  </span>
                </div>
              ))
            )}
          </Card>

          <Card className="overflow-hidden">
            <div className="px-4 py-3 bg-[#0F1F3D]/60 font-body text-xs font-medium text-white uppercase tracking-wide">
              Temas com maior procura
            </div>
            {(data.temasMaisProcurados ?? []).length === 0 ? (
              <div className="px-4 py-4 font-body text-sm text-ink-faint">
                Sem dados de categoria suficientes ainda.
              </div>
            ) : (
              data.temasMaisProcurados!.map((t, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border last:border-0"
                >
                  <span className="font-body text-sm text-ink">{t.theme}</span>
                  <span className="font-body text-xs text-ink-faint flex-shrink-0">
                    {t.count}
                  </span>
                </div>
              ))
            )}
          </Card>

          <Card className="overflow-hidden">
            <div className="px-4 py-3 bg-[#0F1F3D]/60 font-body text-xs font-medium text-white uppercase tracking-wide">
              Utilizadores mais activos
            </div>
            {(data.utilizadoresMaisAtivos ?? []).length === 0 ? (
              <div className="px-4 py-4 font-body text-sm text-ink-faint">
                Ainda sem utilizadores destacados.
              </div>
            ) : (
              data.utilizadoresMaisAtivos!.map((u) => (
                <div
                  key={u.userId}
                  className="flex items-center justify-between gap-3 px-4 py-2.5 border-b border-border last:border-0"
                >
                  <span className="font-body text-sm text-ink truncate">
                    {u.fullName}
                  </span>
                  <span className="font-body text-xs text-ink-faint flex-shrink-0">
                    {u.count} perguntas
                  </span>
                </div>
              ))
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
