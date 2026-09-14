import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Biblioteca — Repositório' };

export default function LibraryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
