// components/avatar-training/room/logic.ts
// Regras da Sala de Formação Virtual (docs/Avatar_Training.md §5) sem React:
// fase da sessão, tempo efectivo, texto a ler, tipo de recurso, textos de
// resultado/certificação e corpo dos pedidos. Extraído de RoomTab.tsx.

import type {
  CertificateRequestResult,
  CertificationStatus,
  CompleteResult,
  MyAssignment,
  Room,
  RoomInteraction,
  RoomStep,
} from '../types';
import type { ExperienceType } from '../types';

type Attempt = Room['attempt'];

// ── Fase da sessão ──────────────────────────────────────────────────────────

export interface RoomPhase {
  paused: boolean;
  /** A tentativa ainda aceita interacção (em curso ou em pausa). */
  open: boolean;
  /** Todas as etapas feitas — falta só concluir a sessão. */
  allDone: boolean;
}

export function roomPhase(
  attempt: Attempt | undefined,
  currentStep: RoomStep | null | undefined,
): RoomPhase {
  const paused = attempt?.status === 'PAUSED';
  const open = attempt?.status === 'IN_PROGRESS' || paused;
  return { paused, open, allDone: open && !currentStep };
}

/** Número da etapa a mostrar ("Etapa X de N"), nunca acima do total. */
export const currentStepNumber = (currentStep: number, total: number): number =>
  Math.min(currentStep + 1, Math.max(total, 1));

// ── Tempo ───────────────────────────────────────────────────────────────────

/** Tentativa fictícia usada enquanto a sala ainda não carregou. */
export const placeholderAttempt = (attemptId: number): Attempt => ({
  id: attemptId,
  status: 'IN_PROGRESS',
  currentStep: 0,
  progress: 0,
  textOnly: true,
  startedAt: new Date().toISOString(),
  pausedAt: null,
  pausedSeconds: 0,
});

/**
 * Tempo efectivo de sessão (mm:ss), sem as pausas: congela em `pausedAt`
 * enquanto a tentativa está em pausa.
 */
export function formatElapsed(attempt: Attempt, nowMs: number): string {
  const end = attempt.pausedAt ? new Date(attempt.pausedAt).getTime() : nowMs;
  const secs = Math.max(
    0,
    Math.round((end - new Date(attempt.startedAt).getTime()) / 1000) -
      attempt.pausedSeconds,
  );
  const mm = String(Math.floor(secs / 60)).padStart(2, '0');
  const ss = String(secs % 60).padStart(2, '0');
  return `${mm}:${ss}`;
}

// ── Etapa e conversa ────────────────────────────────────────────────────────

/** Texto lido em voz alta para a etapa: título, conteúdo e pergunta. */
export function buildStepText(step: RoomStep | null | undefined): string {
  return step
    ? [step.title, step.content, step.question?.prompt]
        .filter(Boolean)
        .join('. ')
    : '';
}

/** Última resposta do instrutor com mensagem de IA (para «Ouvir a última»). */
export function findLastAvatarMessage(
  interactions: RoomInteraction[],
): RoomInteraction | undefined {
  return [...interactions]
    .reverse()
    .find(
      (i) => i.interactionType === 'AVATAR_MESSAGE' && i.metadata?.aiMessageId,
    );
}

export type ResourceKind = 'image' | 'video' | 'pdf' | 'link';

const IMAGE_RE = /\.(png|jpe?g|gif|webp|svg)(\?.*)?$/i;
const VIDEO_RE = /\.(mp4|webm|ogg)(\?.*)?$/i;
const PDF_RE = /\.pdf(\?.*)?$/i;

export function resourceKind(url: string): ResourceKind {
  if (IMAGE_RE.test(url)) return 'image';
  if (VIDEO_RE.test(url)) return 'video';
  if (PDF_RE.test(url)) return 'pdf';
  return 'link';
}

