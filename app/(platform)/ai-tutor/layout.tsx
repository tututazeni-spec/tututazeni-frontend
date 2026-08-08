import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Tutor de IA' };

export default function AiTutorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
