import { describe, expect, it } from 'vitest';
import { textToVisemes, VISEMES } from './visemes';

const at = (text: string) => textToVisemes(text);

describe('textToVisemes', () => {
  it('devolve um visema por carácter', () => {
    expect(at('Olá mundo!')).toHaveLength('Olá mundo!'.length);
  });
  it('mapeia vogais e bilabiais', () => {
    expect(at('mapa')).toEqual(['mbp', 'a', 'mbp', 'a']);
  });
  it('trata dígrafos nos dois caracteres', () => {
    expect(at('chá').slice(0, 2)).toEqual(['chj', 'chj']);
    expect(at('filho').slice(2, 4)).toEqual(['lhnh', 'lhnh']);
    expect(at('rr')).toEqual(['r', 'r']);
  });
  it('trata ão/ou como um só som e pausas como repouso', () => {
    expect(at('não')).toEqual(['i', 'ao', 'ao']);
    expect(at('sou')).toEqual(['i', 'ao', 'ao']);
    expect(at('a b')[1]).toBe('rest');
  });
  it('só usa visemas conhecidos', () => {
    const all = new Set<string>(VISEMES);
    for (const v of at('Explicar de outra forma — próximo passo, quinhentos!'))
      expect(all.has(v)).toBe(true);
  });
});
