// components/evaluation360/QuestionnaireDetailModal.tsx
// Detalhe de um questionário (docs/evaluation360.md §6): competências e
// perguntas. Em rascunho permite acrescentar/remover perguntas e publicar;
// publicado/arquivado fica só de leitura (o backend recusa alterações).

'use client';

import { useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Info,
  Megaphone,
  Target,
  Trash2,
  Users,
} from 'lucide-react';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { useToast } from '@/providers/ToastProvider';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { Skeleton } from '@/components/ui/Skeleton';
import type { QuestionnaireQuestionItem, QuestionnaireStatus } from './types';

export interface QuestionnaireDetailModalProps {
  questionnaireId: string;
  canManage: boolean;
  onClose: () => void;
}

// O formulário do avaliador (EvaluationFormTab) trata tudo o que não é
// OPEN_TEXT como pergunta de escala — por isso só se oferecem estes tipos.
const TYPE_LABEL: Record<string, string> = {
  LIKERT: 'Escala de concordância',
  FREQUENCY: 'Escala de frequência (Nunca … Sempre)',
  OPEN_TEXT: 'Resposta livre',
};
const TYPE_ITEMS = Object.entries(TYPE_LABEL).map(([value, label]) => ({
  value,
  label,
}));
const NO_COMPETENCY = 'NONE';

const STATUS_LABEL: Record<QuestionnaireStatus, string> = {
  DRAFT: 'Rascunho',
  PUBLISHED: 'Publicado',
  ARCHIVED: 'Arquivado',
};

// O GET devolve a competência aninhada (competency.name); o tipo partilhado
// guarda o nome à superfície. Aceita as duas formas.
interface DetailCompetency {
  competencyId: number;
  order: number;
  name?: string;
  competency?: { name?: string } | null;
}
interface Detail {
  id: string;
  name: string;
  code: string;
  description: string | null;
  instructions: string | null;
  scaleMin: number;
  scaleMax: number;
  status: QuestionnaireStatus;
  competencies: DetailCompetency[];
  questions: QuestionnaireQuestionItem[];
}

// Ilustração do cabeçalho: cinco silhuetas de equipa com a figura central em
// destaque e uma estrela por cima (desenho de public/images/questionario.jpeg).
function LeadershipIllustration() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 260 130"
      className="pointer-events-none absolute bottom-0 right-0 h-[88%] w-auto"
      preserveAspectRatio="xMaxYMax meet"
    >
      <defs>
        <radialGradient id="qd-glow" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="140" cy="60" r="70" fill="url(#qd-glow)" />
      <g fill="#2c63b0" opacity="0.75">
        <circle cx="40" cy="62" r="13" />
        <path d="M14 130c0-24 12-38 26-38s26 14 26 38z" />
        <circle cx="228" cy="62" r="13" />
        <path d="M202 130c0-24 12-38 26-38s26 14 26 38z" />
      </g>
      <g fill="#1b4a96" opacity="0.9">
        <circle cx="86" cy="50" r="15" />
        <path d="M56 130c0-28 14-44 30-44s30 16 30 44z" />
        <circle cx="190" cy="50" r="15" />
        <path d="M160 130c0-28 14-44 30-44s30 16 30 44z" />
      </g>
      <g fill="#0f2a5c">
        <circle cx="138" cy="38" r="18" />
        <path d="M98 130c0-34 18-54 40-54s40 20 40 54z" />
      </g>
      <path d="M138 78l-5 8 5 30 5-30z" fill="#1f5fb8" />
      <path
        d="M138 4l5.4 11 12.1 1.8-8.8 8.5 2.1 12-10.8-5.7-10.8 5.7 2.1-12-8.8-8.5 12.1-1.8z"
        fill="#f5b82e"
      />
    </svg>
  );
}

function InfoRow({
  icon: Icon,
  children,
}: {
  icon: typeof Megaphone;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4">
      <Icon
        size={22}
        strokeWidth={2}
        className="mt-0.5 shrink-0 text-brand-dark"
      />
      <div className="min-w-0 font-body text-[15px] leading-snug text-ink">
        {children}
      </div>
    </div>
  );
}

