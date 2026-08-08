import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Conhecimento' };

export default function KnowledgeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
