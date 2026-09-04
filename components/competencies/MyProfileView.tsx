// components/competencies/MyProfileView.tsx
// Separador "O meu perfil" — perfil por categoria, análise de gap por
// cargo alvo e histórico de evolução. Dados próprios + apresentação.
// Extraído de app/(platform)/competencies/page.tsx. Migrado para a
// fundação de design: sub-navegação por separador passa a Tabs
// (Radix), inputs passam a Input, botões passam a Button, badges
// ad-hoc passam a Badge, resumo numérico passa a KpiCard, skeleton
// local passa a components/ui/Skeleton, histórico de evolução passa a
// Table. A barra de nível (antes `LevelBar` em atoms.tsx, recolorida
// por nível) passa a ProgressBar mono (bg-accent) + texto adjacente
// colorido por `levelTextClass` — mesmo padrão de
// components/engagement/AnalyticsTab.tsx. `StarRating` (átomo local,
// não existe equivalente na fundação) fica como sub-componente próprio
// deste ficheiro, com as cores mapeadas para tokens.

'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useToast } from '@/providers/ToastProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { KpiCard } from '@/components/ui/KpiCard';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Skeleton } from '@/components/ui/Skeleton';
import { StatusBadge } from '@/components/ui/StatusBadge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/Table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { CATEGORY_CFG, LEVEL_LABELS } from './constants';
import { levelTextClass } from './utils';
import type {
  CompetencyCategory,
  CompetencyEvolutionEntry,
  GapAnalysis,
  UserCompetency,
} from './types';

interface LevelBarProps {
  current: number;
  target?: number | null;
  max?: number;
}

function LevelBar({ current, target, max = 5 }: LevelBarProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative flex-1">
        <ProgressBar value={(current / max) * 100} />
        {target && target > current && (
          <div
            className="absolute bottom-0 top-0 w-0.5 bg-ink-faint"
            style={{ left: `${(target / max) * 100}%` }}
          />
        )}
      </div>
      <span
        className={`flex-shrink-0 font-data text-xs ${levelTextClass(current)}`}
      >
        {current}/{max}
      </span>
    </div>
  );
}

interface StarRatingProps {
  value: number;
  max?: number;
  onChange?: (v: number) => void;
}

