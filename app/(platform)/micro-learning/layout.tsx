import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Micro-aprendizagem' };

export default function MicroLearningLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