/** Opções de resposta de uma pergunta; sem opções, a resposta é texto livre. */
export function questionOptions(step: RoomStep): string[] {
  const q = step.question;
  return q?.kind === 'TRUE_FALSE'
    ? ['Verdadeiro', 'Falso']
    : (q?.options ?? []);
}

// ── Voz ─────────────────────────────────────────────────────────────────────

export function speakingSuffix(
  speaking: boolean,
  engine: 'SERVER' | 'BROWSER' | null,
): string {
  if (!speaking) return '';
  return engine === 'SERVER'
    ? ' · a falar (voz do servidor)'
    : ' · a falar (voz do navegador)';
}

// ── Pedidos ─────────────────────────────────────────────────────────────────

export interface InteractionPayload {
  interactionType: string;
  content: string;
  stepKey?: string;
}

export const buildAnswerPayload = (
  stepKey: string,
  answer: string,
): InteractionPayload => ({
  interactionType: 'USER_ANSWER',
  content: answer,
  stepKey,
});

export const buildAdvancePayload = (stepKey: string): InteractionPayload => ({
  interactionType: 'STEP_ADVANCE',
  content: 'Continuar',
  stepKey,
});

export const HUMAN_HELP_DEFAULT_TEXT = 'Pedido de ajuda de um formador humano.';

/** A pergunta escrita (se houver) segue como contexto do pedido de ajuda. */
export const buildHelpPayload = (
  question: string,
  stepKey: string | undefined,
): InteractionPayload => ({
  interactionType: 'HELP_REQUEST',
  content: question.trim() || HUMAN_HELP_DEFAULT_TEXT,
  stepKey,
});

// ── Resultado e certificação ────────────────────────────────────────────────

/** `passed === null`: a sessão não tem nota mínima. */
export function outcomeTitle(passed: CompleteResult['passed']): string {
  if (passed === null) return 'Sessão concluída.';
  return passed ? 'Aprovado.' : 'Não atingiu a nota mínima.';
}

export function scoreLine(
  r: Pick<CompleteResult, 'score' | 'passingScore'>,
): string | null {
  if (r.score === null) return null;
  return `Nota: ${r.score}${r.passingScore !== null ? ` (mínimo ${r.passingScore})` : ''}`;
}

/** A elegibilidade só se consulta depois de concluir sem reprovar. */
export const shouldCheckCertification = (
  result: CompleteResult | null,
  hasRoom: boolean,
): boolean => !!result && result.passed !== false && hasRoom;

export function certificationMessage(c: CertificationStatus): string {
  return c.eligible
    ? 'Cumpre as regras para pedir o certificado desta formação.'
    : `Certificado ainda não disponível: ${c.reasons.join('; ')}.`;
}

export function certificateRequestNotice(r: CertificateRequestResult): {
  title: string;
  description?: string;
} {
  return {
    title:
      r.status === 'ISSUED' || r.status === 'ALREADY_ISSUED'
        ? 'Certificado emitido'
        : 'Pedido de certificado registado',
    description:
      r.status === 'REQUESTED' || r.status === 'ALREADY_REQUESTED'
        ? 'O responsável pela formação foi avisado.'
        : undefined,
  };
}

// ── Lista de sessões atribuídas ─────────────────────────────────────────────

export function filterAssignments(
  data: MyAssignment[],
  only?: readonly ExperienceType[],
): MyAssignment[] {
  return only
    ? data.filter((a) => only.includes(a.session.experienceType))
    : data;
}

/** O que o cartão oferece: nada se já concluída; «Retomar» se há tentativa aberta. */
export function assignmentAction(a: MyAssignment): {
  done: boolean;
  resuming: boolean;
  label: 'Retomar' | 'Iniciar';
} {
  const last = a.attempts[0];
  const resuming =
    !!last && (last.status === 'IN_PROGRESS' || last.status === 'PAUSED');
  return {
    done: a.status === 'COMPLETED',
    resuming,
    label: resuming ? 'Retomar' : 'Iniciar',
  };
}
