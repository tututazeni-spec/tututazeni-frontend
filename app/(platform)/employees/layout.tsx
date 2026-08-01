// O shell (Sidebar+Topbar) já vem de app/(platform)/layout.tsx — envolver os
// filhos noutro DashboardShell aqui montava tudo a dobrar (2x fetch de
// /auth/me, Sidebar/Topbar duplicados) só nesta rota.
export default function EmployeesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}