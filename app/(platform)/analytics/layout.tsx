import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Indicadores de Desempenho' };

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
