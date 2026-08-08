import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Relatórios em Atraso' };

export default function CrmFundersOverdueReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
