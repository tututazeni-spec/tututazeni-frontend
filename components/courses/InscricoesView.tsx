// components/courses/InscricoesView.tsx
// Aba "Inscrições" (docs/modulo_courses.md secção 3, ADMIN/RH/GESTOR).
// Consolida o antigo separador próprio "Gestão (Admin)" do módulo standalone
// /enrollments (ver components/enrollments/AdminView) — mesmo padrão de
// consolidação já usado no repo para learning-paths+lms e
// competencies+competency-map.

'use client';

import { useState } from 'react';
import { Zap } from 'lucide-react';
import { AdminView } from '@/components/enrollments/AdminView';
import { BulkEnrollModal } from '@/components/enrollments/BulkEnrollModal';
import { EnrollUserModal } from '@/components/enrollments/EnrollUserModal';
import { Button } from '@/components/ui/Button';

interface InscricoesViewProps {
  /** Pré-filtra a tabela por curso — acção "Ver inscrições" da aba Cursos. */
  initialCourseId?: number;
}

export function InscricoesView({ initialCourseId }: InscricoesViewProps) {
  const [modal, setModal] = useState<'single' | 'bulk' | null>(null);

  return (
    <div>
      <div className="mb-4 flex justify-end gap-2">
        <Button size="sm" onClick={() => setModal('single')}>
          + Matricular
        </Button>
        <Button size="sm" intent="secondary" onClick={() => setModal('bulk')}>
          <Zap size={14} strokeWidth={1.75} />
          Em massa
        </Button>
      </div>

      <AdminView initialCourseId={initialCourseId} />

      {modal === 'single' && (
        <EnrollUserModal
          onClose={() => setModal(null)}
          initialCourseId={initialCourseId}
        />
      )}
      {modal === 'bulk' && (
        <BulkEnrollModal
          onClose={() => setModal(null)}
          initialCourseId={initialCourseId}
        />
      )}
    </div>
  );
}
