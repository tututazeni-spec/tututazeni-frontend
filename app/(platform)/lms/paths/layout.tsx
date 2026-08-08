import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'LMS — Percursos & Sessões' };

export default function LmsPathsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
