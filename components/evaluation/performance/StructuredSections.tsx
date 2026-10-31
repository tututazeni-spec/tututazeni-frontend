// components/evaluation/performance/StructuredSections.tsx
// Pontos Fortes, Áreas de Melhoria e Recomendações como cartões repetíveis
// (docs/avaliacao_desempenho_robusta_claude_code.md §4-6, §14). Componentes
// controlados: o estado vive no SubmitEvaluationModal.

'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { NativeSelect } from '@/components/ui/NativeSelect';
import { Textarea } from '@/components/ui/Textarea';
import { RatingScale } from './RatingScale';
import {
  ACTION_TYPE_LABELS,
  IMPROVEMENT_PRIORITY_LABELS,
  OBJECTIVE_SUGGESTIONS,
  RECOMMENDATION_PRIORITY_LABELS,
  SUCCESS_INDICATOR_SUGGESTIONS,
  emptyImprovement,
  emptyRecommendation,
  emptyStrength,
  type ImprovementDraft,
  type ImprovementPriority,
  type RatingLevel,
  type RecommendationActionType,
  type RecommendationDraft,
  type StrengthDraft,
} from './types';

export interface CompetencyOption {
  id: number;
  name: string;
}

export interface TrainingOption {
  id: number;
  title: string;
}

export interface ResponsibleOption {
  id: number;
  label: string;
}

interface SectionShellProps {
  title: string;
  hint: string;
  addLabel: string;
  count: number;
  errors: string[];
  onAdd: () => void;
  children: React.ReactNode;
}

function SectionShell({
  title,
  hint,
  addLabel,
  count,
  errors,
  onAdd,
  children,
}: SectionShellProps) {
  return (
    <section className="space-y-3" aria-label={title}>
      <header>
        <h3 className="text-base font-semibold text-ink">{title}</h3>
        <p className="text-sm text-ink-muted">{hint}</p>
      </header>
      {count === 0 && (
        <p className="rounded-card border border-dashed border-border-strong p-4 text-center text-sm text-ink-muted">
          Ainda sem registos. Esta secção é opcional.
        </p>
      )}
      {children}
      {errors.length > 0 && (
        <ul
          role="alert"
          className="list-disc space-y-0.5 rounded-card bg-danger-subtle py-2 pl-7 pr-3 text-xs text-danger-ink"
        >
          {errors.map((e) => (
            <li key={e}>{e}</li>
          ))}
        </ul>
      )}
      <Button intent="secondary" onClick={onAdd} type="button">
        <Plus size={16} strokeWidth={1.75} aria-hidden /> {addLabel}
      </Button>
    </section>
  );
}

interface CardProps {
  heading: string;
  onRemove: () => void;
  children: React.ReactNode;
}

