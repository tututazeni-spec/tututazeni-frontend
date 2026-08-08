import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Sucessão' };

export default function SucessionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
