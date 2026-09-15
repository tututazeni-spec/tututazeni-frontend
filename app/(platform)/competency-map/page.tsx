'use client';

// Rota standalone — o mesmo conteúdo passou a estar disponível também como
// separador "Mapa de Competências" de app/(platform)/competencies/page.tsx
// (módulo "Competências" único na sidebar). Ver
// components/competency-map/CompetencyMapView.tsx.

import { CompetencyMapView } from '@/components/competency-map/CompetencyMapView';

export default function CompetencyMapPage() {
  return <CompetencyMapView />;
}
