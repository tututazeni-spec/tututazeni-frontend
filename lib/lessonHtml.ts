// lib/lessonHtml.ts
// Texto de uma lição → HTML seguro. Lições novas guardam HTML do editor;
// lições antigas guardam texto simples com quebras de linha. As duas formas
// convivem em Lesson.textContent, por isso detecta-se pelo conteúdo.

import { sanitizeHtml } from '@/lib/sanitize';

const HTML_TAG =
  /<\/?(p|br|h[1-6]|ul|ol|li|strong|b|em|i|u|a|blockquote|div|span)\b/i;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/** HTML pronto a injectar (sanitizado). Texto simples vira parágrafos. */
export function lessonTextToHtml(text: string | null | undefined): string {
  const value = (text ?? '').trim();
  if (!value) return '';
  if (HTML_TAG.test(value)) return sanitizeHtml(value);
  return value
    .split(/\n{2,}/)
    .map((p) => `<p>${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

/** `true` se o HTML do editor não tem texto visível (só tags/espaços). */
export function isHtmlEmpty(html: string | null | undefined): boolean {
  return (
    (html ?? '')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim() === ''
  );
}
