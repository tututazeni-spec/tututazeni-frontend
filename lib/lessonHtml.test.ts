import { describe, expect, test } from 'vitest';
import { isHtmlEmpty, lessonTextToHtml } from './lessonHtml';

describe('lessonTextToHtml', () => {
  test('texto simples antigo vira parágrafos com <br> e é escapado', () => {
    const html = lessonTextToHtml('Linha 1\nLinha 2\n\n2 < 3 & 4 > 1');
    expect(html).toBe(
      '<p>Linha 1<br>Linha 2</p><p>2 &lt; 3 &amp; 4 &gt; 1</p>',
    );
  });

  test('HTML do editor mantém a formatação', () => {
    expect(lessonTextToHtml('<h2>Título</h2><p>a <strong>b</strong></p>')).toBe(
      '<h2>Título</h2><p>a <strong>b</strong></p>',
    );
  });

  test('HTML é sanitizado: scripts, handlers e javascript: saem', () => {
    const html = lessonTextToHtml(
      '<p onclick="x()">oi</p><script>alert(1)</script><a href="javascript:alert(1)">l</a><img src=x onerror=alert(1)>',
    );
    expect(html).not.toMatch(/script|onclick|onerror|javascript:/i);
    expect(html).toContain('oi');
  });

  test('vazio/nulo devolve string vazia', () => {
    expect(lessonTextToHtml(null)).toBe('');
    expect(lessonTextToHtml('   ')).toBe('');
  });
});

describe('isHtmlEmpty', () => {
  test.each([
    ['', true],
    ['<p><br></p>', true],
    ['<p>&nbsp;</p>', true],
    ['<p>texto</p>', false],
  ])('%j → %s', (html, expected) => {
    expect(isHtmlEmpty(html)).toBe(expected);
  });
});
