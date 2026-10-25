// components/avatar-training/ProgramsTab.tsx
// Formações com Avatar (docs/Avatar_Training.md §2/§4). «Catálogo» (todos): só
// formações publicadas, com pesquisa e categoria. «Gestão» (autoria): criação,
// envio para revisão, publicação (ADMIN/RH) e arquivo. Os papéis espelham
// @Roles em src/avatar-training/avatar-training.controller.ts.
//
// Container: liga os hooks de dados às vistas de apresentação em ./programs/.
//   hooks/useProgramsList.ts  filtros, lista e ciclo de vida
//   hooks/useProgramForm.ts   formulário de criação/edição
//   hooks/useProgramSheet.ts  ficha da formação
//   ./programs/logic.ts       regras puras (validação, payload, textos)

'use client';

import { useState } from 'react';
import { useProgramForm } from '@/hooks/useProgramForm';
import { useProgramSheet } from '@/hooks/useProgramSheet';
import { useProgramsList } from '@/hooks/useProgramsList';
import { ProgramFormView } from './programs/ProgramFormView';
import { ProgramSheetView } from './programs/ProgramSheetView';
import { ProgramsListView } from './programs/ProgramsListView';
import type { AvatarProgramDetail } from './types';

interface ProgramFormModalProps {
  /** Presente = edição (ficha completa); ausente = criação. */
  program?: AvatarProgramDetail;
  onClose: () => void;
  onSaved: () => void;
}

function ProgramFormModal({
  program,
  onClose,
  onSaved,
}: ProgramFormModalProps) {
  const ctl = useProgramForm(program, onSaved, onClose);
  return <ProgramFormView program={program} ctl={ctl} onClose={onClose} />;
}

interface ProgramSheetModalProps {
  programId: number;
  canEdit: boolean;
  onClose: () => void;
  onEdit: (p: AvatarProgramDetail) => void;
}

function ProgramSheetModal({
  programId,
  canEdit,
  onClose,
  onEdit,
}: ProgramSheetModalProps) {
  const ctl = useProgramSheet(programId, canEdit);
  return (
    <ProgramSheetView
      ctl={ctl}
      canEdit={canEdit}
      onClose={onClose}
      onEdit={onEdit}
    />
  );
}

export function ProgramsTab() {
  const list = useProgramsList();
  const [showCreate, setShowCreate] = useState(false);
  const [sheetId, setSheetId] = useState<number | null>(null);
  const [editing, setEditing] = useState<AvatarProgramDetail | null>(null);

  return (
    <>
      <ProgramsListView
        list={list}
        onCreate={() => setShowCreate(true)}
        onOpenSheet={setSheetId}
      />

      {showCreate && (
        <ProgramFormModal
          onClose={() => setShowCreate(false)}
          onSaved={() => list.refetch()}
        />
      )}
      {editing && (
        <ProgramFormModal
          key={editing.id}
          program={editing}
          onClose={() => setEditing(null)}
          onSaved={() => list.refetch()}
        />
      )}
      {sheetId !== null && !editing && (
        <ProgramSheetModal
          programId={sheetId}
          canEdit={list.manage}
          onClose={() => setSheetId(null)}
          onEdit={(p) => {
            setSheetId(null);
            setEditing(p);
          }}
        />
      )}
    </>
  );
}
