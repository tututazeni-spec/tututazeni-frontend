import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Avaliações' };

export default function EvaluationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
