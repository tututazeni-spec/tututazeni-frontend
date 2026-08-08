import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Escalabilidade' };

export default function ScalabilityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
