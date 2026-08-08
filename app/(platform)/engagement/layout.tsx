import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Participação' };

export default function EngagementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
