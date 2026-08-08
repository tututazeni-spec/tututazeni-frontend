import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Beneficiários' };

export default function CrmBeneficiariesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