function StarRating({ value, max = 5, onChange }: StarRatingProps) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: max }, (_, i) => i + 1).map((s) => (
        <button
          key={s}
          onClick={() => onChange?.(s)}
          className={`text-xl transition-transform hover:scale-110 ${s <= value ? 'text-accent' : 'text-border-strong'} ${onChange ? 'cursor-pointer' : 'cursor-default'}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export function MyProfileView() {
  const notify = useToast();
  const [tab, setTab] = useState<'profile' | 'gap' | 'evolution'>('profile');
  const [positionId, setPositionId] = useState('');
  const [selfAssessing, setSelfAssessing] = useState<number | null>(null);
  const [selfLevel, setSelfLevel] = useState(1);

  const profileQ = useApiQuery<UserCompetency[]>(
    queryKeys.competencies.myProfile(),
    '/competencies/my/profile',
    { staleTime: STALE_TIME.DYNAMIC },
  );
  const evolutionQ = useApiQuery<CompetencyEvolutionEntry[]>(
    queryKeys.competencies.myEvolution(),
    '/competencies/my/evolution',
    { staleTime: STALE_TIME.SEMI_STATIC },
  );
  const competencies = profileQ.data ?? [];
  const evolution = evolutionQ.data ?? [];
  const loading = profileQ.isLoading;

  const gapMutation = useApiMutation(
    (posId: string) =>
      apiClient.get<GapAnalysis>(`/competencies/my/gap/${posId}`),
    { onError: (e) => notify({ title: e.message, intent: 'danger' }) },
  );
  const gap = gapMutation.data ?? null;
  const loadingGap = gapMutation.isPending;
  const loadGap = () => {
    if (positionId) gapMutation.mutate(positionId);
  };

  const selfAssessMutation = useApiMutation(
    (competencyId: number) =>
      apiClient.post('/competencies/my/self-assess', {
        competencyId,
        selfLevel,
      }),
    {
      onSuccess: () => {
        profileQ.refetch();
        setSelfAssessing(null);
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );
  const savingAssess = selfAssessMutation.isPending;
  const handleSelfAssess = (competencyId: number) =>
    selfAssessMutation.mutate(competencyId);

  if (loading) return <Skeleton />;

  // Agrupar por categoria
  const byCategory = competencies.reduce<Record<string, UserCompetency[]>>(
    (acc, uc) => {
      const cat = uc.competency.category;
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(uc);
      return acc;
    },
    {},
  );

  return (
    <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
      <TabsList>
        <TabsTrigger value="profile">O meu perfil</TabsTrigger>
        <TabsTrigger value="gap">Análise de lacunas</TabsTrigger>
        <TabsTrigger value="evolution">Evolução</TabsTrigger>
      </TabsList>

      {/* Profile tab */}
      <TabsContent value="profile">
        <div className="space-y-5">
          {/* Summary cards */}
          <div className="grid grid-cols-4 gap-3">
            <KpiCard
              label="Competências"
              value={competencies.length}
              intent="primary"
            />
            <KpiCard
              label="Com lacunas"
              value={competencies.filter((c) => (c.gap ?? 0) > 0).length}
              intent="warning"
            />
            <KpiCard
              label="Divergências"
              value={
                competencies.filter((c) => (c.divergence ?? 0) >= 2).length
              }
              intent="danger"
            />
            <KpiCard
              label="Nível médio"
              value={
                competencies.length > 0
                  ? (
                      competencies.reduce((s, c) => s + c.currentLevel, 0) /
                      competencies.length
                    ).toFixed(1)
                  : '—'
              }
              intent="primary"
            />
          </div>

          {/* Per category */}
          {Object.entries(byCategory).map(([cat, items]) => (
            <div key={cat}>
              <div className="mb-3 flex items-center gap-2">
                <StatusBadge
                  value={cat as CompetencyCategory}
                  map={CATEGORY_CFG}
                />
                <span className="font-body text-xs text-ink-faint">
                  {items.length} competências
                </span>
              </div>
              <div className="space-y-2">
                {items.map((uc) => (
                  <div
                    key={uc.id}
                    className="rounded-card border border-border bg-surface p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="font-body text-sm font-medium text-ink">
                            {uc.competency.name}
                          </span>
                          {(uc.divergence ?? 0) >= 2 && (
                            <Badge intent="danger">
                              <AlertTriangle size={11} strokeWidth={1.75} />{' '}
                              Divergência ({uc.selfLevel} vs {uc.managerLevel})
                            </Badge>
                          )}
                          {(uc.gap ?? 0) > 0 && (
                            <Badge intent="warning">Gap: {uc.gap}</Badge>
                          )}
                        </div>
                        <LevelBar
                          current={uc.currentLevel}
                          target={uc.targetLevel}
                        />
                        <div className="mt-1.5 flex items-center gap-4 font-body text-xs text-ink-faint">
                          <span>
                            Actual:{' '}
                            <strong className="text-ink-muted">
                              {LEVEL_LABELS[uc.currentLevel]}
                            </strong>
                          </span>
                          {uc.targetLevel && (
                            <span>
                              Alvo:{' '}
                              <strong className="text-ink-muted">
                                {LEVEL_LABELS[uc.targetLevel]}
                              </strong>
                            </span>
                          )}
                          {uc.selfLevel !== null && (
                            <span>Auto: {uc.selfLevel}</span>
                          )}
                          {uc.managerLevel !== null && (
                            <span>Gestor: {uc.managerLevel}</span>
                          )}
                          <span>{fmtDate(uc.evaluatedAt)}</span>
                        </div>
                      </div>

                      <div className="flex-shrink-0">
                        {selfAssessing === uc.competencyId ? (
                          <div className="flex flex-col items-end gap-2">
                            <StarRating
                              value={selfLevel}
                              onChange={setSelfLevel}
                            />
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleSelfAssess(uc.competencyId)
                                }
                                loading={savingAssess}
                              >
                                Guardar
                              </Button>
                              <Button
                                size="sm"
                                intent="ghost"
                                onClick={() => setSelfAssessing(null)}
                              >
                                Cancelar
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setSelfAssessing(uc.competencyId);
                              setSelfLevel(uc.currentLevel);
                            }}
                            className="font-body text-xs text-primary hover:underline"
                          >
                            Autoavaliar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {competencies.length === 0 && (
            <div className="rounded-card border border-dashed border-border-strong py-12 text-center font-body text-sm text-ink-faint">
              Sem competências registadas. O RH ou gestor pode atribuí-las.
            </div>
          )}
        </div>
      </TabsContent>

      {/* Gap tab */}
      <TabsContent value="gap">
        <div>
          <div className="mb-5 flex items-center gap-3">
            <Input
              type="number"
              placeholder="ID do cargo alvo"
              value={positionId}
              onChange={(e) => setPositionId(e.target.value)}
              className="max-w-xs"
            />
            <Button
              onClick={loadGap}
              disabled={!positionId}
              loading={loadingGap}
            >
              Analisar lacuna
            </Button>
          </div>

          {gap && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-card bg-success-subtle p-4 text-center">
                  <div className="text-3xl font-bold text-success-ink">
                    {gap.readinessPercent}%
                  </div>
                  <div className="mt-1 font-body text-xs text-success-ink">
                    Preparação
                  </div>
                </div>
                <div className="rounded-card bg-danger-subtle p-4 text-center">
                  <div className="text-3xl font-bold text-danger-ink">
                    {gap.mandatoryGaps}
                  </div>
                  <div className="mt-1 font-body text-xs text-danger-ink">
                    Lacunas obrigatórios
                  </div>
                </div>
                <div className="rounded-card bg-warning-subtle p-4 text-center">
                  <div className="text-3xl font-bold text-warning-ink">
                    {gap.totalGap}
                  </div>
                  <div className="mt-1 font-body text-xs text-warning-ink">
                    Lacunas totais
                  </div>
                </div>
              </div>

              {/* Gaps list */}
              <div className="space-y-2">
                {gap.gaps.map((g) => (
                  <div
                    key={g.competency.id}
                    className={`rounded-card border p-4 ${g.met ? 'border-success bg-success-subtle' : 'border-warning bg-surface'}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <span className="font-body text-sm font-medium text-ink">
                            {g.competency.name}
                          </span>
                          <StatusBadge
                            value={g.competency.category}
                            map={CATEGORY_CFG}
                          />
                          {g.priority === 'MANDATORY' && (
                            <Badge intent="danger">Obrigatório</Badge>
                          )}
                          {g.met && (
                            <span className="font-body text-xs font-medium text-success">
                              ✓ Cumprido
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-4">
                          <div>
                            <div className="mb-1 font-body text-xs text-ink-faint">
                              Actual
                            </div>
                            <LevelBar current={g.currentLevel} />
                          </div>
                          <div className="text-ink-faint">→</div>
                          <div>
                            <div className="mb-1 font-body text-xs text-ink-faint">
                              Requerido
                            </div>
                            <LevelBar current={g.requiredLevel} />
                          </div>
                        </div>
                      </div>
                      {!g.met && g.gap > 0 && (
                        <div className="flex-shrink-0 text-center">
                          <div className="text-xl font-bold text-warning">
                            {g.gap}
                          </div>
                          <div className="font-body text-xs text-ink-faint">
                            níveis
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Recommended courses */}
                    {!g.met && g.recommendedCourses.length > 0 && (
                      <div className="mt-3 border-t border-border pt-3">
                        <div className="mb-1.5 font-body text-xs text-ink-faint">
                          Cursos recomendados para colmatar esta lacuna:
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {g.recommendedCourses.slice(0, 3).map((c) => (
                            <a
                              key={c.id}
                              href={`/courses/${c.id}/learn`}
                              className="rounded-control bg-info-subtle px-2 py-1 font-body text-xs text-info-ink hover:brightness-95"
                            >
                              {c.title}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </TabsContent>

      {/* Evolution tab */}
      <TabsContent value="evolution">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell>Competência</TableHeaderCell>
              <TableHeaderCell>Fonte</TableHeaderCell>
              <TableHeaderCell>Anterior</TableHeaderCell>
              <TableHeaderCell>Novo</TableHeaderCell>
              <TableHeaderCell>Data</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {evolution.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center font-body text-sm text-ink-faint"
                >
                  Sem histórico de evolução
                </TableCell>
              </TableRow>
            ) : (
              evolution.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-body text-sm text-ink">
                    {e.competency?.name}
                  </TableCell>
                  <TableCell className="font-body text-xs text-ink-muted">
                    {e.source}
                  </TableCell>
                  <TableCell className="font-data text-xs text-ink-faint">
                    {e.previousLevel} →
                  </TableCell>
                  <TableCell
                    className={`font-data text-xs font-semibold ${e.newLevel > e.previousLevel ? 'text-success' : 'text-danger'}`}
                  >
                    {e.newLevel}
                  </TableCell>
                  <TableCell className="font-body text-xs text-ink-faint">
                    {fmtDate(e.createdAt)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TabsContent>
    </Tabs>
  );
}
