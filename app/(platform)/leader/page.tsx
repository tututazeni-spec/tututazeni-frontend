// Módulo fundido em /leadership (pedido do utilizador: "Liderança" passa a
// ser um único módulo na sidebar). Todo o conteúdo desta página — Dashboard,
// Equipa, Performance, Pipeline, PDIs — continua intacto em
// components/leader/ e é renderizado a partir de app/(platform)/leadership/
// page.tsx, secção "Gestão de Equipa". Este stub só existe para não
// partir eventuais marcadores/links directos ao path antigo.
import { redirect } from 'next/navigation';

export default function LeaderPageRedirect() {
  redirect('/leadership');
}
