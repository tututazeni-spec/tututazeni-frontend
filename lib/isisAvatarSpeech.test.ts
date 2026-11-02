import { describe, expect, it } from 'vitest';
import {
  pcmDurationMs,
  splitForSpeech,
  splitPcm,
  trimSilence,
} from './isisAvatarSpeech';

describe('isisAvatarSpeech', () => {
  it('divide o PCM em pedaços de 6000 bytes sem perder bytes', () => {
    const chunks = splitPcm(new Uint8Array(14000));
    expect(chunks.map((c) => c.length)).toEqual([6000, 6000, 2000]);
  });

  it('1 segundo de PCM16 a 16 kHz são 32000 bytes', () => {
    expect(pcmDurationMs(new Uint8Array(32000))).toBe(1000);
  });

  it('o 1.º pedaço é só a primeira frase; o resto junta-se até ao limite', () => {
    const text = 'Olá! ' + 'Esta é uma frase de tamanho médio. '.repeat(10);
    const pieces = splitForSpeech(text);
    expect(pieces[0]).toBe('Olá!');
    expect(pieces.length).toBeGreaterThan(1);
    expect(pieces.every((p, i) => i === 0 || p.length <= 300)).toBe(true);
    expect(pieces.join(' ').replace(/\s+/g, ' ')).toBe(
      text.trim().replace(/\s+/g, ' '),
    );
  });

  it('texto sem pontuação vira um único pedaço', () => {
    expect(splitForSpeech('sem pontuação')).toEqual(['sem pontuação']);
  });

  it('trimSilence corta o silêncio das pontas e mantém 20 ms de margem', () => {
    const pcm = new Uint8Array(32000); // 1 s de silêncio
    const view = new DataView(pcm.buffer);
    for (let i = 8000; i < 8100; i++) view.setInt16(i * 2, 5000, true);
    const out = trimSilence(pcm);
    expect(out.length).toBe((100 + 2 * 320) * 2);
  });

  it('trimSilence não mexe em áudio todo silêncio', () => {
    const pcm = new Uint8Array(1000);
    expect(trimSilence(pcm)).toBe(pcm);
  });
});
