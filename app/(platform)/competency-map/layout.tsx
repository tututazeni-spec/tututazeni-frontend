import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Mapa de Competências' };

export default function CompetencyMapLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
