import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Competências' };

export default function CompetenciesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
