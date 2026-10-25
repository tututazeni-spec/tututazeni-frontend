// components/departments/PositionRequirementsPanel.tsx
// Requisitos de um cargo em seis categorias: habilitações académicas,
// experiência, competências técnicas, competências comportamentais, idiomas e
// certificações. As quatro categorias estruturadas vivem em
// /career/positions/:id/requirements; as competências reutilizam
// /competencies/map/position (PositionCompetency). Usado pelo
// PositionDetailModal. Spec: docs/superpowers/specs/2026-10-12-position-requirements-design.md

'use client';

import { useState } from 'react';
import { GraduationCap, Plus, Trash2 } from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useToast } from '@/providers/ToastProvider';
import { useConfirm } from '@/providers/ConfirmProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  ACADEMIC_LEVEL_LABEL,
  CEFR_LEVELS,
  type PositionRequirement,
  type RequirementCategory,
} from '@/components/career/types';
import type { PositionDetail } from './types';

type SectionKey = RequirementCategory | 'HARD_SKILL' | 'SOFT_SKILL';

const SECTIONS: Array<{ key: SectionKey; title: string }> = [
  { key: 'ACADEMIC', title: 'Habilitações académicas' },
  { key: 'EXPERIENCE', title: 'Experiência profissional' },
  { key: 'HARD_SKILL', title: 'Competências técnicas' },
  { key: 'SOFT_SKILL', title: 'Competências comportamentais' },
  { key: 'LANGUAGE', title: 'Idiomas' },
  { key: 'CERTIFICATION', title: 'Certificações e licenças' },
];

const ACADEMIC_ITEMS = Object.entries(ACADEMIC_LEVEL_LABEL).map(
  ([value, label]) => ({ value, label }),
);
const CEFR_ITEMS = CEFR_LEVELS.map((l) => ({ value: l, label: l }));
const SCALE_ITEMS = [1, 2, 3, 4, 5].map((n) => ({
  value: String(n),
  label: `Nível ${n}`,
}));
const PRIORITY_ITEMS = [
  { value: 'MANDATORY', label: 'Obrigatória' },
  { value: 'OPTIONAL', label: 'Diferencial' },
];

interface CompetencyOption {
  id: number;
  name: string;
}

interface FormState {
  title: string;
  level: string;
  minYears: string;
  mandatory: boolean;
  competencyId: string;
  requiredLevel: string;
  priority: string;
}

const EMPTY_FORM: FormState = {
  title: '',
  level: '',
  minYears: '',
  mandatory: true,
  competencyId: '',
  requiredLevel: '3',
  priority: 'MANDATORY',
};

export interface PositionRequirementsPanelProps {
  positionId: number;
  competencies: PositionDetail['competencies'];
  canManage: boolean;
}

