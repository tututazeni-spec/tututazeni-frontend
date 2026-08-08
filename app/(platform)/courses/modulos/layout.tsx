import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Módulos & Lições' };

export default function CoursesModulosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
