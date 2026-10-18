// components/crm/beneficiaries/formConfig.ts
// Configuração declarativa dos campos do beneficiário (docs/modulo_crm_beneficiario.md).
// Partilhada pelo formulário de criação (BeneficiaryCreateView) e pelo
// separador de edição do detalhe — evita repetir ~70 <Field> à mão.

import { ANGOLA_PROVINCES } from '@/lib/provinces';

export type FieldKind =
  | 'text'
  | 'email'
  | 'date'
  | 'number'
  | 'textarea'
  | 'select'
  | 'country'
  | 'province'
  | 'photo'
  | 'user';

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldDef {
  key: string;
  label: string;
  kind?: FieldKind;
  options?: FieldOption[];
  required?: boolean;
  /** Ocupa as 2 colunas do grid. */
  wide?: boolean;
}

export interface SectionDef {
  id: string;
  title: string;
  fields: FieldDef[];
}

const EMPTY: FieldOption = { value: '', label: '—' };

/** Opção para deixar o campo em branco, sempre a primeira da lista. */
const BLANK: FieldOption = { value: '', label: 'Não escolher (em branco)' };

/** Lista de escolha em que o valor guardado é o próprio texto. */
const list = (labels: string[]): FieldOption[] => [
  BLANK,
  ...labels.map((l) => ({ value: l, label: l })),
];

/** Tamanho máximo da fotografia (4 MB). */
export const PHOTO_MAX_BYTES = 4 * 1024 * 1024;

const ID_DOCUMENT_OPTIONS = list([
  'Bilhete de Identidade',
  'Passaporte',
  'Cartão de Residente',
  'Cédula Pessoal',
  'Cartão de Eleitor',
  'Carta de Condução',
  'Cartão de Contribuinte (NIF)',
  'Outro',
]);

const CATEGORY_OPTIONS = list([
  'Aluno',
  'Antigo aluno',
  'Família',
  'Comunidade',
  'Instituição parceira',
  'Colaborador',
  'Outra',
]);

const SEGMENT_OPTIONS = list([
  'Criança',
  'Jovem',
  'Adulto',
  'Idoso',
  'Pessoa com deficiência',
  'Mulher',
  'Família vulnerável',
  'Outro',
]);

const PROFILE_OPTIONS = list([
  'Em situação de vulnerabilidade',
  'Em risco de abandono escolar',
  'Em procura de emprego',
  'Empreendedor',
  'Estudante',
  'Líder comunitário',
  'Outro',
]);

const SOURCE_OPTIONS = list([
  'Candidatura espontânea',
  'Indicação de parceiro',
  'Indicação de beneficiário',
  'Campanha de divulgação',
  'Evento',
  'Redes sociais',
  'Website',
  'Instituição pública',
  'Outra',
]);

const PROGRAM_OPTIONS = list([
  'Apoio Educativo',
  'Apoio Social',
  'Formação Profissional',
  'Emprego e Empreendedorismo',
  'Saúde e Bem-Estar',
  'Apoio Alimentar',
  'Habitação',
  'Outro',
]);

const UNIT_OPTIONS = list([
  'Acção Social',
  'Educação',
  'Formação',
  'Saúde',
  'Comunidade',
  'Apoio Jurídico',
  'Sede',
]);

const EMPLOYMENT_OPTIONS = list([
  'Empregado por conta de outrem',
  'Trabalhador por conta própria',
  'Desempregado',
  'Estudante',
  'Reformado',
  'Doméstico(a)',
  'Incapacitado para o trabalho',
  'Outra',
]);

const HOUSEHOLD_RELATION_OPTIONS = list([
  'O próprio',
  'Cônjuge',
  'Filho(a)',
  'Pai / Mãe',
  'Irmão(ã)',
  'Avô / Avó',
  'Outro familiar',
  'Sem parentesco',
]);

const INCOME_SOURCE_OPTIONS = list([
  'Salário',
  'Negócio próprio',
  'Biscates',
  'Agricultura',
  'Pensão / Reforma',
  'Apoio familiar',
  'Apoio social',
  'Sem rendimento',
  'Outra',
]);

const HOUSING_OPTIONS = list([
  'Casa própria',
  'Arrendada',
  'Cedida',
  'Casa de familiares',
  'Casa partilhada',
  'Abrigo / alojamento temporário',
  'Sem abrigo',
  'Outra',
]);

