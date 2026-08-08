import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Planos de Carreira' };

export default function CareerPlansLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
