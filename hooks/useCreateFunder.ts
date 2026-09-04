// hooks/useCreateFunder.ts
// Formulário + submissão de criação de financiador. Extraído de
// app/(platform)/crm/funders/novo/page.tsx. Adaptador fino sobre
// useCrmResourceCreate — mantém a forma que FunderCreateView espera.

'use client';

import { useCrmResourceCreate } from '@/hooks/useCrmResourceCreate';
import { queryKeys } from '@/lib/queryKeys';
import { email as emailValidator, required } from '@/lib/validation';

const INITIAL_FORM = {
  type: 'BILATERAL',
  name: '',
  legalName: '',
  category: '',
  contactName: '',
  contactTitle: '',
  email: '',
  phone: '',
  mobile: '',
  website: '',
  country: '',
  region: '',
  nif: '',
  currency: 'AOA',
  reportingReqs: '',
  relationshipStart: '',
  notes: '',
  nextReportDue: '',
};

export function useCreateFunder() {
  return useCrmResourceCreate({
    basePath: '/crm/funders',
    listKey: queryKeys.funders.lists(),
    initialForm: INITIAL_FORM,
    schema: {
      name: [required()],
      email: [emailValidator()],
    },
    alwaysInclude: ['type', 'name'],
  });
}
