import { describe, expect, test } from 'vitest';
import { DEFAULT_WELCOME_MESSAGE, renderWelcomeMessage } from './catalog';

describe('renderWelcomeMessage', () => {
  test('sem mensagem usa a geral e insere o primeiro nome', () => {
    const out = renderWelcomeMessage(null, 'Maria da Silva');
    expect(out).toContain('Olá, Maria!');
    expect(out).not.toContain('{{nome}}');
    expect(DEFAULT_WELCOME_MESSAGE).toContain('{{nome}}');
  });

  test('mensagem própria também substitui o marcador', () => {
    expect(
      renderWelcomeMessage('Bem-vindo {{nome}}, {{nome}}!', 'Ana Costa'),
    ).toBe('Bem-vindo Ana, Ana!');
  });
});
