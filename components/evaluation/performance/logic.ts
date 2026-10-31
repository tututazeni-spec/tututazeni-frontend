// components/evaluation/performance/logic.ts
// Lógica pura do formulário de avaliação (validação de campos obrigatórios e
// montagem do payload). A classificação ponderada NÃO é calculada aqui: o
// servidor devolve o valor persistido, para que o ecrã e a BD nunca divirjam.

import type {
  ImprovementDraft,
  RecommendationDraft,
  StrengthDraft,
} from './types';

const blank = (s: string | undefined) => !s || !s.trim();
const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

export interface FormQuestionLite {
  id: number;
  type: string;
  required: boolean;
}

export interface QuestionAnswerLite {
  score?: number;
  comment?: string;
  notApplicable?: boolean;
}

const RATEABLE = new Set(['SCALE', 'NA_ALLOWED']);

/** % de critérios avaliáveis respondidos (nota ou "Não aplicável"). */
export function criteriaProgress(
  questions: FormQuestionLite[],
  answers: Record<number, QuestionAnswerLite>,
): { answered: number; total: number; pct: number } {
  const rateable = questions.filter((q) => RATEABLE.has(q.type));
  const answered = rateable.filter((q) => {
    const a = answers[q.id];
    return a?.notApplicable || a?.score !== undefined;
  }).length;
  const total = rateable.length;
  return {
    answered,
    total,
    pct: total ? Math.round((answered / total) * 100) : 0,
  };
}

export function missingRequiredCriteria(
  questions: FormQuestionLite[],
  answers: Record<number, QuestionAnswerLite>,
): number[] {
  return questions
    .filter((q) => {
      if (!q.required) return false;
      const a = answers[q.id];
      if (q.type === 'TEXT') return blank(a?.comment);
      return a?.score === undefined && !a?.notApplicable;
    })
    .map((q) => q.id);
}

export interface SectionErrors {
  strengths: string[];
  improvements: string[];
  recommendations: string[];
}

function duplicates(items: { competency: string; competencyId?: number }[]) {
  const seen = new Set<string>();
  const dup: string[] = [];
  for (const i of items) {
    if (blank(i.competency)) continue;
    const k = i.competencyId
      ? `id:${i.competencyId}`
      : `n:${norm(i.competency)}`;
    if (seen.has(k)) dup.push(i.competency);
    seen.add(k);
  }
  return dup;
}

/** Erros de preenchimento das três secções qualitativas (espelham as regras do servidor). */
export function validateSections(
  strengths: StrengthDraft[],
  improvements: ImprovementDraft[],
  recommendations: RecommendationDraft[],
  opts: { today?: Date } = {},
): SectionErrors {
  const out: SectionErrors = {
    strengths: [],
    improvements: [],
    recommendations: [],
  };
  strengths.forEach((s, i) => {
    const n = i + 1;
    if (blank(s.competency))
      out.strengths.push(`Ponto forte ${n}: indique a competência`);
    if (s.score === undefined)
      out.strengths.push(`Ponto forte ${n}: escolha uma nota de 1 a 5`);
    if (blank(s.description))
      out.strengths.push(`Ponto forte ${n}: descreva o ponto forte`);
  });
  duplicates(strengths).forEach((c) =>
    out.strengths.push(`A competência "${c}" está repetida nos pontos fortes`),
  );

  improvements.forEach((a, i) => {
    const n = i + 1;
    if (blank(a.competency))
      out.improvements.push(`Área ${n}: indique a competência`);
    if (a.score === undefined)
      out.improvements.push(`Área ${n}: escolha a nota de desempenho atual`);
    if (blank(a.description))
      out.improvements.push(`Área ${n}: descreva a necessidade`);
    if (!a.priority)
      out.improvements.push(
        `Área ${n}: escolha a prioridade de desenvolvimento`,
      );
    if (
      a.score !== undefined &&
      a.score >= 4 &&
      blank(a.evidence) &&
      blank(a.comment)
    ) {
      out.improvements.push(
        `Área ${n}: com nota ${a.score}, justifique em evidência ou comentário porque ainda é uma área de melhoria`,
      );
    }
  });
  duplicates(improvements).forEach((c) =>
    out.improvements.push(
      `A competência "${c}" está repetida nas áreas de melhoria`,
    ),
  );

  const today = new Date(opts.today ?? new Date());
  today.setHours(0, 0, 0, 0);
  recommendations.forEach((r, i) => {
    const n = i + 1;
    if (blank(r.action))
      out.recommendations.push(`Recomendação ${n}: indique a ação`);
    if (blank(r.objective))
      out.recommendations.push(`Recomendação ${n}: indique o objetivo`);
    if (!r.actionType)
      out.recommendations.push(`Recomendação ${n}: escolha o tipo de ação`);
    if (blank(r.successIndicator))
      out.recommendations.push(
        `Recomendação ${n}: indique o indicador de sucesso`,
      );
    if (r.priority === undefined)
      out.recommendations.push(
        `Recomendação ${n}: escolha a prioridade (1 a 5)`,
      );
    if (r.dueDate && new Date(r.dueDate) < today)
      out.recommendations.push(
        `Recomendação ${n}: o prazo não pode estar no passado`,
      );
    if (
      r.improvementKey &&
      !improvements.some((a) => a.key === r.improvementKey)
    )
      out.recommendations.push(
        `Recomendação ${n}: a área de melhoria associada foi removida`,
      );
  });
  return out;
}

