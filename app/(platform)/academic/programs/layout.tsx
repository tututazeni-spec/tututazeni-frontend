import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Gestão Académica' };

export default function AcademicProgramsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
