import type { Metadata } from 'next';

import { BeneficiariesShell } from '@/components/crm/beneficiaries/BeneficiariesShell';

export const metadata: Metadata = { title: 'Beneficiários' };

export default function CrmBeneficiariesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <BeneficiariesShell>{children}</BeneficiariesShell>;
}