const ELIGIBILITY_OPTIONS = list([
  'Agregado em situação de vulnerabilidade',
  'Rendimento mensal abaixo do limiar definido',
  'Desempregado há mais de 6 meses',
  'Residente na área de intervenção',
  'Criança ou jovem em idade escolar',
  'Pessoa com deficiência',
  'Idoso sem apoio familiar',
  'Encaminhado por instituição parceira',
]);

const FOLLOW_UP_PLAN_OPTIONS = list([
  'Contacto semanal',
  'Contacto quinzenal',
  'Contacto mensal',
  'Visita domiciliária',
  'Acompanhamento psicossocial',
  'Acompanhamento escolar',
  'Orientação profissional',
  'Reavaliação trimestral',
]);

export const PRIORITY_OPTIONS: FieldOption[] = [
  EMPTY,
  { value: 'LOW', label: 'Baixa' },
  { value: 'MEDIUM', label: 'Média' },
  { value: 'HIGH', label: 'Alta' },
  { value: 'URGENT', label: 'Urgente' },
];

export const STATUS_OPTIONS: FieldOption[] = [
  { value: 'ACTIVE', label: 'Activo' },
  { value: 'INACTIVE', label: 'Inactivo' },
  { value: 'UNDER_FOLLOW_UP', label: 'Em acompanhamento' },
  { value: 'SUSPENDED', label: 'Suspenso' },
  { value: 'ELIGIBLE', label: 'Elegível' },
  { value: 'NOT_ELIGIBLE', label: 'Não elegível' },
  { value: 'BENEFIT_ACTIVE', label: 'Benefício activo' },
  { value: 'BENEFIT_ENDED', label: 'Benefício terminado' },
  { value: 'ARCHIVED', label: 'Arquivado' },
  { value: 'PROSPECT', label: 'Potencial' },
  { value: 'FORMER', label: 'Antigo' },
  { value: 'BLOCKED', label: 'Bloqueado' },
];

export const FOLLOW_UP_STATUS_OPTIONS: FieldOption[] = [
  EMPTY,
  { value: 'PENDING', label: 'Pendente' },
  { value: 'IN_PROGRESS', label: 'Em curso' },
  { value: 'COMPLETED', label: 'Concluído' },
  { value: 'ON_HOLD', label: 'Em pausa' },
];

export const CONSENT_STATUS_OPTIONS: FieldOption[] = [
  { value: 'PENDING', label: 'Pendente' },
  { value: 'GRANTED', label: 'Concedido' },
  { value: 'REVOKED', label: 'Revogado' },
];

export const COMMUNICATION_CHANNELS: FieldOption[] = [
  { value: 'EMAIL', label: 'E-mail' },
  { value: 'CALL', label: 'Telefone' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'SMS', label: 'SMS' },
  { value: 'IN_PERSON', label: 'Presencial' },
  { value: 'PORTAL', label: 'Portal' },
  { value: 'MOBILE_APP', label: 'Aplicação móvel' },
];

export const INTERACTION_TYPE_OPTIONS: FieldOption[] = [
  { value: 'EMAIL', label: 'E-mail' },
  { value: 'CALL', label: 'Telefone' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'SMS', label: 'SMS' },
  { value: 'IN_PERSON', label: 'Presencial' },
  { value: 'VIDEO_CALL', label: 'Videochamada' },
  { value: 'PORTAL', label: 'Portal' },
  { value: 'MOBILE_APP', label: 'Aplicação móvel' },
  { value: 'MEETING', label: 'Reunião' },
  { value: 'VISIT', label: 'Visita' },
  { value: 'EVENT', label: 'Evento' },
  { value: 'NOTE', label: 'Nota' },
  { value: 'TASK', label: 'Tarefa' },
  { value: 'OTHER', label: 'Outro' },
];

const provinceOptions: FieldOption[] = [
  EMPTY,
  ...ANGOLA_PROVINCES.map((p) => ({ value: p, label: p.replace(/_/g, ' ') })),
];

// ─── Secções do formulário de criação ───────────────────────────────────────

