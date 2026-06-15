import DOMPurify from 'isomorphic-dompurify';

// Sanitiza HTML antes de o injectar com dangerouslySetInnerHTML.
// Usar SEMPRE que se renderiza HTML proveniente da BD/IA/utilizadores
// (conteúdo de lições, artigos, micro-aprendizagem, respostas do tutor IA).
// Mitiga XSS armazenado: remove <script>, handlers on*, javascript: URLs, etc.
export function sanitizeHtml(html: string | null | undefined): string {
  return DOMPurify.sanitize(html ?? '');
}
