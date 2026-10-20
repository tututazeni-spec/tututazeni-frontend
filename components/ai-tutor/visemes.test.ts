import { describe, expect, it } from 'vitest';
import { pickViseme, textToVisemes, VISEMES } from './visemes';

const at = (text: string) => textToVisemes(text);

describe('textToVisemes', () => {
  it('devolve um visema por carácter', () => {
    expect(at('Olá mundo!')).toHaveLength('Olá mundo!'.length);
  });
  it('mapeia vogais tónicas e bilabiais', () => {
    expect(at('mapa')).toEqual(['mbp', 'a', 'mbp', 'schwa']);
  });
  it('trata dígrafos nos dois caracteres', () => {
    expect(at('chá').slice(0, 2)).toEqual(['chj', 'chj']);
    expect(at('filho').slice(2, 4)).toEqual(['lhnh', 'lhnh']);
    expect(at('rr')).toEqual(['r', 'r']);
  });
  it('trata ão/ou como um só som e pausas como repouso', () => {
    expect(at('não')).toEqual(['i', 'ao', 'ao']);
    expect(at('sou')).toEqual(['sz', 'ao', 'ao']);
    expect(at('a b')[1]).toBe('rest');
  });
  it('separa s/z de t/d/n/l e distingue ó', () => {
    expect(at('sá')[0]).toBe('sz');
    expect(at('tá')[0]).toBe('i');
    expect(at('avó')[2]).toBe('oa');
  });
  it('reduz vogais átonas (pt-PT) e mantém a tónica', () => {
    expect(at('fale')).toEqual(['fv', 'a', 'i', 'schwa']);
    expect(at('polícia')[1]).toBe('u');
    expect(at('de')[1]).toBe('schwa');
    expect(at('café')[3]).toBe('e');
  });
  it('só usa visemas conhecidos', () => {
    const all = new Set<string>(VISEMES);
    for (const v of at('Explicar de outra forma — próximo passo, quinhentos!'))
      expect(all.has(v)).toBe(true);
  });
});

describe('pickViseme', () => {
  it('escolhe a pose mais frequente da janela', () => {
    expect(pickViseme(['a', 'a', 'i', 'a'])).toBe('a');
  });
  it('dá peso aos fechos de lábios e desempata pela mais recente', () => {
    expect(pickViseme(['mbp', 'a'])).toBe('mbp');
    expect(pickViseme(['e', 'i'])).toBe('i');
    expect(pickViseme([])).toBe('rest');
  });
});
