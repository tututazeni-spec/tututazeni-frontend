import type { Metadata } from 'next';

import { FundersShell } from '@/components/crm/funders/FundersShell';

export const metadata: Metadata = { title: 'Financiadores' };

export default function CrmFundersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FundersShell>{children}</FundersShell>;
}
