// components/processes/setting-schemas.ts
// Descrição declarativa do formulário de cada secção de «Configurações»
// (docs/Modulo_Processes.md §14). O SettingForm renderiza a partir daqui; a
// validação autoritativa está no backend (src/process-standard/process-settings.ts).

export interface Option {
  value: string;
  label: string;
}

export type FieldSpec =
  | { t: 'number'; k: string; label: string; min?: number; max?: number; step?: number; nullable?: boolean; hint?: string }
  | { t: 'text'; k: string; label: string; max?: number; readOnly?: boolean; placeholder?: string }
  | { t: 'textarea'; k: string; label: string; max?: number }
  | { t: 'bool'; k: string; label: string }
  | { t: 'select'; k: string; label: string; options: Option[]; nullable?: boolean }
  | { t: 'tags'; k: string; label: string; placeholder?: string }
  | { t: 'days'; k: string; label: string }
  | { t: 'matrix'; k: string; label: string; rows: Option[] }
  | { t: 'record'; k: string; label: string; keys: Option[] }
  | { t: 'rows'; k: string; label: string; cols: FieldSpec[]; fixed?: boolean; blank?: Record<string, unknown>; max?: number };

/** Raiz: uma lista (rows/tags) ou um objecto de campos. */
export type SectionSchema = { kind: 'list'; field: FieldSpec } | { kind: 'object'; fields: FieldSpec[] };

const ROLES: Option[] = ['ADMIN', 'RH', 'GESTOR', 'AUDITOR', 'LIDER', 'DIRECTOR', 'COLABORADOR'].map((v) => ({
  value: v,
  label: v,
}));
const PRIORITIES: Option[] = [
  { value: 'LOW', label: 'Baixa' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'URGENT', label: 'Urgente' },
];
const STATUSES: Option[] = [
  { value: 'DRAFT', label: 'Rascunho' },
  { value: 'IN_REVIEW', label: 'Em revisão' },
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'ARCHIVED', label: 'Arquivado' },
];
const CONFIDENTIALITY: Option[] = [
  { value: 'PUBLIC', label: 'Público' },
  { value: 'INTERNAL', label: 'Interno' },
  { value: 'CONFIDENTIAL', label: 'Confidencial' },
  { value: 'RESTRICTED', label: 'Restrito' },
];
const RISK: Option[] = [
  { value: 'LOW', label: 'Baixo' },
  { value: 'MEDIUM', label: 'Médio' },
  { value: 'HIGH', label: 'Alto' },
  { value: 'CRITICAL', label: 'Crítico' },
];
const EVENTS: Option[] = [
  { value: 'TASK_ASSIGNED', label: 'Tarefa atribuída' },
  { value: 'APPROVAL_REQUESTED', label: 'Aprovação pedida' },
  { value: 'TASK_OVERDUE', label: 'Tarefa em atraso' },
  { value: 'APPROVAL_RETURNED', label: 'Aprovação devolvida' },
  { value: 'PROCESS_COMPLETED', label: 'Processo concluído' },
];

