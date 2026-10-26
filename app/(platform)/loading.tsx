import { PageSkeleton } from '@/components/ui/PageSkeleton';

// Fallback por omissão de todas as rotas de (platform): o Sidebar/Topbar ficam
// (vivem no layout) e só a área de conteúdo mostra o esqueleto durante a navegação.
export default function PlatformLoading() {
  return <PageSkeleton />;
}
