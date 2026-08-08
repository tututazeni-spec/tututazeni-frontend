import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Desempenho' };

export default function PerformanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