export const hasSectionErrors = (e: SectionErrors) =>
  e.strengths.length + e.improvements.length + e.recommendations.length > 0;

const opt = (s: string) => (s.trim() ? s.trim() : undefined);

/** Payload dos três grupos para POST /evaluations/submit (rascunho: campos incompletos são omitidos). */
export function buildStructuredPayload(
  strengths: StrengthDraft[],
  improvements: ImprovementDraft[],
  recommendations: RecommendationDraft[],
) {
  return {
    strengthItems: strengths.map((s) => ({
      competencyId: s.competencyId,
      competency: s.competency.trim(),
      score: s.score,
      description: s.description.trim(),
      evidence: opt(s.evidence),
      impact: opt(s.impact),
      comment: opt(s.comment),
    })),
    improvementItems: improvements.map((a) => ({
      ref: a.key,
      competencyId: a.competencyId,
      competency: a.competency.trim(),
      score: a.score,
      description: a.description.trim(),
      evidence: opt(a.evidence),
      impact: opt(a.impact),
      priority: a.priority,
      comment: opt(a.comment),
    })),
    recommendationItems: recommendations.map((r) => ({
      improvementRef: r.improvementKey || undefined,
      action: r.action.trim(),
      objective: r.objective.trim(),
      actionType: r.actionType,
      responsibleId: r.responsibleId,
      dueDate: r.dueDate || undefined,
      successIndicator: r.successIndicator.trim(),
      priority: r.priority,
      notes: opt(r.notes),
    })),
  };
}

// ─── Rascunho ────────────────────────────────────────────────────
// O servidor valida cada item por inteiro; num rascunho só seguem os itens
// já completos e o ecrã avisa quantos ficaram de fora.

const strengthDone = (s: StrengthDraft) =>
  !blank(s.competency) && s.score !== undefined && !blank(s.description);
const improvementDone = (a: ImprovementDraft) =>
  !blank(a.competency) &&
  a.score !== undefined &&
  !blank(a.description) &&
  !!a.priority &&
  !(a.score >= 4 && blank(a.evidence) && blank(a.comment));
const recommendationDone = (r: RecommendationDraft) =>
  !blank(r.action) &&
  !blank(r.objective) &&
  !!r.actionType &&
  !blank(r.successIndicator) &&
  r.priority !== undefined;

export function completeItemsOnly(
  strengths: StrengthDraft[],
  improvements: ImprovementDraft[],
  recommendations: RecommendationDraft[],
) {
  const okAreas = improvements.filter(improvementDone);
  const okKeys = new Set(okAreas.map((a) => a.key));
  const okRecs = recommendations
    .filter(recommendationDone)
    .map((r) =>
      r.improvementKey && !okKeys.has(r.improvementKey)
        ? { ...r, improvementKey: '' }
        : r,
    );
  const okStrengths = strengths.filter(strengthDone);
  const dropped =
    strengths.length -
    okStrengths.length +
    improvements.length -
    okAreas.length +
    recommendations.length -
    okRecs.length;
  return {
    strengths: okStrengths,
    improvements: okAreas,
    recommendations: okRecs,
    dropped,
  };
}
