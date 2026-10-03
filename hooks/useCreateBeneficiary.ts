// hooks/useCreateBeneficiary.ts
// Extraído de app/(platform)/crm/beneficiaries/novo/page.tsx. Adaptador fino
// sobre useCrmResourceCreate — mantém a forma que BeneficiaryCreateView espera.
// Os campos vêm de components/crm/beneficiaries/formConfig.ts.

'use client';

import { useCrmResourceCreate } from '@/hooks/useCrmResourceCreate';
import { queryKeys } from '@/lib/queryKeys';
import { email as emailValidator, required } from '@/lib/validation';
import {
  CREATE_SECTIONS,
  NUMERIC_FIELDS,
  initialFormFromSections,
} from '@/components/crm/beneficiaries/formConfig';

const INITIAL_FORM = initialFormFromSections(CREATE_SECTIONS);

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
    numericFields: NUMERIC_FIELDS,
  });
}
