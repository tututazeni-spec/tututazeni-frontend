// components/processes/StepInspector.tsx
// Propriedades configuráveis de uma etapa do fluxo (docs/Modulo_Processes.md §8):
// nome, tipo, responsável, prazo/calendário, condições de entrada e para
// avançar, dados obrigatórios, aprovações, acções de sucesso/falha, regras de
// devolução e política de escalonamento — mais a configuração de cada tipo.

'use client';

import { useState } from 'react';
import { Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { FormField } from '@/components/ui/FormField';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { ActionListEditor, RecipientPicker } from './ActionListEditor';
import { ConditionEditor, type FieldOption } from './ConditionEditor';
import { SOURCE_MODULES } from './StartProcessModal';
import { UserPicker } from './UserPicker';
import { BLOCKS, BLOCK_BY_TYPE, type FlowNode } from './workflow-model';
import type { ApprovalMode, RejectionRule, StepType } from './types';

export interface StepInspectorProps {
  node: FlowNode;
  nodes: FlowNode[];
  readOnly: boolean;
  onChange: (patch: Partial<FlowNode>) => void;
  onToggleDep: (depKey: string) => void;
  onDelete: () => void;
  onClose: () => void;
}

type Tab = 'general' | 'type' | 'conditions' | 'actions' | 'rules';

const MODE_ITEMS: Array<{ value: ApprovalMode; label: string }> = [
  { value: 'SEQUENTIAL', label: 'Sequencial (um a seguir ao outro)' },
  { value: 'PARALLEL', label: 'Em paralelo (todos têm de aprovar)' },
  { value: 'ANY', label: 'Qualquer um (a primeira decisão basta)' },
];

const REJECT_ITEMS: Array<{ value: RejectionRule; label: string }> = [
  { value: 'HOLD', label: 'Suspender o processo' },
  { value: 'CANCEL', label: 'Cancelar o processo' },
  { value: 'RETURN', label: 'Devolver à etapa anterior' },
  { value: 'BRANCH', label: 'Seguir o ramo de rejeição' },
];

const num = (v: string, set: (s: string) => void) => (e: React.ChangeEvent<HTMLInputElement>) =>
  set(e.target.value.replace(/[^\d.]/g, ''));

export function StepInspector({
  node,
  nodes,
  readOnly,
  onChange,
  onToggleDep,
  onDelete,
  onClose,
}: StepInspectorProps) {
  const [tab, setTab] = useState<Tab>('general');
  const others = nodes.filter((n) => n.key !== node.key);

  const baseFields: FieldOption[] = [
    { value: 'priority', label: 'Prioridade do processo' },
    { value: 'sourceModule', label: 'Módulo de origem' },
    { value: 'target.departmentId', label: 'Departamento do colaborador' },
    ...others.flatMap((o) => [
      { value: `step:${o.key}.result`, label: `Resultado de «${o.title}»` },
      { value: `step:${o.key}.status`, label: `Estado de «${o.title}»` },
    ]),
  ];

  const isApproval = node.type === 'REVIEW';
  const hasTypeTab = ['TIMER', 'WAIT_EVENT', 'NOTIFICATION', 'INTEGRATION', 'AUTO_ACTION', 'DOCUMENT', 'REVIEW', 'FORM'].includes(node.type);
  const tabs: Array<{ id: Tab; label: string }> = [
    { id: 'general', label: 'Geral' },
    ...(hasTypeTab ? [{ id: 'type' as Tab, label: isApproval ? 'Aprovação' : 'Configuração' }] : []),
    { id: 'conditions', label: 'Condições' },
    { id: 'actions', label: 'Acções' },
    { id: 'rules', label: 'Prazos e regras' },
  ];
  const meta = BLOCK_BY_TYPE[node.type];

  return (
    <aside className="flex h-full w-[360px] shrink-0 flex-col rounded-card border border-border bg-surface">
      <div className="flex items-start justify-between gap-2 border-b border-border p-3">
        <div className="min-w-0">
          <div className="font-body text-xs uppercase tracking-wide text-ink-faint">{meta.label}</div>
          <div className="truncate font-body text-sm font-medium text-ink">{node.title || 'Sem nome'}</div>
        </div>
        <button type="button" onClick={onClose} className="text-ink-faint hover:text-ink" aria-label="Fechar">
          <X size={16} strokeWidth={1.75} />
        </button>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-border px-3 py-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`rounded-control px-2.5 py-1 font-body text-xs font-medium ${
              tab === t.id ? 'bg-primary-subtle text-primary' : 'text-ink-muted hover:bg-surface-sunken'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto p-3">
        {tab === 'general' && (
          <>
            <FormField label="Nome *" htmlFor="si-title">
              <Input id="si-title" value={node.title} disabled={readOnly} onChange={(e) => onChange({ title: e.target.value })} />
            </FormField>
            <FormField label="Descrição" htmlFor="si-desc">
              <Textarea id="si-desc" rows={2} value={node.description} disabled={readOnly} onChange={(e) => onChange({ description: e.target.value })} className="w-full" />
            </FormField>
            <FormField label="Tipo de etapa" htmlFor="si-type">
              <Select
                items={BLOCKS.map((b) => ({ value: b.type, label: b.label }))}
                value={node.type}
                onValueChange={(v) => onChange({ type: v as StepType })}
                disabled={readOnly}
                className="w-full"
              />
            </FormField>
            <FormField label="Responsável" htmlFor="si-resp" hint="Pessoa concreta ou, em baixo, a função (atribuição automática à pessoa com menos tarefas).">
              <UserPicker value={node.responsibleId} onChange={(v) => onChange({ responsibleId: v })} className="w-full" />
            </FormField>
            <FormField label="Função responsável" htmlFor="si-role">
              <Input id="si-role" value={node.responsibleRole} disabled={readOnly} onChange={(e) => onChange({ responsibleRole: e.target.value })} placeholder="Ex.: RH" />
            </FormField>
            <FormField label="Revisor" htmlFor="si-rev">
              <UserPicker value={node.reviewerId} onChange={(v) => onChange({ reviewerId: v })} className="w-full" />
            </FormField>
            <div>
              <div className="mb-1 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
                Depende de (entradas)
              </div>
              {others.length === 0 && <p className="font-body text-xs text-ink-faint">Sem outras etapas.</p>}
              <ul className="space-y-1">
                {others.map((o) => (
                  <li key={o.key}>
                    <label className="flex items-center gap-2 font-body text-sm text-ink">
                      <input
                        type="checkbox"
                        checked={node.deps.includes(o.key)}
                        disabled={readOnly}
                        onChange={() => onToggleDep(o.key)}
                      />
                      {o.title}
                    </label>
                  </li>
                ))}
              </ul>
              <p className="mt-1 font-body text-xs text-ink-faint">
                Sem entradas, a etapa arranca logo com o processo. Também pode ligar blocos arrastando no canvas.
              </p>
            </div>
          </>
        )}

        {tab === 'type' && (
          <>
            {node.type === 'TIMER' && (
              <FormField label="Duração (horas) *" htmlFor="si-delay" hint="O fluxo continua quando o tempo passar (verificado de 5 em 5 minutos).">
                <Input id="si-delay" value={node.delayHours} disabled={readOnly} onChange={num(node.delayHours, (v) => onChange({ delayHours: v }))} />
              </FormField>
            )}
            {node.type === 'WAIT_EVENT' && (
              <FormField label="Nome do evento *" htmlFor="si-event" hint="Conclui quando o evento for entregue ao processo (POST /processes/instances/:id/events).">
                <Input id="si-event" value={node.eventName} disabled={readOnly} onChange={(e) => onChange({ eventName: e.target.value })} placeholder="ex.: documentos_recebidos" />
              </FormField>
            )}
            {node.type === 'NOTIFICATION' && (
              <>
                <div>
                  <div className="mb-1 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">Destinatários *</div>
                  <RecipientPicker value={node.recipients} onChange={(v) => onChange({ recipients: v })} disabled={readOnly} />
                </div>
                <FormField label="Mensagem *" htmlFor="si-msg">
                  <Textarea id="si-msg" rows={3} value={node.message} disabled={readOnly} onChange={(e) => onChange({ message: e.target.value })} className="w-full" />
                </FormField>
              </>
            )}
            {node.type === 'INTEGRATION' && (
              <>
                <FormField label="Módulo de destino *" htmlFor="si-mod" hint="As regras de Automações que escutam este pedido fazem o trabalho no módulo.">
                  <Select
                    items={SOURCE_MODULES.map((m) => ({ value: m, label: m }))}
                    value={node.integrationModule}
                    onValueChange={(v) => onChange({ integrationModule: v })}
                    disabled={readOnly}
                    className="w-full"
                  />
                </FormField>
                <FormField label="Evento / operação" htmlFor="si-ievent">
                  <Input id="si-ievent" value={node.integrationEvent} disabled={readOnly} onChange={(e) => onChange({ integrationEvent: e.target.value })} />
                </FormField>
              </>
            )}
            {node.type === 'AUTO_ACTION' && (
              <ActionListEditor
                value={node.autoActions}
                onChange={(v) => onChange({ autoActions: v })}
                disabled={readOnly}
                emptyHint="Adicione as acções que o sistema executa nesta etapa."
              />
            )}
            {node.type === 'DOCUMENT' && (
              <FormField label="Modelo do documento" htmlFor="si-tpl" hint="A etapa fica pendente até o responsável anexar o documento gerado.">
                <Input id="si-tpl" value={node.template} disabled={readOnly} onChange={(e) => onChange({ template: e.target.value })} />
              </FormField>
            )}
            {node.type === 'FORM' && (
              <FormField label="Dados obrigatórios" htmlFor="si-req" hint="Campos que têm de vir preenchidos, separados por vírgula.">
                <Input id="si-req" value={node.requiredData} disabled={readOnly} onChange={(e) => onChange({ requiredData: e.target.value })} placeholder="nome, nif, data_inicio" />
              </FormField>
            )}
            {isApproval && (
              <>
                <div>
                  <div className="mb-1 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
                    Aprovadores (por ordem)
                  </div>
                  <ul className="space-y-1.5">
                    {node.approverIds.map((id, i) => (
                      <li key={`${id}-${i}`} className="flex items-center gap-2">
                        <UserPicker
                          value={id}
                          onChange={(v) =>
                            onChange({ approverIds: node.approverIds.map((x, idx) => (idx === i ? v : x)) })
                          }
                          className="flex-1"
                        />
                        {!readOnly && (
                          <button
                            type="button"
                            className="text-ink-faint hover:text-danger"
                            onClick={() => onChange({ approverIds: node.approverIds.filter((_, idx) => idx !== i) })}
                            aria-label="Remover aprovador"
                          >
                            <Trash2 size={14} strokeWidth={1.75} />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                  {!readOnly && (
                    <Button intent="ghost" size="sm" className="mt-1.5" onClick={() => onChange({ approverIds: [...node.approverIds, ''] })}>
                      Adicionar aprovador
                    </Button>
                  )}
                  <p className="mt-1 font-body text-xs text-ink-faint">
                    Sem aprovadores, decide o revisor/responsável da etapa (ou quem tiver a função).
                  </p>
                </div>
                <FormField label="Modo de aprovação" htmlFor="si-mode">
                  <Select items={MODE_ITEMS} value={node.approvalMode} onValueChange={(v) => onChange({ approvalMode: v as ApprovalMode })} disabled={readOnly} className="w-full" />
                </FormField>
                <FormField label="Se for rejeitada" htmlFor="si-rej">
                  <Select items={REJECT_ITEMS} value={node.onReject} onValueChange={(v) => onChange({ onReject: v as RejectionRule })} disabled={readOnly} className="w-full" />
                </FormField>
                {node.onReject === 'BRANCH' && (
                  <p className="font-body text-xs text-ink-faint">
                    Crie uma etapa seguinte com a condição de entrada «Resultado desta aprovação é igual a REJECTED».
                  </p>
                )}
                <label className="flex items-center gap-2 font-body text-sm text-ink">
                  <input type="checkbox" checked={node.allowDelegation} disabled={readOnly} onChange={(e) => onChange({ allowDelegation: e.target.checked })} />
                  Os aprovadores podem delegar
                </label>
              </>
            )}
          </>
        )}

        {tab === 'conditions' && (
          <>
            <div>
              <div className="mb-1 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
                Condições de entrada
              </div>
              <p className="mb-2 font-body text-xs text-ink-faint">
                A etapa só é executada se forem verdadeiras; caso contrário é ignorada — é assim que se criam ramos.
              </p>
              <ConditionEditor value={node.entry} onChange={(v) => onChange({ entry: v })} fields={baseFields} allowFormFields disabled={readOnly} emptyHint="Executa sempre." />
            </div>
            <div>
              <div className="mb-1 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">
                Condições para avançar
              </div>
              <p className="mb-2 font-body text-xs text-ink-faint">
                Têm de ser verdadeiras para concluir a etapa (avaliadas sobre os dados submetidos).
              </p>
              <ConditionEditor value={node.exit} onChange={(v) => onChange({ exit: v })} fields={[...baseFields, { value: `step:${node.key}.result`, label: 'Resultado desta etapa' }]} allowFormFields disabled={readOnly} emptyHint="Sem condições." />
              {node.legacyExit && (
                <p className="mt-1 font-body text-xs text-warning-ink">
                  Existe uma condição em formato antigo, que é preservada mas não avaliada.
                </p>
              )}
            </div>
            <FormField label="Dados obrigatórios" htmlFor="si-req2" hint="Campos do formulário que têm de estar preenchidos, separados por vírgula.">
              <Input id="si-req2" value={node.requiredData} disabled={readOnly} onChange={(e) => onChange({ requiredData: e.target.value })} />
            </FormField>
          </>
        )}

        {tab === 'actions' && (
          <>
            <div>
              <div className="mb-1 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">Em caso de sucesso</div>
              <ActionListEditor value={node.successActions} onChange={(v) => onChange({ successActions: v })} disabled={readOnly} />
            </div>
            <div>
              <div className="mb-1 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">Em caso de falha / rejeição</div>
              <ActionListEditor value={node.failureActions} onChange={(v) => onChange({ failureActions: v })} disabled={readOnly} />
            </div>
          </>
        )}

        {tab === 'rules' && (
          <>
            <FormField label="Prazo (horas desde o início)" htmlFor="si-sla">
              <Input id="si-sla" value={node.slaHours} disabled={readOnly} onChange={num(node.slaHours, (v) => onChange({ slaHours: v }))} />
            </FormField>
            <FormField label="Calendário aplicável" htmlFor="si-cal">
              <Select
                items={[
                  { value: 'CALENDAR', label: 'Dias corridos' },
                  { value: 'BUSINESS_DAYS', label: 'Dias úteis (sem fins de semana)' },
                ]}
                value={node.calendarMode}
                onValueChange={(v) => onChange({ calendarMode: v as FlowNode['calendarMode'] })}
                disabled={readOnly}
                className="w-full"
              />
            </FormField>
            <FormField label="Máx. de devoluções para correcção" htmlFor="si-maxret" hint="Vazio = sem limite.">
              <Input id="si-maxret" value={node.maxReturns} disabled={readOnly} onChange={num(node.maxReturns, (v) => onChange({ maxReturns: v }))} />
            </FormField>
            <FormField label="Lista de verificação" htmlFor="si-chk" hint="Um item por linha — obrigatória para concluir.">
              <Textarea id="si-chk" rows={3} value={node.checklist} disabled={readOnly} onChange={(e) => onChange({ checklist: e.target.value })} className="w-full" />
            </FormField>
            <label className="flex items-center gap-2 font-body text-sm text-ink">
              <input type="checkbox" checked={node.requiresUpload} disabled={readOnly} onChange={(e) => onChange({ requiresUpload: e.target.checked })} />
              Exige evidência (upload) para concluir
            </label>
            <div className="rounded-card border border-border p-3">
              <div className="mb-2 font-body text-xs font-medium uppercase tracking-wide text-ink-faint">Política de escalonamento</div>
              <FormField label="Escalar após (horas depois do prazo)" htmlFor="si-esc">
                <Input id="si-esc" value={node.escalationAfterHours} disabled={readOnly} onChange={num(node.escalationAfterHours, (v) => onChange({ escalationAfterHours: v }))} />
              </FormField>
              <div className="mt-2">
                <FormField label="Escalar para (utilizador)" htmlFor="si-escto" hint="Por defeito, o gestor do responsável e o dono do modelo.">
                  <UserPicker value={node.escalationToId} onChange={(v) => onChange({ escalationToId: v })} className="w-full" />
                </FormField>
              </div>
              <div className="mt-2">
                <FormField label="ou função" htmlFor="si-escrole">
                  <Input id="si-escrole" value={node.escalationToRole} disabled={readOnly} onChange={(e) => onChange({ escalationToRole: e.target.value })} placeholder="Ex.: RH" />
                </FormField>
              </div>
            </div>
          </>
        )}
      </div>

      {!readOnly && (
        <div className="border-t border-border p-3">
          <Button intent="danger" size="sm" onClick={onDelete}>
            <Trash2 size={14} strokeWidth={1.75} />
            Remover etapa
          </Button>
        </div>
      )}
    </aside>
  );
}
