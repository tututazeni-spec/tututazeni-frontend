import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Planos de Desenvolvimento' };

export default function DevelopmentPlansLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
