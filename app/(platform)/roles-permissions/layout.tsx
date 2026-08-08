import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Permissões por Cargos' };

export default function RolesPermissionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
