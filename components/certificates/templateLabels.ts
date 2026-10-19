// Rótulos em português do editor de modelos — nenhum nome técnico chega ao ecrã.

import type { Align, ElementKey } from './types';

export const ELEMENT_LABEL: Record<ElementKey, string> = {
  logo: 'Logótipo',
  title: 'Título',
  recognition: 'Texto de reconhecimento',
  name: 'Nome do titular',
  course: 'Curso ou formação',
  details: 'Detalhes (horas, nota, datas)',
  signature: 'Assinatura',
  qr: 'QR Code',
  code: 'Código de verificação',
};

export const ELEMENT_ORDER: ElementKey[] = [
  'logo',
  'title',
  'recognition',
  'name',
  'course',
  'details',
  'signature',
  'qr',
  'code',
];

export const ALIGN_LABEL: Record<Align, string> = {
  left: 'Esquerda',
  center: 'Centro',
  right: 'Direita',
};

export const COLOR_LABEL = {
  primary: 'Cor principal',
  accent: 'Cor de destaque',
  text: 'Cor do texto',
  background: 'Cor do fundo',
} as const;

export const OPTION_LABEL = {
  showQr: 'Mostrar o QR Code de verificação',
  showCode: 'Mostrar o código de verificação',
  showHours: 'Mostrar a carga horária',
  showValidity: 'Mostrar a data de validade',
  showScore: 'Mostrar a nota final',
} as const;

export const TEXT_FIELDS = [
  { key: 'title', label: 'Título', multiline: false },
  { key: 'recognition', label: 'Texto de reconhecimento', multiline: true },
  { key: 'courseLine', label: 'Linha do curso', multiline: true },
  { key: 'detailsLine', label: 'Linha de detalhes', multiline: true },
  { key: 'footer', label: 'Rodapé', multiline: false },
] as const;

/** Variáveis disponíveis (lista fechada do backend) com a descrição mostrada ao utilizador. */
export const VARIABLES: { name: string; label: string; optional: boolean }[] = [
  { name: 'nome_completo', label: 'Nome completo', optional: false },
  { name: 'nome_curso', label: 'Nome do curso', optional: false },
  { name: 'nome_formacao', label: 'Nome da formação', optional: false },
  { name: 'nome_trilha', label: 'Nome da trilha', optional: true },
  { name: 'nome_empresa', label: 'Nome da empresa', optional: false },
  { name: 'nome_instrutor', label: 'Nome do instrutor', optional: true },
  { name: 'carga_horaria', label: 'Carga horária', optional: true },
  { name: 'nota_final', label: 'Nota final', optional: true },
  { name: 'data_emissao', label: 'Data de emissão', optional: false },
  { name: 'data_validade', label: 'Data de validade', optional: true },
  {
    name: 'codigo_certificado',
    label: 'Código do certificado',
    optional: false,
  },
  {
    name: 'competencias_adquiridas',
    label: 'Competências adquiridas',
    optional: true,
  },
];

export const HEX = /^#[0-9A-Fa-f]{6}$/;
export const MAX_IMAGE_BYTES = 2 * 1024 * 1024;
export const IMAGE_TYPES = ['image/png', 'image/jpeg'];
