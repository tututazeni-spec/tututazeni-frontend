import { describe, expect, it } from 'vitest';
import { safeHref } from './safeHref';

describe('safeHref', () => {
  it.each([
    'https://meet.google.com/abc',
    'http://example.com/x?y=1#z',
    'mailto:alguem@example.com',
    'tel:+244900000000',
    '/courses/1/learn',
    '#secao',
  ])('aceita %s', (url) => {
    expect(safeHref(url)).toBe(url);
  });

  it('remove espaços nas pontas', () => {
    expect(safeHref('  https://example.com  ')).toBe('https://example.com');
  });

  it.each([
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    '  javascript:alert(1)',
    'java\tscript:alert(1)',
    'java\nscript:alert(1)',
    'data:text/html,<script>alert(1)</script>',
    'vbscript:msgbox(1)',
    'file:///etc/passwd',
    '//evil.com/x',
    '/\\evil.com',
    'não é um url',
    '',
    '   ',
    null,
    undefined,
  ])('rejeita %j', (url) => {
    expect(safeHref(url as string | null | undefined)).toBeUndefined();
  });
});
