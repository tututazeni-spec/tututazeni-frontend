import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Liderança' };

export default function LeaderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
