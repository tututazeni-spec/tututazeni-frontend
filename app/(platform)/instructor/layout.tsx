import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Instrutores' };

export default function InstructorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
