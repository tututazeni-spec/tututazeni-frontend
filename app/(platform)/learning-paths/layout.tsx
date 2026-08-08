import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Percursos de Aprendizagem' };

export default function LearningPathsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
