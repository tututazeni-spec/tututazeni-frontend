import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Financiadores' };

export default function CrmFundersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
