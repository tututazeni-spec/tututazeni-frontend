// components/enrollments/AdminView.tsx
// Separador "Gestão (Admin)" — container do ciclo de 2 passos: seleccionar um
// curso/formação (AdminPicker) e só depois ver a lista de matriculados
// (AdminCourseTable/AdminTrainingTable). O escopo por papel (ADMIN/RH/DIRECTOR
// vêem tudo; GESTOR/LIDER só o próprio departamento; INSTRUCTOR só o que
// lecciona) é aplicado no backend em cada um dos dois passos.

'use client';

import { useState } from 'react';
import { AdminCourseTable } from './AdminCourseTable';
import { AdminPicker } from './AdminPicker';
import { AdminTrainingTable } from './AdminTrainingTable';
import type { ManageableSelection } from './types';

export function AdminView() {
  const [selection, setSelection] = useState<ManageableSelection | null>(null);

  if (!selection) {
    return <AdminPicker onSelect={setSelection} />;
  }

  if (selection.kind === 'course') {
    return (
      <AdminCourseTable
        courseId={selection.id}
        title={selection.title}
        onBack={() => setSelection(null)}
      />
    );
  }

  return (
    <AdminTrainingTable
      trainingId={selection.id}
      title={selection.title}
      onBack={() => setSelection(null)}
    />
  );
}