export const CREATE_SECTIONS: SectionDef[] = [
  {
    id: 'principal',
    title: 'Dados principais',
    fields: [
      {
        key: 'type',
        label: 'Tipo (individual / institucional) *',
        kind: 'select',
        options: [
          { value: 'INDIVIDUAL', label: 'Individual' },
          { value: 'FAMILY', label: 'Família' },
          { value: 'INSTITUTION', label: 'Instituição' },
          { value: 'COMMUNITY', label: 'Comunidade' },
          { value: 'GROUP', label: 'Grupo' },
        ],
      },
      { key: 'fullName', label: 'Nome completo *', required: true },
      { key: 'beneficiaryNumber', label: 'Número de beneficiário' },
      {
        key: 'gender',
        label: 'Género',
        kind: 'select',
        options: [
          EMPTY,
          { value: 'MALE', label: 'Masculino' },
          { value: 'FEMALE', label: 'Feminino' },
          { value: 'NON_BINARY', label: 'Não-binário' },
          { value: 'PREFER_NOT_TO_SAY', label: 'Prefere não dizer' },
        ],
      },
      { key: 'birthDate', label: 'Data de nascimento', kind: 'date' },
      {
        key: 'maritalStatus',
        label: 'Estado civil',
        kind: 'select',
        options: [
          EMPTY,
          { value: 'SINGLE', label: 'Solteiro(a)' },
          { value: 'MARRIED', label: 'Casado(a)' },
          { value: 'COMMON_LAW', label: 'União de facto' },
          { value: 'DIVORCED', label: 'Divorciado(a)' },
          { value: 'WIDOWED', label: 'Viúvo(a)' },
        ],
      },
      { key: 'nationality', label: 'Nacionalidade', kind: 'country' },
      { key: 'nif', label: 'NIF' },
      {
        key: 'idDocumentType',
        label: 'Documento de identificação',
        kind: 'select',
        options: ID_DOCUMENT_OPTIONS,
      },
      { key: 'idDocumentNumber', label: 'Número do documento' },
      { key: 'idDocumentIssuedAt', label: 'Data de emissão', kind: 'date' },
      { key: 'idDocumentExpiresAt', label: 'Data de validade', kind: 'date' },
      { key: 'idDocumentCountry', label: 'País de emissão', kind: 'country' },
      {
        key: 'photoUrl',
        label: 'Fotografia (máx. 4 MB)',
        kind: 'photo',
        wide: true,
      },
      { key: 'email', label: 'E-mail', kind: 'email' },
      { key: 'phone', label: 'Telefone' },
      { key: 'mobile', label: 'Telemóvel' },
      { key: 'alternativePhone', label: 'Telefone alternativo' },
      { key: 'address', label: 'Endereço' },
      { key: 'province', label: 'Província', kind: 'province' },
      { key: 'municipality', label: 'Município' },
      { key: 'commune', label: 'Comuna' },
      { key: 'neighborhood', label: 'Bairro' },
      { key: 'city', label: 'Cidade' },
      { key: 'postalCode', label: 'Código postal' },
      { key: 'country', label: 'País', kind: 'country' },
      { key: 'emergencyContactName', label: 'Contacto de emergência — nome' },
      {
        key: 'emergencyContactPhone',
        label: 'Contacto de emergência — telefone',
      },
      {
        key: 'emergencyContactRelation',
        label: 'Contacto de emergência — relação',
      },
    ],
  },
  {
    id: 'classificacao',
    title: 'Classificação CRM',
    fields: [
      {
        key: 'category',
        label: 'Categoria',
        kind: 'select',
        options: CATEGORY_OPTIONS,
      },
      {
        key: 'segment',
        label: 'Segmento',
        kind: 'select',
        options: SEGMENT_OPTIONS,
      },
      {
        key: 'profile',
        label: 'Perfil',
        kind: 'select',
        options: PROFILE_OPTIONS,
      },
      {
        key: 'source',
        label: 'Origem',
        kind: 'select',
        options: SOURCE_OPTIONS,
      },
      {
        key: 'programName',
        label: 'Programa associado',
        kind: 'select',
        options: PROGRAM_OPTIONS,
      },
      { key: 'originInstitution', label: 'Instituição de origem' },
      {
        key: 'status',
        label: 'Estado do beneficiário',
        kind: 'select',
        options: STATUS_OPTIONS,
      },
      { key: 'registeredAt', label: 'Data de registo', kind: 'date' },
      {
        key: 'assignedToId',
        label: 'Responsável pelo acompanhamento (nome ou ID)',
        kind: 'user',
      },
      {
        key: 'responsibleUnit',
        label: 'Unidade responsável',
        kind: 'select',
        options: UNIT_OPTIONS,
      },
      {
        key: 'accountManagerId',
        label: 'Gestor de conta (nome ou ID)',
        kind: 'user',
      },
      {
        key: 'priority',
        label: 'Prioridade',
        kind: 'select',
        options: PRIORITY_OPTIONS,
      },
    ],
  },
  {
    id: 'agregado',
    title: 'Agregado / enquadramento',
    fields: [
      {
        key: 'householdSize',
        label: 'Agregado familiar (nº pessoas)',
        kind: 'number',
      },
      {
        key: 'dependentsCount',
        label: 'Número de dependentes',
        kind: 'number',
      },
      { key: 'householdHeadName', label: 'Responsável pelo agregado' },
      {
        key: 'householdHeadRelation',
        label: 'Relação com o responsável',
        kind: 'select',
        options: HOUSEHOLD_RELATION_OPTIONS,
      },
      {
        key: 'employmentStatus',
        label: 'Situação profissional',
        kind: 'select',
        options: EMPLOYMENT_OPTIONS,
      },
      { key: 'employer', label: 'Entidade empregadora' },
      { key: 'jobTitle', label: 'Cargo' },
      { key: 'monthlyIncome', label: 'Rendimento mensal', kind: 'number' },
      {
        key: 'incomeSource',
        label: 'Fonte de rendimento',
        kind: 'select',
        options: INCOME_SOURCE_OPTIONS,
      },
      {
        key: 'housingSituation',
        label: 'Situação habitacional',
        kind: 'select',
        options: HOUSING_OPTIONS,
      },
    ],
  },
  {
    id: 'acompanhamento',
    title: 'Acompanhamento e elegibilidade',
    fields: [
      { key: 'nextFollowUpAt', label: 'Próximo contacto', kind: 'date' },
      {
        key: 'followUpStatus',
        label: 'Estado do acompanhamento',
        kind: 'select',
        options: FOLLOW_UP_STATUS_OPTIONS,
      },
      {
        key: 'eligibilityCriteria',
        label: 'Critérios de elegibilidade',
        kind: 'select',
        options: ELIGIBILITY_OPTIONS,
      },
      {
        key: 'goals',
        label: 'Objectivos definidos',
        kind: 'textarea',
        wide: true,
      },
      {
        key: 'followUpPlan',
        label: 'Plano de acompanhamento',
        kind: 'select',
        options: FOLLOW_UP_PLAN_OPTIONS,
      },
      { key: 'notes', label: 'Observações', kind: 'textarea', wide: true },
    ],
  },
];

