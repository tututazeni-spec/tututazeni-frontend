// app/(platform)/dashboard/institutional/page.tsx
//
// O Dashboard Institucional deixou de ser uma página à parte — o seu
// conteúdo (CRM/conhecimento, alertas, tendência, geografia, visão por
// módulo, snapshots) foi consolidado no separador "Executivo" de /dashboard
// (components/dashboard/OrgDashboard.tsx), que agora consome o único
// endpoint GET /dashboard-institutional/executive. Mantém-se aqui só um
// redirect para não partir marcadores/links antigos.

import { redirect } from 'next/navigation';

export default function DashboardInstitutionalRedirectPage() {
  redirect('/dashboard');
}
