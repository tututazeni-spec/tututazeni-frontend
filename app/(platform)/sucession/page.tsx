// Módulo fundido em /career (separador "Sucessão"). Todo o conteúdo desta
// página — Dashboard, Organograma, Posições Críticas, Talent Pool, Matriz
// de Sucessão — continua intacto em components/career/succession/ e é
// renderizado a partir de app/(platform)/career/page.tsx, separador
// "Sucessão". Este stub só existe para não partir marcadores/links directos
// ao path antigo.
import { redirect } from 'next/navigation';

export default function SuccessionPageRedirect() {
  redirect('/career');
}
