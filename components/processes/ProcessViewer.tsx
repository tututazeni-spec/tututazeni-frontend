// components/processes/ProcessViewer.tsx
// Separador de detalhe de um processo (fluxo/detalhes/versões) + acções de
// ciclo de vida (submeter para revisão, aprovar/rejeitar, iniciar
// instância, nova versão). Dados próprios (useApiQuery/useApiMutation) +
// apresentação, mesmo padrão auto-contido usado em
// components/payslips/page.tsx. Extraído de app/(platform)/processes/page.tsx.

'use client';

import { useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Check,
  Clock,
  FileStack,
  Copy,
  FlaskConical,
  Layers,
  Paperclip,
  Pencil,
  Play,
  Plus,
  Send,
  Timer,
  X,
} from 'lucide-react';
import { useToast } from '@/providers/ToastProvider';
import { useApiMutation, useApiQuery } from '@/hooks/useApiQuery';
import { useConfirm } from '@/providers/ConfirmProvider';
import { apiClient } from '@/lib/apiClient';
import { queryKeys } from '@/lib/queryKeys';
import { STALE_TIME } from '@/lib/queryClient';
import { formatDate as fmtDate } from '@/lib/format';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  fmtDuration,
  moduleLabel,
  PROCESS_STATUS_MAP,
  RISK_LEVEL_MAP,
  STEP_TYPE_MAP,
} from './constants';
import { Metric } from '@/components/events/EventListCard';
import { PALETTE } from '@/components/onboarding/TemplateCard';
import { CreateProcessModal } from './CreateProcessModal';
import { ReasonDialog } from './ReasonDialog';
import { Skeleton } from './Skeleton';
import { StartProcessModal } from './StartProcessModal';
import { TemplateValidationModal } from './TemplateValidationModal';
import type { Process, TemplateVersionRow } from './types';

export interface ProcessViewerProps {
  processId: number;
  /** ADMIN/RH: pode editar, testar, duplicar e publicar modelos. */
  canEdit: boolean;
  /** ADMIN/RH/GESTOR: pode iniciar processos a partir do modelo. */
  canStart: boolean;
  onBack: () => void;
  onStartInstance: (instanceId: number) => void;
  onOpenTemplate: (processId: number) => void;
}