export const SETTING_SCHEMAS: Record<string, SectionSchema> = {
  categories: {
    kind: 'list',
    field: { t: 'tags', k: '', label: 'Categorias', placeholder: 'Nova categoria e Enter' },
  },
  statuses: {
    kind: 'object',
    fields: [{ t: 'matrix', k: '', label: 'De (linha) para (coluna): transições permitidas', rows: STATUSES }],
  },
  priorities: {
    kind: 'list',
    field: {
      t: 'rows',
      k: '',
      label: 'Prioridades',
      fixed: true,
      cols: [
        { t: 'select', k: 'code', label: 'Código', options: PRIORITIES },
        { t: 'text', k: 'label', label: 'Rótulo', max: 40 },
        { t: 'number', k: 'slaFactor', label: 'Factor do prazo', min: 0.1, max: 10, step: 0.05 },
      ],
    },
  },
  assignmentRules: {
    kind: 'list',
    field: {
      t: 'rows',
      k: '',
      label: 'Regras de atribuição',
      max: 50,
      blank: { name: '', category: '', sourceModule: '', userId: null, role: 'RH' },
      cols: [
        { t: 'text', k: 'name', label: 'Nome', max: 80 },
        { t: 'text', k: 'category', label: 'Categoria', max: 60 },
        { t: 'text', k: 'sourceModule', label: 'Módulo de origem', max: 60 },
        { t: 'select', k: 'role', label: 'Função', options: ROLES, nullable: true },
        { t: 'number', k: 'userId', label: 'ID do utilizador', min: 1, nullable: true },
      ],
    },
  },
  approvalMatrix: {
    kind: 'list',
    field: {
      t: 'rows',
      k: '',
      label: 'Matriz de aprovações',
      max: 50,
      blank: { category: '', minRiskLevel: 'LOW', approverRole: 'GESTOR', mode: 'SEQUENTIAL' },
      cols: [
        { t: 'text', k: 'category', label: 'Categoria', max: 60 },
        { t: 'select', k: 'minRiskLevel', label: 'Risco mínimo', options: RISK },
        { t: 'select', k: 'approverRole', label: 'Aprovador', options: ROLES },
        {
          t: 'select',
          k: 'mode',
          label: 'Modo',
          options: [
            { value: 'SEQUENTIAL', label: 'Sequencial' },
            { value: 'PARALLEL', label: 'Paralelo' },
            { value: 'ANY', label: 'Qualquer um' },
          ],
        },
      ],
    },
  },
  defaultDeadlines: {
    kind: 'list',
    field: {
      t: 'rows',
      k: '',
      label: 'Prazos padrão por tipo de processo',
      max: 50,
      blank: { category: '', hours: 72 },
      cols: [
        { t: 'text', k: 'category', label: 'Tipo / categoria', max: 60 },
        { t: 'number', k: 'hours', label: 'SLA (horas)', min: 1, max: 8760 },
      ],
    },
  },
  workCalendar: {
    kind: 'object',
    fields: [
      { t: 'days', k: 'workDays', label: 'Dias úteis' },
      { t: 'number', k: 'startHour', label: 'Início do expediente (h)', min: 0, max: 23 },
      { t: 'number', k: 'endHour', label: 'Fim do expediente (h)', min: 1, max: 24 },
      {
        t: 'rows',
        k: 'holidays',
        label: 'Feriados',
        max: 400,
        blank: { date: '', name: '' },
        cols: [
          { t: 'text', k: 'date', label: 'Data (AAAA-MM-DD)', max: 10, placeholder: '2026-12-25' },
          { t: 'text', k: 'name', label: 'Nome', max: 80 },
        ],
      },
    ],
  },
  escalation: {
    kind: 'object',
    fields: [
      { t: 'number', k: 'afterHours', label: 'Escalar após (horas de atraso)', min: 1, max: 2160, nullable: true },
      { t: 'select', k: 'toRole', label: 'Escalar para a função', options: ROLES },
      { t: 'number', k: 'repeatEveryHours', label: 'Repetir a cada (horas)', min: 1, max: 720 },
      { t: 'number', k: 'maxEscalations', label: 'Máximo de escalonamentos', min: 1, max: 10 },
    ],
  },
  notifications: {
    kind: 'list',
    field: {
      t: 'rows',
      k: '',
      label: 'Modelos de notificações',
      fixed: true,
      cols: [
        { t: 'select', k: 'event', label: 'Evento', options: EVENTS },
        { t: 'bool', k: 'enabled', label: 'Activa' },
        { t: 'text', k: 'subject', label: 'Assunto', max: 150 },
        { t: 'textarea', k: 'body', label: 'Corpo', max: 2000 },
      ],
    },
  },
  accessRules: {
    kind: 'list',
    field: {
      t: 'rows',
      k: '',
      label: 'Âmbito de visibilidade por função',
      max: 7,
      blank: { role: 'LIDER', scope: 'DEPARTMENT' },
      cols: [
        { t: 'select', k: 'role', label: 'Função', options: ROLES },
        {
          t: 'select',
          k: 'scope',
          label: 'Âmbito',
          options: [
            { value: 'ALL', label: 'Toda a organização' },
            { value: 'DEPARTMENT', label: 'Departamento / unidade' },
            { value: 'OWN', label: 'Apenas os próprios' },
          ],
        },
      ],
    },
  },
  confidentiality: {
    kind: 'object',
    fields: [
      { t: 'select', k: 'default', label: 'Nível por omissão', options: CONFIDENTIALITY },
      { t: 'record', k: 'labels', label: 'Rótulos dos níveis', keys: CONFIDENTIALITY },
    ],
  },
  retention: {
    kind: 'object',
    fields: [
      { t: 'number', k: 'auditYears', label: 'Auditoria (anos, mínimo 5)', min: 5, max: 50 },
      { t: 'number', k: 'closedInstanceYears', label: 'Processos encerrados (anos)', min: 1, max: 50 },
      { t: 'number', k: 'documentYears', label: 'Documentos (anos)', min: 1, max: 50 },
      { t: 'number', k: 'integrationLogYears', label: 'Registos de integração (anos)', min: 1, max: 50 },
    ],
  },
  numbering: {
    kind: 'object',
    fields: [
      { t: 'text', k: 'prefix', label: 'Prefixo (2–10 letras/dígitos)', max: 10 },
      { t: 'bool', k: 'includeYear', label: 'Incluir o ano no código' },
      { t: 'number', k: 'padding', label: 'Algarismos da sequência', min: 3, max: 8 },
    ],
  },
  integrations: {
    kind: 'object',
    fields: [
      { t: 'bool', k: 'inboundEnabled', label: 'Aceitar eventos de outros módulos' },
      {
        t: 'tags',
        k: 'enabledModules',
        label: 'Módulos autorizados (vazio = todos)',
        placeholder: 'Nome do módulo e Enter',
      },
      { t: 'number', k: 'maxPayloadKb', label: 'Tamanho máximo do evento (KB)', min: 1, max: 256 },
    ],
  },
  automationLimits: {
    kind: 'object',
    fields: [
      { t: 'number', k: 'maxRetries', label: 'Repetições máximas', min: 0, max: 10 },
      { t: 'number', k: 'retryBackoffMinutes', label: 'Intervalo entre repetições (min)', min: 1, max: 1440 },
      { t: 'number', k: 'maxExecutionsPerHour', label: 'Execuções máximas por hora', min: 1, max: 100000 },
    ],
  },
  indicators: {
    kind: 'object',
    fields: [
      { t: 'number', k: 'onTimeTargetPct', label: 'Meta de cumprimento de prazos (%)', min: 1, max: 100 },
      { t: 'number', k: 'atRiskThresholdPct', label: 'Limiar «em risco» (% do prazo)', min: 1, max: 100 },
      { t: 'number', k: 'maxCycleDays', label: 'Duração máxima esperada (dias)', min: 1, max: 365 },
    ],
  },
};
