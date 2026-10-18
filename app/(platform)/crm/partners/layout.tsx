import type { Metadata } from 'next';

import { PartnersShell } from '@/components/crm/partners/PartnersShell';

export const metadata: Metadata = { title: 'Parceiros' };

export default function CrmPartnersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PartnersShell>{children}</PartnersShell>;
}