function ItemCard({ heading, onRemove, children }: CardProps) {
  return (
    <div className="space-y-3 rounded-card border border-border bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-sm font-semibold text-ink">{heading}</h4>
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remover ${heading}`}
          className="rounded-control p-1.5 text-ink-muted hover:bg-surface-sunken hover:text-danger"
        >
          <Trash2 size={16} strokeWidth={1.75} />
        </button>
      </div>
      {children}
    </div>
  );
}

interface CompetencyFieldProps {
  id: string;
  value: string;
  options: CompetencyOption[];
  onChange: (name: string, competencyId?: number) => void;
}

/** Texto livre com sugestões do catálogo; se coincidir com uma competência, guarda o id. */
function CompetencyField({
  id,
  value,
  options,
  onChange,
}: CompetencyFieldProps) {
  const listId = `${id}-list`;
  return (
    <>
      <FormField label="Competência *" htmlFor={id}>
        <Input
          id={id}
          list={listId}
          value={value}
          maxLength={200}
          placeholder="Escolha do catálogo ou escreva"
          onChange={(e) => {
            const text = e.target.value;
            const match = options.find(
              (o) => o.name.toLowerCase() === text.trim().toLowerCase(),
            );
            onChange(text, match?.id);
          }}
        />
      </FormField>
      <datalist id={listId}>
        {options.map((o) => (
          <option key={o.id} value={o.name} />
        ))}
      </datalist>
    </>
  );
}

const patch = <T extends { key: string }>(
  items: T[],
  key: string,
  change: Partial<T>,
): T[] => items.map((i) => (i.key === key ? { ...i, ...change } : i));

// ─── Pontos fortes ────────────────────────────────────────────────

export interface StrengthsSectionProps {
  items: StrengthDraft[];
  onChange: (items: StrengthDraft[]) => void;
  competencies: CompetencyOption[];
  levels: RatingLevel[];
  errors: string[];
}

export function StrengthsSection({
  items,
  onChange,
  competencies,
  levels,
  errors,
}: StrengthsSectionProps) {
  return (
    <SectionShell
      title="Pontos Fortes"
      hint="Registe competências e comportamentos positivos, acompanhados de exemplos concretos."
      addLabel="Adicionar ponto forte"
      count={items.length}
      errors={errors}
      onAdd={() => onChange([...items, emptyStrength()])}
    >
      {items.map((s, i) => (
        <ItemCard
          key={s.key}
          heading={`Ponto forte ${i + 1}`}
          onRemove={() => onChange(items.filter((x) => x.key !== s.key))}
        >
          <CompetencyField
            id={`st-comp-${s.key}`}
            value={s.competency}
            options={competencies}
            onChange={(competency, competencyId) =>
              onChange(patch(items, s.key, { competency, competencyId }))
            }
          />
          <div>
            <p className="mb-1 text-sm font-medium text-ink">
              Nota de desempenho *
            </p>
            <RatingScale
              label={`Nota do ponto forte ${i + 1}`}
              value={s.score}
              levels={levels}
              onChange={(score) => onChange(patch(items, s.key, { score }))}
            />
          </div>
          <FormField label="Descrição" htmlFor={`st-desc-${s.key}`}>
            <Textarea
              id={`st-desc-${s.key}`}
              rows={2}
              maxLength={2000}
              value={s.description}
              onChange={(e) =>
                onChange(patch(items, s.key, { description: e.target.value }))
              }
            />
          </FormField>
          <div className="grid gap-3 md:grid-cols-2">
            <FormField
              label="Evidência / exemplo"
              htmlFor={`st-ev-${s.key}`}
              hint="Situação, comportamento ou resultado concreto."
            >
              <Textarea
                id={`st-ev-${s.key}`}
                rows={2}
                maxLength={2000}
                value={s.evidence}
                onChange={(e) =>
                  onChange(patch(items, s.key, { evidence: e.target.value }))
                }
              />
            </FormField>
            <FormField
              label="Impacto organizacional"
              htmlFor={`st-imp-${s.key}`}
              hint="Contributo para a equipa ou organização."
            >
              <Textarea
                id={`st-imp-${s.key}`}
                rows={2}
                maxLength={2000}
                value={s.impact}
                onChange={(e) =>
                  onChange(patch(items, s.key, { impact: e.target.value }))
                }
              />
            </FormField>
          </div>
          <FormField label="Comentário adicional" htmlFor={`st-com-${s.key}`}>
            <Textarea
              id={`st-com-${s.key}`}
              rows={1}
              maxLength={2000}
              value={s.comment}
              onChange={(e) =>
                onChange(patch(items, s.key, { comment: e.target.value }))
              }
            />
          </FormField>
        </ItemCard>
      ))}
    </SectionShell>
  );
}

// ─── Áreas de melhoria ────────────────────────────────────────────

export interface ImprovementsSectionProps {
  items: ImprovementDraft[];
  onChange: (items: ImprovementDraft[]) => void;
  competencies: CompetencyOption[];
  levels: RatingLevel[];
  errors: string[];
}

export function ImprovementsSection({
  items,
  onChange,
  competencies,
  levels,
  errors,
}: ImprovementsSectionProps) {
  return (
    <SectionShell
      title="Áreas de Melhoria"
      hint="Identifique aspetos que necessitam de desenvolvimento e fundamente a avaliação com situações observáveis."
      addLabel="Adicionar área de melhoria"
      count={items.length}
      errors={errors}
      onAdd={() => onChange([...items, emptyImprovement()])}
    >
      {items.map((a, i) => (
        <ItemCard
          key={a.key}
          heading={`Área de melhoria ${i + 1}`}
          onRemove={() => onChange(items.filter((x) => x.key !== a.key))}
        >
          <CompetencyField
            id={`im-comp-${a.key}`}
            value={a.competency}
            options={competencies}
            onChange={(competency, competencyId) =>
              onChange(patch(items, a.key, { competency, competencyId }))
            }
          />
          <div>
            <p className="mb-1 text-sm font-medium text-ink">
              Nota de desempenho atual *
            </p>
            <p className="mb-1.5 text-xs text-ink-faint">
              A nota é o desempenho de hoje, não a gravidade da lacuna — a
              urgência define-se na prioridade abaixo.
            </p>
            <RatingScale
              label={`Nota da área de melhoria ${i + 1}`}
              value={a.score}
              levels={levels}
              onChange={(score) => onChange(patch(items, a.key, { score }))}
            />
          </div>
          <FormField
            label="Descrição da necessidade"
            htmlFor={`im-desc-${a.key}`}
          >
            <Textarea
              id={`im-desc-${a.key}`}
              rows={2}
              maxLength={2000}
              value={a.description}
              onChange={(e) =>
                onChange(patch(items, a.key, { description: e.target.value }))
              }
            />
          </FormField>
          <div className="grid gap-3 md:grid-cols-2">
            <FormField
              label="Evidência / exemplo"
              htmlFor={`im-ev-${a.key}`}
              hint="Situação observável que fundamenta a avaliação."
            >
              <Textarea
                id={`im-ev-${a.key}`}
                rows={2}
                maxLength={2000}
                value={a.evidence}
                onChange={(e) =>
                  onChange(patch(items, a.key, { evidence: e.target.value }))
                }
              />
            </FormField>
            <FormField
              label="Impacto no desempenho"
              htmlFor={`im-imp-${a.key}`}
              hint="Consequência da lacuna para o trabalho ou resultados."
            >
              <Textarea
                id={`im-imp-${a.key}`}
                rows={2}
                maxLength={2000}
                value={a.impact}
                onChange={(e) =>
                  onChange(patch(items, a.key, { impact: e.target.value }))
                }
              />
            </FormField>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <FormField
              label="Prioridade de desenvolvimento *"
              htmlFor={`im-pri-${a.key}`}
            >
              <NativeSelect
                id={`im-pri-${a.key}`}
                className="w-full"
                value={a.priority ?? ''}
                onChange={(e) =>
                  onChange(
                    patch(items, a.key, {
                      priority: (e.target.value || undefined) as
                        ImprovementPriority | undefined,
                    }),
                  )
                }
              >
                <option value="">Escolha…</option>
                {Object.entries(IMPROVEMENT_PRIORITY_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField label="Comentário adicional" htmlFor={`im-com-${a.key}`}>
              <Textarea
                id={`im-com-${a.key}`}
                rows={1}
                maxLength={2000}
                value={a.comment}
                onChange={(e) =>
                  onChange(patch(items, a.key, { comment: e.target.value }))
                }
              />
            </FormField>
          </div>
        </ItemCard>
      ))}
    </SectionShell>
  );
}

// ─── Recomendações ────────────────────────────────────────────────

export interface RecommendationsSectionProps {
  items: RecommendationDraft[];
  onChange: (items: RecommendationDraft[]) => void;
  improvements: ImprovementDraft[];
  responsibles: ResponsibleOption[];
  trainings: TrainingOption[];
  errors: string[];
}

export function RecommendationsSection({
  items,
  onChange,
  improvements,
  responsibles,
  trainings,
  errors,
}: RecommendationsSectionProps) {
  return (
    <SectionShell
      title="Recomendações e Plano de Ação"
      hint="Defina ações práticas, responsáveis, prazos e indicadores para acompanhar a evolução."
      addLabel="Adicionar recomendação"
      count={items.length}
      errors={errors}
      onAdd={() => onChange([...items, emptyRecommendation()])}
    >
      {items.map((r, i) => (
        <ItemCard
          key={r.key}
          heading={`Recomendação ${i + 1}`}
          onRemove={() => onChange(items.filter((x) => x.key !== r.key))}
        >
          <FormField label="Ação recomendada *" htmlFor={`rc-act-${r.key}`}>
            <Textarea
              id={`rc-act-${r.key}`}
              rows={2}
              maxLength={2000}
              value={r.action}
              onChange={(e) =>
                onChange(patch(items, r.key, { action: e.target.value }))
              }
            />
          </FormField>
          <FormField
            label="Objetivo pretendido *"
            htmlFor={`rc-obj-${r.key}`}
            hint="Escolha da lista ou escreva o seu próprio objetivo."
          >
            <Input
              id={`rc-obj-${r.key}`}
              list={`rc-obj-${r.key}-list`}
              maxLength={2000}
              placeholder="Escolha da lista ou escreva"
              value={r.objective}
              onChange={(e) =>
                onChange(patch(items, r.key, { objective: e.target.value }))
              }
            />
          </FormField>
          <datalist id={`rc-obj-${r.key}-list`}>
            {OBJECTIVE_SUGGESTIONS.map((o) => (
              <option key={o} value={o} />
            ))}
          </datalist>
          <div className="grid gap-3 md:grid-cols-2">
            <FormField label="Tipo de ação *" htmlFor={`rc-typ-${r.key}`}>
              <NativeSelect
                id={`rc-typ-${r.key}`}
                className="w-full"
                value={r.actionType ?? ''}
                onChange={(e) =>
                  onChange(
                    patch(items, r.key, {
                      actionType: (e.target.value || undefined) as
                        RecommendationActionType | undefined,
                    }),
                  )
                }
              >
                <option value="">Escolha…</option>
                {Object.entries(ACTION_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField
              label="Área de melhoria relacionada"
              htmlFor={`rc-area-${r.key}`}
            >
              <NativeSelect
                id={`rc-area-${r.key}`}
                className="w-full"
                value={r.improvementKey}
                onChange={(e) =>
                  onChange(
                    patch(items, r.key, { improvementKey: e.target.value }),
                  )
                }
              >
                <option value="">Nenhuma (ação independente)</option>
                {improvements.map((a, idx) => (
                  <option key={a.key} value={a.key}>
                    {a.competency.trim() || `Área de melhoria ${idx + 1}`}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            {r.actionType === 'FORMACAO' && (
              <FormField
                label="Formação do catálogo"
                htmlFor={`rc-trn-${r.key}`}
                hint="Recomenda a formação; não inscreve o colaborador."
              >
                <NativeSelect
                  id={`rc-trn-${r.key}`}
                  className="w-full"
                  value={r.trainingId ?? ''}
                  onChange={(e) =>
                    onChange(
                      patch(items, r.key, {
                        trainingId: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      }),
                    )
                  }
                >
                  <option value="">Sem formação associada</option>
                  {trainings.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.title}
                    </option>
                  ))}
                </NativeSelect>
              </FormField>
            )}
            <FormField label="Responsável" htmlFor={`rc-resp-${r.key}`}>
              <NativeSelect
                id={`rc-resp-${r.key}`}
                className="w-full"
                value={r.responsibleId ?? ''}
                onChange={(e) =>
                  onChange(
                    patch(items, r.key, {
                      responsibleId: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    }),
                  )
                }
              >
                <option value="">Por definir</option>
                {responsibles.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </NativeSelect>
            </FormField>
            <FormField label="Prazo" htmlFor={`rc-due-${r.key}`}>
              <Input
                id={`rc-due-${r.key}`}
                type="date"
                value={r.dueDate}
                onChange={(e) =>
                  onChange(patch(items, r.key, { dueDate: e.target.value }))
                }
              />
            </FormField>
            <FormField
              label="Prioridade (1 a 5) *"
              htmlFor={`rc-pri-${r.key}`}
              hint="1 = baixa, 5 = crítica"
            >
              <NativeSelect
                id={`rc-pri-${r.key}`}
                className="w-full"
                value={r.priority ?? ''}
                onChange={(e) =>
                  onChange(
                    patch(items, r.key, {
                      priority: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    }),
                  )
                }
              >
                <option value="">Escolha…</option>
                {Object.entries(RECOMMENDATION_PRIORITY_LABELS).map(
                  ([v, l]) => (
                    <option key={v} value={v}>
                      {v} — {l}
                    </option>
                  ),
                )}
              </NativeSelect>
            </FormField>
            <FormField
              label="Indicador de sucesso *"
              htmlFor={`rc-ind-${r.key}`}
              hint="Escolha da lista ou escreva a evidência ou métrica."
            >
              <Input
                id={`rc-ind-${r.key}`}
                list={`rc-ind-${r.key}-list`}
                maxLength={1000}
                placeholder="Escolha da lista ou escreva"
                value={r.successIndicator}
                onChange={(e) =>
                  onChange(
                    patch(items, r.key, { successIndicator: e.target.value }),
                  )
                }
              />
            </FormField>
            <datalist id={`rc-ind-${r.key}-list`}>
              {SUCCESS_INDICATOR_SUGGESTIONS.map((o) => (
                <option key={o} value={o} />
              ))}
            </datalist>
          </div>
          <FormField label="Comentários" htmlFor={`rc-not-${r.key}`}>
            <Textarea
              id={`rc-not-${r.key}`}
              rows={1}
              maxLength={2000}
              value={r.notes}
              onChange={(e) =>
                onChange(patch(items, r.key, { notes: e.target.value }))
              }
            />
          </FormField>
        </ItemCard>
      ))}
    </SectionShell>
  );
}