export function ProcessViewer({
  processId,
  canEdit,
  canStart,
  onBack,
  onStartInstance,
  onOpenTemplate,
}: ProcessViewerProps) {
  const notify = useToast();
  const [showStart, setShowStart] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showValidate, setShowValidate] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [activeTab, setActiveTab] = useState<'flow' | 'info' | 'history'>(
    'flow',
  );

  const {
    data: process,
    isLoading: loading,
    error,
  } = useApiQuery<Process>(
    queryKeys.processes.detail(processId),
    `/processes/${processId}`,
    { staleTime: STALE_TIME.SEMI_STATIC },
  );

  // As 4 acções abaixo partilhavam dois booleans (`submitting`/`actionLoading`)
  // e cada uma fazia setLoading/try/catch/finally + refetch manual. Migradas
  // para useApiMutation, que já invalida a query certa (`invalidateKeys`) em
  // vez de um refetch() explícito.
  const submitReview = useApiMutation(
    () => apiClient.patch(`/processes/${processId}/submit-review`, {}),
    {
      invalidateKeys: [queryKeys.processes.detail(processId)],
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );
  const submitting = submitReview.isPending;
  const handleSubmitReview = () => submitReview.mutate(undefined);

  const approval = useApiMutation(
    (vars: { action: 'approve' | 'reject'; comment?: string }) =>
      apiClient.patch(`/processes/${processId}/approval`, vars),
    {
      invalidateKeys: [queryKeys.processes.detail(processId)],
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );
  const handleApproval = (action: 'approve' | 'reject') => {
    if (action === 'reject') return setShowReject(true);
    approval.mutate({ action });
  };

  const duplicate = useApiMutation(
    () => apiClient.post<Process>(`/processes/${processId}/duplicate`, {}),
    {
      invalidateKeys: [queryKeys.processes.all],
      onSuccess: (copy) => {
        notify({ title: `Modelo duplicado (${copy.code})`, intent: 'success' });
        onOpenTemplate(copy.id);
      },
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );

  const { data: versions } = useApiQuery<TemplateVersionRow[]>(
    queryKeys.processes.versions(processId),
    `/processes/${processId}/versions`,
    { staleTime: STALE_TIME.SEMI_STATIC, enabled: canEdit || canStart },
  );

  const confirm = useConfirm();
  const newVersion = useApiMutation(
    () => apiClient.post(`/processes/${processId}/new-version`, {}),
    {
      invalidateKeys: [queryKeys.processes.detail(processId)],
      onError: (e) => notify({ title: e.message, intent: 'danger' }),
    },
  );
  const handleNewVersion = async () => {
    if (
      !(await confirm({
        title: 'Criar nova versão?',
        message: 'O processo voltará a DRAFT.',
        confirmLabel: 'Criar versão',
      }))
    )
      return;
    newVersion.mutate(undefined);
  };

  const actionLoading =
    approval.isPending || duplicate.isPending || newVersion.isPending;

  if (loading)
    return (
      <div className="p-4">
        <Skeleton rows={6} />
      </div>
    );
  if (error || !process)
    return (
      <div className="py-12 text-center">
        <p className="mb-4 font-body text-sm text-danger">
          {error?.message ?? 'Processo não encontrado'}
        </p>
        <Button intent="ghost" size="sm" onClick={onBack}>
          <ArrowLeft size={14} strokeWidth={1.75} />
          Voltar
        </Button>
      </div>
    );

  // Cor própria do processo (a mesma do cartão na lista de modelos)
  const palette = PALETTE[Math.abs(process.id) % PALETTE.length];

  return (
    <div>
      <Button intent="ghost" size="sm" onClick={onBack} className="mb-5">
        <ArrowLeft size={14} strokeWidth={1.75} />
        Voltar aos modelos
      </Button>

      {/* Header — desenho de "workshop de inovação.jpeg" (o mesmo do detalhe
          do evento): cartão claro com etiquetas, ícone + título, dados,
          responsável e botões de acção. */}
      <div className="relative mb-5 overflow-hidden rounded-[24px] border border-[#E3EAF4] bg-white shadow-[0_8px_24px_rgba(21,47,89,0.10)]">
        <div
          aria-hidden
          className="absolute right-0 top-0 hidden h-[58%] w-[34%] items-center justify-center text-white/70 sm:flex"
          style={{
            clipPath: 'polygon(16% 0, 100% 0, 100% 100%, 0 76%)',
            background: `linear-gradient(160deg, ${palette[0]} 0%, ${palette[2]} 100%)`,
          }}
        >
          <FileStack size={48} strokeWidth={1.25} />
        </div>

        <div className="relative space-y-5 p-6 sm:pr-[36%]">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge
              value={process.status}
              map={PROCESS_STATUS_MAP}
              variant="dot"
            />
            <StatusBadge value={process.riskLevel} map={RISK_LEVEL_MAP} />
          </div>

          <div className="flex items-center gap-4">
            <span
              aria-hidden
              className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full text-white"
              style={{ background: palette[3] }}
            >
              <FileStack size={28} strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <h1 className="break-words font-display text-[28px] font-bold leading-tight text-[#0F1F3D]">
                {process.title}
              </h1>
              <p className="mt-0.5 break-words font-mono text-base text-[#49658A]">
                {process.code} · v{process.version}
              </p>
            </div>
          </div>

          {process.description && (
            <p className="font-body text-sm leading-relaxed text-ink-muted">
              {process.description}
            </p>
          )}

          <div className="flex flex-wrap items-center gap-y-3 divide-x divide-[#E6ECF4]">
            {process.defaultSlaHours ? (
              <Metric icon={Clock}>SLA {process.defaultSlaHours}h</Metric>
            ) : null}
            {process.estimatedMinutes ? (
              <Metric icon={Timer}>
                {fmtDuration(process.estimatedMinutes)}
              </Metric>
            ) : null}
            <Metric icon={Layers}>
              {process._count.instances}{' '}
              {process._count.instances === 1 ? 'instância' : 'instâncias'}
            </Metric>
          </div>
          {process.department && (
            <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
              <Metric icon={Building2}>{process.department.name}</Metric>
            </div>
          )}

          {process.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {process.tags.map((t) => (
                <span
                  key={t}
                  className="rounded bg-surface-sunken px-2 py-0.5 font-body text-xs text-ink-muted"
                >
                  {t}
                </span>
              ))}
            </div>
          )}

          <div className="border-t border-[#E6ECF4] pt-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="inline-flex items-center gap-3 text-[15px] text-[#49658A]">
                <Avatar
                  name={process.owner.fullName}
                  url={process.owner.avatarUrl ?? undefined}
                  size="sm"
                />
                {process.owner.fullName}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {process.status === 'ACTIVE' && canStart && (
                  <Button
                    onClick={() => setShowStart(true)}
                    disabled={actionLoading}
                    size="sm"
                  >
                    <Play size={14} strokeWidth={1.75} />
                    Iniciar processo
                  </Button>
                )}
                {canEdit && (
                  <Button
                    intent="ghost"
                    size="sm"
                    onClick={() => setShowValidate(true)}
                  >
                    <FlaskConical size={14} strokeWidth={1.75} />
                    Testar fluxo
                  </Button>
                )}
                {canEdit && process.status === 'DRAFT' && (
                  <Button
                    intent="ghost"
                    size="sm"
                    onClick={() => setShowEdit(true)}
                  >
                    <Pencil size={14} strokeWidth={1.75} />
                    Editar rascunho
                  </Button>
                )}
                {canEdit && (
                  <Button
                    intent="ghost"
                    size="sm"
                    onClick={() => duplicate.mutate(undefined)}
                    disabled={actionLoading}
                  >
                    <Copy size={14} strokeWidth={1.75} />
                    Duplicar
                  </Button>
                )}
                {process.status === 'DRAFT' && canEdit && (
                  <Button
                    intent="warning"
                    onClick={handleSubmitReview}
                    disabled={submitting}
                    size="sm"
                  >
                    <Send size={14} strokeWidth={1.75} />
                    {submitting ? 'A submeter…' : 'Submeter para revisão'}
                  </Button>
                )}
                {process.status === 'IN_REVIEW' && canEdit && (
                  <div className="flex gap-2">
                    <Button
                      intent="success"
                      size="sm"
                      onClick={() => handleApproval('approve')}
                      disabled={actionLoading}
                    >
                      <Check size={14} strokeWidth={1.75} />
                      Aprovar
                    </Button>
                    <Button
                      intent="danger"
                      size="sm"
                      onClick={() => handleApproval('reject')}
                      disabled={actionLoading}
                    >
                      <X size={14} strokeWidth={1.75} />
                      Rejeitar
                    </Button>
                  </div>
                )}
                {process.status === 'ACTIVE' && canEdit && (
                  <Button
                    intent="secondary"
                    size="sm"
                    onClick={handleNewVersion}
                    disabled={actionLoading}
                  >
                    <Plus size={14} strokeWidth={1.75} />
                    Nova versão
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as typeof activeTab)}
      >
        <TabsList className="mb-5 w-fit">
          <TabsTrigger value="flow">Fluxo</TabsTrigger>
          <TabsTrigger value="info">Detalhes</TabsTrigger>
          <TabsTrigger value="history">Versões</TabsTrigger>
        </TabsList>

        {/* Flow tab */}
        <TabsContent value="flow">
          <div className="space-y-2">
            {process.steps.length === 0 && (
              <div className="rounded-card border border-dashed border-border-strong py-12 text-center font-body text-sm text-ink-faint">
                Sem etapas definidas. Edite o processo para adicionar etapas.
              </div>
            )}
            {process.steps.map((step, idx) => (
              <div key={step.id} className="flex items-start gap-3">
                {/* Connector */}
                <div className="flex flex-shrink-0 flex-col items-center pt-1">
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full border-2 font-body text-xs font-semibold ${
                      step.type === 'START'
                        ? 'border-success bg-success-subtle text-success-ink'
                        : step.type === 'END'
                          ? 'border-border-strong bg-surface-sunken text-ink-muted'
                          : 'border-info bg-info-subtle text-info-ink'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  {idx < process.steps.length - 1 && (
                    <div className="mt-1 h-4 w-0.5 bg-border" />
                  )}
                </div>

                {/* Step card */}
                <div className="relative mb-2 flex-1 overflow-hidden rounded-[24px] border border-[#E3EAF4] bg-white p-5 shadow-[0_8px_24px_rgba(21,47,89,0.10)]">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <span
                          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 font-body text-xs font-bold shadow-sm ring-1 ring-white/30 ${
                            STEP_TYPE_MAP[step.type]?.cls ?? 'bg-surface-sunken'
                          }`}
                          style={{ color: '#0F1F3D' }}
                        >
                          <span className="h-1.5 w-1.5 rounded-full bg-current" />
                          {STEP_TYPE_MAP[step.type]?.label ?? step.type}
                        </span>
                        <span className="font-body text-sm font-semibold text-[#0F1F3D]">
                          {step.title}
                        </span>
                      </div>
                      {step.description && (
                        <p className="mt-1 max-w-prose font-body text-[13px] leading-relaxed text-ink-muted">
                          {step.description}
                        </p>
                      )}
                      <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-[#E6ECF4] pt-3 font-body sm:grid-cols-3">
                        {step.responsible && (
                          <div className="min-w-0">
                            <dt className="text-[11px] text-[#49658A]">
                              Responsável
                            </dt>
                            <dd className="truncate text-sm font-semibold text-[#0F1F3D]">
                              {step.responsible.fullName}
                            </dd>
                          </div>
                        )}
                        {step.responsibleRole && (
                          <div className="min-w-0">
                            <dt className="text-[11px] text-[#49658A]">FunÃ§Ã£o</dt>
                            <dd className="truncate text-sm font-semibold text-[#0F1F3D]">
                              {step.responsibleRole}
                            </dd>
                          </div>
                        )}
                        {step.slaHours && (
                          <div className="min-w-0">
                            <dt className="text-[11px] text-[#49658A]">SLA</dt>
                            <dd className="truncate text-sm font-semibold text-[#0F1F3D]">
                              {step.slaHours}h
                            </dd>
                          </div>
                        )}
                        {step.reviewer && (
                          <div className="min-w-0">
                            <dt className="text-[11px] text-[#49658A]">
                              Revisor
                            </dt>
                            <dd className="truncate text-sm font-semibold text-[#0F1F3D]">
                              {step.reviewer.fullName}
                            </dd>
                          </div>
                        )}
                        {step.parallel && (
                          <div className="min-w-0">
                            <dt className="text-[11px] text-[#49658A]">
                              Execução
                            </dt>
                            <dd className="text-sm font-semibold text-[#0F1F3D]">
                              Paralela
                            </dd>
                          </div>
                        )}
                        {step.dependsOnOrders.length > 0 && (
                          <div className="min-w-0">
                            <dt className="text-[11px] text-[#49658A]">
                              Depende de
                            </dt>
                            <dd className="truncate text-sm font-semibold text-[#0F1F3D]">
                              {step.dependsOnOrders
                                .map((o) => o + 1)
                                .join(', ')}
                            </dd>
                          </div>
                        )}
                        {step.estimatedMinutes && (
                          <div className="min-w-0">
                            <dt className="text-[11px] text-[#49658A]">
                              Tempo est.
                            </dt>
                            <dd className="truncate text-sm font-semibold text-[#0F1F3D]">
                              {fmtDuration(step.estimatedMinutes)}
                            </dd>
                          </div>
                        )}
                      </dl>
                      {step.checklist.length > 0 && (
                        <div className="mt-3 space-y-1.5 border-t border-[#E6ECF4] pt-3">
                          {step.checklist.map((item, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 font-body text-[13px] text-[#0F1F3D]"
                            >
                              <div className="h-3.5 w-3.5 flex-shrink-0 rounded-control border border-[#49658A]" />
                              {item}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {step.requiresUpload && (
                      <span className="flex flex-shrink-0 items-center gap-1 rounded-control bg-warning-subtle px-2 py-0.5 font-body text-xs text-warning-ink">
                        <Paperclip size={12} strokeWidth={1.75} />
                        Upload obrigatório
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Info tab */}
        <TabsContent value="info">
          <div className="grid grid-cols-2 gap-5">
            <div className="relative overflow-hidden rounded-[24px] border border-[#E3EAF4] bg-white p-6 shadow-[0_8px_24px_rgba(21,47,89,0.10)]">
              <div className="pointer-events-none mb-4 cursor-default select-none font-display text-lg font-bold text-[#0F1F3D]">
                Objetivo e âmbito
              </div>
              {process.objective && (
                <div className="mb-3">
                  <div className="mb-1 font-body text-[11px] text-[#49658A]">
                    Objetivo
                  </div>
                  <p className="font-body text-sm font-semibold text-[#0F1F3D]">
                    {process.objective}
                  </p>
                </div>
              )}
              {process.scope && (
                <div>
                  <div className="mb-1 font-body text-[11px] text-[#49658A]">
                    Âmbito
                  </div>
                  <p className="font-body text-sm font-semibold text-[#0F1F3D]">
                    {process.scope}
                  </p>
                </div>
              )}
            </div>
            <div className="relative overflow-hidden rounded-[24px] border border-[#E3EAF4] bg-white p-6 shadow-[0_8px_24px_rgba(21,47,89,0.10)]">
              <div className="pointer-events-none mb-4 cursor-default select-none font-display text-lg font-bold text-[#0F1F3D]">
                Datas e SLA
              </div>
              {[
                ['Criado em', fmtDate(process.createdAt)],
                ['Actualizado', fmtDate(process.updatedAt)],
                ['Publicado', fmtDate(process.publishedAt)],
                ['Próxima revisão', fmtDate(process.nextReviewDate)],
                [
                  'SLA padrão',
                  process.defaultSlaHours ? `${process.defaultSlaHours}h` : '—',
                ],
                ['Duração estimada', fmtDuration(process.estimatedMinutes)],
                ['Entrada em vigor', fmtDate(process.effectiveFrom)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between border-b border-[#E6ECF4] py-2 last:border-0"
                >
                  <span className="font-body text-[11px] text-[#49658A]">
                    {label}
                  </span>
                  <span className="font-body text-sm font-semibold text-[#0F1F3D]">
                    {value}
                  </span>
                </div>
              ))}
            </div>
            <div className="col-span-2 relative overflow-hidden rounded-[24px] border border-[#E3EAF4] bg-white p-6 shadow-[0_8px_24px_rgba(21,47,89,0.10)]">
              <div className="pointer-events-none mb-4 cursor-default select-none font-display text-lg font-bold text-[#0F1F3D]">
                Configuração do modelo
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {(
                  [
                    [
                      'Módulos envolvidos',
                      process.involvedModules.map(moduleLabel).join(', '),
                    ],
                    ['Confidencialidade', process.confidentiality],
                    [
                      'Regras de acesso',
                      process.accessRoles.join(', ') || 'Todas as funções',
                    ],
                    ['Política de revisão', process.reviewPolicy],
                    [
                      'Documentos necessários',
                      process.requiredDocuments.join(' · '),
                    ],
                    ['Regras de aprovação', process.approvalRules],
                    ['Condições para iniciar', process.startConditions],
                    ['Condições para concluir', process.completionConditions],
                  ] as Array<[string, string | null]>
                ).map(([label, value]) => (
                  <div key={label}>
                    <div className="font-body text-[11px] text-[#49658A]">
                      {label}
                    </div>
                    <p className="font-body text-sm font-semibold text-[#0F1F3D]">
                      {value || '—'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* History tab */}
        <TabsContent value="history">
          <div className="overflow-hidden rounded-[24px] border border-[#E3EAF4] bg-white shadow-[0_8px_24px_rgba(21,47,89,0.10)]">
            <div className="pointer-events-none cursor-default select-none border-b border-[#E6ECF4] px-5 py-4 font-display text-lg font-bold text-[#0F1F3D]">
              Histórico de versões
            </div>
            {(
              versions ?? [
                {
                  version: process.version,
                  current: true,
                  status: process.status,
                  createdAt: process.updatedAt,
                },
              ]
            ).map((v) => (
              <div
                key={`${v.version}-${v.current}`}
                className="relative flex flex-wrap items-center justify-between gap-3 border-b border-[#E6ECF4] bg-white px-5 py-3.5 last:border-0"
              >
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-sm font-bold text-[#0F1F3D]">
                    v{v.version}
                  </span>
                  {v.current && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-subtle px-2.5 py-0.5 font-body text-xs font-bold text-primary">
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      Actual
                    </span>
                  )}
                </div>
                <div className="text-right font-body">
                  <div className="text-[11px] text-[#49658A]">
                    {v.current ? 'Publicada/actualizada em' : 'Guardada em'}
                  </div>
                  <div className="text-sm font-semibold text-[#0F1F3D]">
                    {fmtDate(v.createdAt)}
                  </div>
                </div>
              </div>
            ))}
            <div className="border-t border-[#E6ECF4] bg-[#F7FAFE] px-5 py-3 font-body text-[13px] leading-relaxed text-[#49658A]">
              Cada processo em execução mantém a versão do modelo com que foi
              iniciado.
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {showStart && (
        <StartProcessModal
          templateId={processId}
          onClose={() => setShowStart(false)}
          onCreated={(id) => {
            setShowStart(false);
            onStartInstance(id);
          }}
        />
      )}
      {showEdit && (
        <CreateProcessModal
          initial={process}
          onClose={() => setShowEdit(false)}
        />
      )}
      {showValidate && (
        <TemplateValidationModal
          processId={processId}
          onClose={() => setShowValidate(false)}
        />
      )}
      {showReject && (
        <ReasonDialog
          title="Rejeitar modelo?"
          description="O modelo volta a rascunho com a justificação registada."
          confirmLabel="Rejeitar"
          destructive
          loading={approval.isPending}
          onClose={() => setShowReject(false)}
          onConfirm={(comment) => {
            approval.mutate({ action: 'reject', comment });
            setShowReject(false);
          }}
        />
      )}
    </div>
  );
}
