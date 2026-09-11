// hooks/useEvaluation360.ts
// Container da página de Avaliação 360º — liga-se ao módulo real
// src/evaluation360/ (backend `/evaluation360/*`), NÃO ao módulo `evaluation`
// singular (`/evaluations/*`, review de performance geral) a que este hook
// esteve ligado por engano antes (só o `cycles`, e mesmo assim para o
// endpoint errado). Todos os dados vêm de avaliações reais submetidas na
// plataforma — sem dados fictícios/mock.
//
// `participantId` (opcional): de quem se quer ver o resultado. Por omissão,
// o próprio utilizador autenticado. Só ADMIN/RH conseguem ver o resultado de
// outro colaborador (espelha `canSeeFull` em
// evaluation360.service.ts#getParticipantResult) — para os restantes papéis,
// mesmo passando um `participantId` diferente, o backend devolve 403.

'use client';

import type {
  CompetencyScore,
  ContinuousFeedback,
  CycleInfo,
  EvaluationQuestion,
  NineBoxEntry,
  ParticipantResult,
} from '@/components/evaluation360/types';
import { useApiQuery } from '@/hooks/useApiQuery';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useCurrentRole } from '@/hooks/useCurrentRole';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';

// Espelha @Roles(ADMIN, RH, GESTOR) de GET /evaluation360/analytics/nine-box
// (evaluation360.controller.ts) — não pedir o endpoint a quem vai receber 403.
const NINE_BOX_ROLES = ['ADMIN', 'RH', 'GESTOR'];

// ─── Formas da resposta do backend ─────────────────────────────────────────

interface RawCycle {
  id: string;
  name: string;
  model: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string;
  _count?: { participants: number; assignments: number; responses: number };
  completedParticipants?: number;
}

interface RawCompetencyScoreEntry {
  name: string;
  category: string;
  type: string;
  score: number | null;
  selfScore: number | null;
  othersScore: number | null;
  managerScore: number | null;
  peerScore: number | null;
  gap: number | null;
  benchmark: number | null;
}

interface RawParticipantResult {
  overallScore: number;
  weightedScore: number;
  selfScore: number | null;
  managerScore: number | null;
  peerScore: number | null;
  scoresByCompetency: Record<string, RawCompetencyScoreEntry>;
  gaps: { competencyId: string; name: string; score: number | null; gap: number | null }[];
  strengths: { competencyId: string; name: string; score: number | null }[];
}

interface RawNineBoxEntry {
  participantId: string;
  name?: string;
  performance: 'LOW' | 'MID' | 'HIGH';
  potential: 'LOW' | 'MID' | 'HIGH';
  score: number;
}

interface RawFeedback {
  id: string;
  fromName: string;
  type: 'RECOGNITION' | 'DEVELOPMENT' | 'CHECK_IN' | 'PULSE';
  message: string;
  competencyName: string | null;
  createdAt: string;
}

interface RawQuestion {
  id: string;
  text: string;
  type: string;
  isRequired: boolean;
  competency?: { name: string } | null;
}

interface UserProfileLite {
  fullName: string;
  department?: { name: string } | null;
  position?: { name: string } | null;
  avatarUrl?: string | null;
}

// ─── Mapeamentos ────────────────────────────────────────────────────────────

function toCycleInfo(c: RawCycle): CycleInfo {
  return {
    id: c.id,
    name: c.name,
    model: c.model,
    status: c.status,
    startDate: c.startDate.slice(0, 10),
    endDate: c.endDate.slice(0, 10),
    participantsCount: c._count?.participants ?? 0,
    completedCount: c.completedParticipants ?? 0,
  };
}

function toCompetencies(
  scoresByCompetency: Record<string, RawCompetencyScoreEntry> | undefined,
): CompetencyScore[] {
  if (!scoresByCompetency) return [];
  return Object.entries(scoresByCompetency)
    .filter(([, v]) => v.score !== null)
    .map(([id, v]) => ({
      id,
      name: v.name,
      category: v.category,
      type: (v.type as CompetencyScore['type']) ?? 'SOFT_SKILL',
      selfScore: v.selfScore ?? 0,
      othersScore: v.othersScore ?? 0,
      managerScore: v.managerScore ?? 0,
      peerScore: v.peerScore ?? 0,
      gap: v.gap ?? 0,
      benchmark: v.benchmark ?? v.score ?? 0,
    }));
}

function toParticipantResult(
  raw: RawParticipantResult | undefined,
  participant: { id: string; fullName: string; department?: string; position?: string; avatarUrl?: string | null } | undefined,
): ParticipantResult | null {
  if (!raw || !participant) return null;
  const competencies = toCompetencies(raw.scoresByCompetency);
  const byId = new Map(competencies.map((c) => [c.id, c]));
  return {
    userId: participant.id,
    fullName: participant.fullName,
    position: participant.position ?? '—',
    department: participant.department ?? '—',
    avatarUrl: participant.avatarUrl,
    overallScore: raw.overallScore,
    weightedScore: raw.weightedScore,
    selfScore: raw.selfScore ?? 0,
    managerScore: raw.managerScore ?? 0,
    peerScore: raw.peerScore ?? 0,
    competencies,
    strengths: raw.strengths
      .map((s) => byId.get(s.competencyId))
      .filter((c): c is CompetencyScore => !!c),
    gaps: raw.gaps
      .map((g) => byId.get(g.competencyId))
      .filter((c): c is CompetencyScore => !!c),
  };
}

