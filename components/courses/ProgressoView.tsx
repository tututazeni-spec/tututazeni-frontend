// components/courses/ProgressoView.tsx
// Aba "Progresso" (docs/modulo_courses.md secção 4). Conteúdo por papel:
// GESTOR vê a sua equipa directa (TeamView, já existia no módulo
// /enrollments); ADMIN/RH vêem o rollup por departamento/unidade
// (DepartmentProgressView, novo). "Progresso individual" (o mesmo indicador
// para o colaborador comum) já é coberto pela aba "Meus cursos" — não
// duplicado aqui, ver memory sobre esta consolidação.

'use client';

import { DepartmentProgressView } from '@/components/enrollments/DepartmentProgressView';
import { TeamView } from '@/components/enrollments/TeamView';
import type { Role } from '@/lib/roles';

interface ProgressoViewProps {
  role: Role | undefined;
}

export function ProgressoView({ role }: ProgressoViewProps) {
  const showTeam = role === 'GESTOR';
  const showDepartment = role === 'ADMIN' || role === 'RH';

  return (
    <div className="space-y-8">
      {showTeam && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-ink">Progresso da equipa</h2>
          <TeamView />
        </section>
      )}
      {showDepartment && (
        <section>
          <h2 className="mb-3 text-sm font-semibold text-ink">
            Progresso por departamento/unidade
          </h2>
          <DepartmentProgressView />
        </section>
      )}
    </div>
  );
}