export function PositionRequirementsPanel({
  positionId,
  competencies,
  canManage,
}: PositionRequirementsPanelProps) {
  const notify = useToast();
  const confirm = useConfirm();
  const [adding, setAdding] = useState<SectionKey | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const { data: requirements = [] } = useApiQuery<PositionRequirement[]>(
    queryKeys.career.positionRequirements(positionId),
    `/career/positions/${positionId}/requirements`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const isCompetencySection =
    adding === 'HARD_SKILL' || adding === 'SOFT_SKILL';
  const { data: competencyOptions } = useApiQuery<{ data: CompetencyOption[] }>(
    [...queryKeys.career.all, 'competency-options', adding ?? ''],
    '/competencies',
    {
      params: { category: adding ?? '', limit: 100 },
      enabled: isCompetencySection,
      staleTime: STALE_TIME.STATIC,
    },
  );

  const invalidateKeys = [
    queryKeys.career.positionRequirements(positionId),
    queryKeys.departments.positionDetail(positionId),
  ];
  const close = () => {
    setAdding(null);
    setForm(EMPTY_FORM);
  };
  const onError = (e: Error) => notify({ title: e.message, intent: 'danger' });

  const createRequirement = useApiMutation(
    (body: Record<string, unknown>) =>
      apiClient.post(`/career/positions/${positionId}/requirements`, body),
    { invalidateKeys, onSuccess: close, onError },
  );
  const deleteRequirement = useApiMutation(
    (id: number) =>
      apiClient.delete(`/career/positions/${positionId}/requirements/${id}`),
    { invalidateKeys, onError },
  );
  const mapCompetency = useApiMutation(
    (body: Record<string, unknown>) =>
      apiClient.post('/competencies/map/position', body),
    { invalidateKeys, onSuccess: close, onError },
  );
  const unmapCompetency = useApiMutation(
    (competencyId: number) =>
      apiClient.delete(
        `/competencies/map/position/${positionId}/${competencyId}`,
      ),
    { invalidateKeys, onError },
  );

  const submit = () => {
    if (!adding) return;
    if (adding === 'HARD_SKILL' || adding === 'SOFT_SKILL') {
      if (!form.competencyId) return;
      mapCompetency.mutate({
        positionId,
        competencyId: Number(form.competencyId),
        requiredLevel: Number(form.requiredLevel),
        priority: form.priority,
      });
      return;
    }
    if (form.title.trim().length < 2) return;
    createRequirement.mutate({
      category: adding,
      title: form.title.trim(),
      mandatory: form.mandatory,
      ...(form.level ? { level: form.level } : {}),
      ...(adding === 'EXPERIENCE'
        ? { minYears: Number(form.minYears) || 0 }
        : {}),
    });
  };

  const remove = async (label: string, run: () => void) => {
    const ok = await confirm({
      title: 'Remover requisito',
      message: `Tem a certeza que quer remover "${label}" deste cargo?`,
      confirmLabel: 'Remover',
      destructive: true,
    });
    if (ok) run();
  };

  const levelText = (r: PositionRequirement) =>
    r.category === 'ACADEMIC' && r.level
      ? (ACADEMIC_LEVEL_LABEL[r.level] ?? r.level)
      : r.category === 'EXPERIENCE' && r.minYears !== null
        ? `${r.minYears} ${r.minYears === 1 ? 'ano' : 'anos'}`
        : r.level;

  const rowClass =
    'flex items-center justify-between gap-3 rounded-card border border-brand-line bg-[#E8F0FE]/50 px-3 py-2';
  const trashClass =
    'inline-flex h-7 w-7 items-center justify-center rounded-control text-brand/60 hover:bg-white hover:text-[#DC2626] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0D6EFD]/50';

  return (
    <div className="overflow-hidden rounded-[18px] border border-brand-line bg-white shadow-[0_8px_30px_rgba(11,61,145,0.10)]">
      <div className="flex items-center gap-2.5 bg-gradient-to-br from-[#0B3D91] to-[#06275F] px-5 py-3.5 text-white">
        <GraduationCap size={18} strokeWidth={1.75} />
        <h3 className="font-body text-sm font-semibold uppercase tracking-wider">
          Requisitos do cargo
        </h3>
      </div>

      <div className="space-y-5 p-5">
        {SECTIONS.map(({ key, title }) => {
          const isComp = key === 'HARD_SKILL' || key === 'SOFT_SKILL';
          const reqRows = isComp
            ? []
            : requirements.filter((r) => r.category === key);
          const compRows = isComp
            ? competencies.filter((c) => c.competency.category === key)
            : [];
          const empty = isComp ? compRows.length === 0 : reqRows.length === 0;
          return (
            <section key={key}>
              <div className="mb-2 flex items-center justify-between">
                <h4 className="font-body text-xs font-semibold uppercase tracking-wide text-brand/70">
                  {title}
                </h4>
                {canManage && adding !== key && (
                  <Button
                    size="sm"
                    intent="ghost"
                    onClick={() => {
                      setForm(EMPTY_FORM);
                      setAdding(key);
                    }}
                  >
                    <Plus size={13} strokeWidth={1.75} /> Adicionar
                  </Button>
                )}
              </div>

              <div className="space-y-1.5">
                {empty && adding !== key && (
                  <p className="font-body text-xs text-brand/50">
                    Sem requisitos definidos.
                  </p>
                )}
                {reqRows.map((r) => (
                  <div key={r.id} className={rowClass}>
                    <div className="min-w-0">
                      <div className="truncate font-body text-sm font-medium text-brand">
                        {r.title}
                      </div>
                      {levelText(r) && (
                        <div className="font-body text-xs text-brand/60">
                          {levelText(r)}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge intent={r.mandatory ? 'info' : 'neutral'}>
                        {r.mandatory ? 'Obrigatório' : 'Diferencial'}
                      </Badge>
                      {canManage && (
                        <button
                          type="button"
                          aria-label={`Remover ${r.title}`}
                          className={trashClass}
                          onClick={() =>
                            remove(r.title, () =>
                              deleteRequirement.mutate(r.id),
                            )
                          }
                        >
                          <Trash2 size={14} strokeWidth={1.75} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {compRows.map((c) => (
                  <div key={c.competency.id} className={rowClass}>
                    <div className="min-w-0">
                      <div className="truncate font-body text-sm font-medium text-brand">
                        {c.competency.name}
                      </div>
                      {c.requiredLevel !== undefined && (
                        <div className="font-body text-xs text-brand/60">
                          Nível {c.requiredLevel}
                        </div>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge
                        intent={c.priority === 'OPTIONAL' ? 'neutral' : 'info'}
                      >
                        {c.priority === 'OPTIONAL'
                          ? 'Diferencial'
                          : 'Obrigatória'}
                      </Badge>
                      {canManage && (
                        <button
                          type="button"
                          aria-label={`Remover ${c.competency.name}`}
                          className={trashClass}
                          onClick={() =>
                            remove(c.competency.name, () =>
                              unmapCompetency.mutate(c.competency.id),
                            )
                          }
                        >
                          <Trash2 size={14} strokeWidth={1.75} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {canManage && adding === key && (
                <div className="mt-2 space-y-2 rounded-card border border-brand-line p-3">
                  {isComp ? (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <Select
                        items={(competencyOptions?.data ?? []).map((o) => ({
                          value: String(o.id),
                          label: o.name,
                        }))}
                        value={form.competencyId}
                        onValueChange={(v) =>
                          setForm((f) => ({ ...f, competencyId: v }))
                        }
                        placeholder="Competência"
                      />
                      <Select
                        items={SCALE_ITEMS}
                        value={form.requiredLevel}
                        onValueChange={(v) =>
                          setForm((f) => ({ ...f, requiredLevel: v }))
                        }
                        placeholder="Nível"
                      />
                      <Select
                        items={PRIORITY_ITEMS}
                        value={form.priority}
                        onValueChange={(v) =>
                          setForm((f) => ({ ...f, priority: v }))
                        }
                        placeholder="Prioridade"
                      />
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      <Input
                        value={form.title}
                        onChange={(e) =>
                          setForm((f) => ({ ...f, title: e.target.value }))
                        }
                        placeholder={
                          key === 'ACADEMIC'
                            ? 'Curso exigido (ex.: Informática) — é comparado com o curso do colaborador'
                            : key === 'EXPERIENCE'
                              ? 'Descrição (ex.: Desenvolvimento web) — só informativa'
                              : key === 'LANGUAGE'
                                ? 'Idioma (ex.: Inglês)'
                                : 'Certificação (ex.: AWS Cloud)'
                        }
                        className="w-full"
                      />
                      {key === 'ACADEMIC' && (
                        <Select
                          items={ACADEMIC_ITEMS}
                          value={form.level}
                          onValueChange={(v) =>
                            setForm((f) => ({ ...f, level: v }))
                          }
                          placeholder="Grau mínimo"
                        />
                      )}
                      {key === 'LANGUAGE' && (
                        <Select
                          items={CEFR_ITEMS}
                          value={form.level}
                          onValueChange={(v) =>
                            setForm((f) => ({ ...f, level: v }))
                          }
                          placeholder="Nível (A1–C2)"
                        />
                      )}
                      {key === 'EXPERIENCE' && (
                        <Input
                          type="number"
                          min={0}
                          step="0.5"
                          value={form.minYears}
                          onChange={(e) =>
                            setForm((f) => ({ ...f, minYears: e.target.value }))
                          }
                          placeholder="Anos mínimos"
                          className="w-full"
                        />
                      )}
                    </div>
                  )}
                  {!isComp && (
                    <label className="flex items-center gap-2 font-body text-xs text-brand/70">
                      <input
                        type="checkbox"
                        checked={form.mandatory}
                        onChange={(e) =>
                          setForm((f) => ({
                            ...f,
                            mandatory: e.target.checked,
                          }))
                        }
                        className="h-4 w-4 rounded border-border-strong accent-primary"
                      />
                      Obrigatório (desmarcar = diferencial)
                    </label>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button size="sm" intent="ghost" onClick={close}>
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={submit}
                      loading={
                        createRequirement.isPending || mapCompetency.isPending
                      }
                    >
                      Guardar
                    </Button>
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