/** Campos do formulário de acompanhamento (separador no detalhe). */
export const FOLLOW_UP_FIELDS: FieldDef[] = [
  {
    key: 'followUpStatus',
    label: 'Estado do acompanhamento',
    kind: 'select',
    options: FOLLOW_UP_STATUS_OPTIONS,
  },
  { key: 'nextFollowUpAt', label: 'Próximo contacto', kind: 'date' },
  { key: 'goals', label: 'Objectivos definidos', kind: 'textarea', wide: true },
  {
    key: 'followUpPlan',
    label: 'Plano de acompanhamento',
    kind: 'textarea',
    wide: true,
  },
  {
    key: 'followUpResult',
    label: 'Resultado do acompanhamento',
    kind: 'textarea',
    wide: true,
  },
  {
    key: 'nextActions',
    label: 'Próximas acções',
    kind: 'textarea',
    wide: true,
  },
  {
    key: 'eligibilityCriteria',
    label: 'Critérios de elegibilidade',
    kind: 'textarea',
    wide: true,
  },
  { key: 'notes', label: 'Observações', kind: 'textarea', wide: true },
];

export const NUMERIC_FIELDS = [
  'assignedToId',
  'accountManagerId',
  'householdSize',
  'dependentsCount',
  'monthlyIncome',
] as const;

export function initialFormFromSections(sections: SectionDef[]) {
  const form: Record<string, string> = {};
  for (const s of sections) for (const f of s.fields) form[f.key] = '';
  form.type = 'INDIVIDUAL';
  form.status = 'ACTIVE';
  form.country = 'Angola';
  return form;
}

export { provinceOptions };
