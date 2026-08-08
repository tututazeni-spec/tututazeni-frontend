import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Biblioteca' };

export default function ContentLibraryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
