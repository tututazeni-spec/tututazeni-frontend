import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Programas de Liderança' };

export default function LeadershipLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
