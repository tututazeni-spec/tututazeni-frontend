import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Desenvolvimento de Talentos' };

export default function TalentDevelopmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