export function QuestionnaireDetailModal({
  questionnaireId,
  canManage,
  onClose,
}: QuestionnaireDetailModalProps) {
  const notify = useToast();
  const { data, isLoading } = useApiQuery<Detail>(
    queryKeys.evaluation360.questionnaireDetail(questionnaireId),
    `/evaluation360/questionnaires/${questionnaireId}`,
    { staleTime: STALE_TIME.DYNAMIC },
  );

  const [text, setText] = useState('');
  const [type, setType] = useState('FREQUENCY');
  const [competencyId, setCompetencyId] = useState(NO_COMPETENCY);
  const [isRequired, setIsRequired] = useState(true);
  const [error, setError] = useState('');

  const isDraft = data?.status === 'DRAFT';
  const competencyName = (c: DetailCompetency) =>
    c.competency?.name ?? c.name ?? `#${c.competencyId}`;
  const competencyLabelById = new Map(
    (data?.competencies ?? []).map((c) => [c.competencyId, competencyName(c)]),
  );
  const competencyItems = [
    { value: NO_COMPETENCY, label: 'Sem competência' },
    ...(data?.competencies ?? []).map((c) => ({
      value: String(c.competencyId),
      label: competencyName(c),
    })),
  ];

  const addQuestion = useApiMutation(
    (body: Record<string, unknown>) =>
      apiClient.post(
        `/evaluation360/questionnaires/${questionnaireId}/questions`,
        body,
      ),
    {
      invalidateKeys: [queryKeys.evaluation360.all],
      onSuccess: () => {
        setText('');
        setError('');
      },
      onError: () => setError('Não foi possível adicionar a pergunta.'),
    },
  );

  const removeQuestion = useApiMutation(
    (questionId: string) =>
      apiClient.delete(
        `/evaluation360/questionnaires/${questionnaireId}/questions/${questionId}`,
      ),
    {
      invalidateKeys: [queryKeys.evaluation360.all],
      onError: () =>
        notify({
          title: 'Não foi possível remover a pergunta',
          intent: 'danger',
        }),
    },
  );

  const publish = useApiMutation(
    () =>
      apiClient.post(
        `/evaluation360/questionnaires/${questionnaireId}/publish`,
      ),
    {
      invalidateKeys: [queryKeys.evaluation360.all],
      onSuccess: () => {
        notify({ title: 'Questionário publicado', intent: 'success' });
        onClose();
      },
      onError: () =>
        setError(
          'Não foi possível publicar. Confirma que tem pelo menos uma pergunta.',
        ),
    },
  );

  const handleAdd = () => {
    setError('');
    if (!text.trim()) return setError('Escreve o texto da pergunta.');
    addQuestion.mutate({
      text: text.trim(),
      type,
      isRequired,
      order: data?.questions.length ?? 0,
      ...(competencyId !== NO_COMPETENCY ? { competencyId } : {}),
      ...(type !== 'OPEN_TEXT'
        ? { scaleMin: data?.scaleMin, scaleMax: data?.scaleMax }
        : {}),
    });
  };

  return (
    <Modal open onOpenChange={(open) => !open && onClose()}>
      <ModalContent
        title={data?.name ?? 'Questionário'}
        description={
          data
            ? `${STATUS_LABEL[data.status]} · escala ${data.scaleMin}–${data.scaleMax}`
            : undefined
        }
        hideHeading
        className="max-w-[46.8rem] max-h-[90vh] overflow-y-auto overflow-x-hidden p-0"
      >
        <div
          className="relative min-h-[150px] overflow-hidden rounded-t-panel px-7 pb-7 pt-8"
          style={{
            background:
              'linear-gradient(100deg, #0f2a5c 0%, #1d4f9f 45%, #8cc4f2 100%)',
          }}
        >
          <h2 className="relative z-10 m-0 max-w-[55%] font-display text-[28px] font-extrabold leading-tight text-white">
            {data?.name ?? 'Questionário'}
          </h2>
          <LeadershipIllustration />
        </div>

        <div className="px-7 pb-7 pt-5">
          {isLoading || !data ? (
            <Skeleton rows={4} />
          ) : (
            <div className="space-y-5">
              <div className="space-y-3.5">
                <InfoRow icon={Megaphone}>
                  {STATUS_LABEL[data.status]} · escala {data.scaleMin}–
                  {data.scaleMax}
                </InfoRow>
                {data.description && (
                  <InfoRow icon={Users}>{data.description}</InfoRow>
                )}
                <InfoRow icon={CheckCircle2}>
                  Competências ({data.competencies.length})
                </InfoRow>
                <InfoRow icon={Target}>
                  {data.competencies.length > 0
                    ? data.competencies.map(competencyName).join(' · ')
                    : 'Nenhuma competência escolhida.'}
                </InfoRow>
              </div>

              <div className="border-t border-border pt-5">
                <div className="flex items-center gap-4">
                  <HelpCircle
                    size={26}
                    strokeWidth={2}
                    className="shrink-0 text-brand-dark"
                  />
                  <h3 className="m-0 font-display text-xl font-bold text-brand-dark">
                    Perguntas ({data.questions.length})
                  </h3>
                </div>
                {data.questions.length === 0 && (
                  <p className="mt-2 mb-0 font-body text-sm text-ink-muted">
                    Ainda sem perguntas.
                    {isDraft && canManage
                      ? ' Acrescenta pelo menos uma para poderes publicar.'
                      : ''}
                  </p>
                )}
                <ol className="mt-3 space-y-2.5 pl-0 list-none">
                  {data.questions.map((q, i) => (
                    <li
                      key={q.id}
                      className="flex items-start justify-between gap-3 rounded-[18px] bg-brand-soft px-4 py-3.5"
                    >
                      <div className="min-w-0">
                        <div className="font-body text-base font-bold text-brand-dark">
                          {i + 1}. {q.text}
                        </div>
                        <div className="mt-1 font-body text-sm text-ink-muted">
                          {TYPE_LABEL[q.type] ?? q.type}
                          {q.competencyId != null &&
                            ` · ${competencyLabelById.get(q.competencyId) ?? `Competência #${q.competencyId}`}`}
                          {q.isRequired ? ' · Obrigatória' : ' · Opcional'}
                        </div>
                      </div>
                      {isDraft && canManage && (
                        <Button
                          intent="ghostDanger"
                          size="sm"
                          aria-label="Remover pergunta"
                          onClick={() => removeQuestion.mutate(q.id)}
                        >
                          <Trash2 size={14} strokeWidth={1.75} />
                        </Button>
                      )}
                    </li>
                  ))}
                </ol>
              </div>

              {isDraft && canManage && (
                <div className="rounded-[18px] border border-border p-4 space-y-3">
                  <span className="font-body text-sm font-semibold text-brand-dark">
                    Nova pergunta
                  </span>
                  {error && (
                    <div className="flex items-center gap-2 p-3 bg-danger-subtle text-danger-ink rounded-card text-sm">
                      <AlertCircle size={16} strokeWidth={1.75} />
                      {error}
                    </div>
                  )}
                  <FormField label="Texto *" htmlFor="qd-text">
                    <Textarea
                      id="qd-text"
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      className="w-full"
                      rows={2}
                      placeholder="Ex.: Comunica as prioridades de forma clara à equipa."
                    />
                  </FormField>
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Tipo de resposta" htmlFor="qd-type">
                      <Select
                        items={TYPE_ITEMS}
                        value={type}
                        onValueChange={setType}
                        className="w-full"
                      />
                    </FormField>
                    <FormField label="Competência" htmlFor="qd-comp">
                      <Select
                        items={competencyItems}
                        value={competencyId}
                        onValueChange={setCompetencyId}
                        className="w-full"
                      />
                    </FormField>
                  </div>
                  <label className="flex items-center gap-2 font-body text-sm text-ink">
                    <Checkbox
                      checked={isRequired}
                      onChange={(e) => setIsRequired(e.target.checked)}
                    />
                    Resposta obrigatória
                  </label>
                  <Button
                    intent="secondary"
                    onClick={handleAdd}
                    loading={addQuestion.isPending}
                  >
                    Adicionar pergunta
                  </Button>
                </div>
              )}

              {!isDraft && (
                <div className="flex items-center gap-3 rounded-[18px] bg-brand-soft px-4 py-3 font-body text-sm text-ink">
                  <Info
                    size={18}
                    strokeWidth={2}
                    className="shrink-0 text-brand"
                  />
                  Só os questionários em rascunho podem ser alterados.
                </div>
              )}
            </div>
          )}

          <div className="mt-5 flex gap-3">
            <Button
              className="h-12 flex-1 justify-center rounded-pill bg-[#0F1F3D] text-base font-bold hover:bg-[#0F1F3D]/90 active:bg-[#0F1F3D]"
              onClick={onClose}
            >
              Fechar
            </Button>
            {isDraft && canManage && (
              <Button
                className="h-12 flex-1 justify-center rounded-pill text-base font-bold"
                onClick={() => publish.mutate(undefined)}
                loading={publish.isPending}
                disabled={(data?.questions.length ?? 0) === 0}
              >
                Publicar
              </Button>
            )}
          </div>
        </div>
      </ModalContent>
    </Modal>
  );
}
