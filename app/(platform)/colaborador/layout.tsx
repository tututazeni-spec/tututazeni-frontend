import DashboardShell from "../../components/DashboardShell";
 
export default function ColaboradorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}