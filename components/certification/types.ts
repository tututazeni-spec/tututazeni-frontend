// components/certification/types.ts

export interface Template {
  id: string;
  name: string;
  description: string | null;
  type: string;
  isDefault: boolean;
  isActive: boolean;
  validityDays: number | null;
  _count?: { certificates: number };
}

export const TEMPLATE_TYPES = [
  'COURSE',
  'PROGRAM',
  'COMPETENCY',
  'ATTENDANCE',
  'PARTICIPATION',
  'ACHIEVEMENT',
];

export interface CreateTemplatePayload {
  name: string;
  type: string;
  html: string;
  isDefault: boolean;
  description?: string;
  signatoryName?: string;
  signatoryTitle?: string;
  validityDays?: number;
}

export interface TemplateForm {
  name: string;
  description: string;
  type: string;
  html: string;
  signatoryName: string;
  signatoryTitle: string;
  validityDays: string;
  isDefault: boolean;
}

export const EMPTY_TEMPLATE_FORM: TemplateForm = {
  name: '',
  description: '',
  type: 'COURSE',
  html: '<div style="text-align:center"><h1>{{recipientName}}</h1><p>{{title}}</p><p>{{date}}</p></div>',
  signatoryName: '',
  signatoryTitle: '',
  validityDays: '',
  isDefault: false,
};