function toFeedback(f: RawFeedback): ContinuousFeedback {
  return {
    id: f.id,
    fromName: f.fromName,
    type: f.type === 'PULSE' ? 'CHECK_IN' : f.type,
    message: f.message,
    competency: f.competencyName ?? undefined,
    createdAt: f.createdAt,
  };
}

function toQuestion(q: RawQuestion): EvaluationQuestion {
  return {
    id: q.id,
    text: q.text,
    type: q.type === 'FREQUENCY' ? 'FREQUENCY' : q.type === 'OPEN_TEXT' ? 'OPEN_TEXT' : 'LIKERT',
    competency: q.competency?.name ?? '',
    isRequired: q.isRequired,
  };
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useEvaluation360(participantIdOverride?: string) {
  const { data: me } = useCurrentUser();
  const role = useCurrentRole();
  const myId = me ? String(me.id) : undefined;
  const participantId = participantIdOverride ?? myId;
  const isOwnResult = participantId === myId;

  const { data: cyclesData, isLoading: cyclesLoading } = useApiQuery<{
    data: RawCycle[];
    total: number;
  }>(queryKeys.evaluation360.cycles(), '/evaluation360/cycles', {
    params: { tenantId: 'default', limit: 50 },
    staleTime: STALE_TIME.SEMI_STATIC,
  });

  const cycles = (cyclesData?.data ?? []).map(toCycleInfo);
  // Ciclo activo: o mais recente com trabalho em curso, senão o mais recente
  // concluído/publicado, senão qualquer um (ex.: ainda em DRAFT).
  const cycle =
    cycles.find((c) => c.status === 'IN_PROGRESS') ??
    cycles.find((c) => c.status === 'COMPLETED') ??
    cycles.find((c) => c.status === 'PUBLISHED') ??
    cycles[0] ??
    null;
  const cycleId = cycle?.id;

  const { data: rawResult } = useApiQuery<RawParticipantResult>(
    queryKeys.evaluation360.result(cycleId ?? '', participantId ?? ''),
    cycleId && participantId ? `/evaluation360/cycles/${cycleId}/results/${participantId}` : '',
    {
      enabled: !!cycleId && !!participantId,
      staleTime: STALE_TIME.DYNAMIC,
      // 404 = o ciclo ainda não foi calculado (ou este participante não tem
      // resultado) — estado normal numa BD nova, não um erro a reportar.
      meta: { silent: true },
      retry: false,
    },
  );

  // Nome/departamento/foto de quem se está a ver: o próprio (useCurrentUser
  // já tem tudo) ou outro colaborador (GET /users/:id — perfil básico, aberto
  // a qualquer autenticado; só ADMIN/RH chegam a escolher alguém, ver
  // OverviewTab). GET /users/directory não serve aqui: não filtra por id.
  const { data: otherUser } = useApiQuery<UserProfileLite>(
    queryKeys.users.detail(participantId ?? ''),
    participantId ? `/users/${participantId}` : '',
    { enabled: !isOwnResult && !!participantId, staleTime: STALE_TIME.SEMI_STATIC },
  );

  const participant = isOwnResult
    ? me
      ? {
          id: myId!,
          fullName: me.fullName,
          department: me.department?.name,
          position: me.position?.name,
          avatarUrl: me.avatarUrl,
        }
      : undefined
    : otherUser
      ? {
          id: participantId!,
          fullName: otherUser.fullName,
          department: otherUser.department?.name,
          position: otherUser.position?.name,
          avatarUrl: otherUser.avatarUrl,
        }
      : undefined;

  const result = toParticipantResult(rawResult, participant);
  const competencies = result?.competencies ?? [];

  const canSeeNineBox = !!role && NINE_BOX_ROLES.includes(role);
  const { data: nineBoxData } = useApiQuery<RawNineBoxEntry[]>(
    queryKeys.evaluation360.nineBox(cycleId ?? ''),
    '/evaluation360/analytics/nine-box',
    {
      params: { cycleId },
      enabled: !!cycleId && canSeeNineBox,
      staleTime: STALE_TIME.DYNAMIC,
      meta: { silent: true },
    },
  );
  const nineBox: NineBoxEntry[] = (nineBoxData ?? []).map((n) => ({
    participantId: n.participantId,
    name: n.name ?? '—',
    performance: n.performance,
    potential: n.potential,
    score: n.score,
  }));

  const { data: feedbackData } = useApiQuery<{ data: RawFeedback[]; total: number }>(
    queryKeys.evaluation360.feedbacks(participantId ?? ''),
    participantId ? `/evaluation360/feedback/continuous/${participantId}` : '',
    { enabled: !!participantId, staleTime: STALE_TIME.DYNAMIC },
  );
  const feedbacks = (feedbackData?.data ?? []).map(toFeedback);

  // Formulário de auto-avaliação (evaluateeId = o próprio utilizador).
  const { data: selfFormData } = useApiQuery<{ questions: RawQuestion[] }>(
    queryKeys.evaluation360.form(cycleId ?? '', myId ?? ''),
    cycleId && myId ? `/evaluation360/cycles/${cycleId}/form` : '',
    {
      params: { evaluateeId: myId },
      enabled: !!cycleId && !!myId,
      staleTime: STALE_TIME.DYNAMIC,
      meta: { silent: true },
      retry: false,
    },
  );
  const selfFormQuestions = (selfFormData?.questions ?? []).map(toQuestion);

  return {
    result,
    cycle,
    cycles,
    competencies,
    nineBox,
    feedbacks,
    selfFormQuestions,
    myId,
    cycleId,
    loading: cyclesLoading,
  };
}
