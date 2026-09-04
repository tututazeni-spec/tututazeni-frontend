// hooks/useCreateBeneficiary.ts
// Extraído de app/(platform)/crm/beneficiaries/novo/page.tsx. Adaptador fino
// sobre useCrmResourceCreate — mantém a forma que BeneficiaryCreateView espera.

'use client';

import { useCrmResourceCreate } from '@/hooks/useCrmResourceCreate';
import { queryKeys } from '@/lib/queryKeys';
import { email as emailValidator, required } from '@/lib/validation';

const INITIAL_FORM = {
  type: 'INDIVIDUAL',
  fullName: '',
  category: '',
  gender: '',
  birthDate: '',
  nationality: '',
  nif: '',
  email: '',
  phone: '',
  mobile: '',
  address: '',
  city: '',
  province: '',
  source: '',
  segment: '',
  notes: '',
  nextFollowUpAt: '',
};

export function useCreateBeneficiary() {
  return useCrmResourceCreate({
    basePath: '/crm/beneficiaries',
    listKey: queryKeys.beneficiaries.lists(),
    initialForm: INITIAL_FORM,
    schema: {
      fullName: [required()],
      email: [emailValidator()],
    },
    alwaysInclude: ['type', 'fullName'],
  });
}
