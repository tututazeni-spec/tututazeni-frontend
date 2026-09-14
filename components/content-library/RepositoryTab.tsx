// components/content-library/RepositoryTab.tsx
//
// Fusão do antigo módulo `library` (repositório documental — itens,
// colecções, aprovação, comentários) no módulo "Biblioteca" unificado.
// Reaproveita tal e qual o hook + a view que já existiam em
// app/(platform)/library/page.tsx — nada foi reescrito, só re-embrulhado
// como separador. As rotas `/library/novo` e `/library/[id]` continuam a
// existir e são para onde os cards/link "Adicionar Recurso" desta vista
// apontam.

import { useLibraryList } from '@/hooks/useLibraryList';
import { LibraryListView } from '@/components/library/LibraryListView';

export function RepositoryTab() {
  const props = useLibraryList();
  return <LibraryListView {...props} />;
}
