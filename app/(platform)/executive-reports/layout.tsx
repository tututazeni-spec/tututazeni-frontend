import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Relatório Executivos' };

export default function ExecutiveReportsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
