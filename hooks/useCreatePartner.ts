// hooks/useCreatePartner.ts
// Extraído de app/(platform)/crm/partners/novo/page.tsx. Adaptador fino sobre
// useCrmResourceCreate — mantém a forma que PartnerCreateView espera.

'use client';

import { useCrmResourceCreate } from '@/hooks/useCrmResourceCreate';
import { queryKeys } from '@/lib/queryKeys';
import { email as emailValidator, required } from '@/lib/validation';

const INITIAL_FORM = {
  type: 'TECHNOLOGY',
  name: '',
  legalName: '',
  tier: 'STANDARD',
  contactName: '',
  contactTitle: '',
  email: '',
  phone: '',
  mobile: '',
  website: '',
  linkedin: '',
  nif: '',
  address: '',
  city: '',
  province: '',
  annualValue: '',
  currency: 'AOA',
  revenueSharing: '',
  contractStart: '',
  contractEnd: '',
  notes: '',
  nextReviewAt: '',
};

export function useCreatePartner() {
  return useCrmResourceCreate({
    basePath: '/crm/partners',
    listKey: queryKeys.partners.lists(),
    initialForm: INITIAL_FORM,
    schema: {
      name: [required()],
      email: [emailValidator()],
    },
    alwaysInclude: ['type', 'name'],
    numericFields: ['annualValue', 'revenueSharing'],
  });
}
