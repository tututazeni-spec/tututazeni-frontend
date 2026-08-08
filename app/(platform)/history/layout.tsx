import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Histórico' };

export default function HistoryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
