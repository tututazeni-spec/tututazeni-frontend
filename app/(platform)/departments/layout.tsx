import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Departamentos' };

export default function DepartmentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
