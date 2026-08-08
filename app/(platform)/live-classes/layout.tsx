import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Aulas ao Vivo' };

export default function LiveClassesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
