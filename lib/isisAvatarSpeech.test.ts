import { describe, expect, it } from 'vitest';
import { pcmDurationMs, splitPcm } from './isisAvatarSpeech';

describe('isisAvatarSpeech', () => {
  it('divide o PCM em pedaços de 6000 bytes sem perder bytes', () => {
    const chunks = splitPcm(new Uint8Array(14000));
    expect(chunks.map((c) => c.length)).toEqual([6000, 6000, 2000]);
  });

  it('1 segundo de PCM16 a 16 kHz são 32000 bytes', () => {
    expect(pcmDurationMs(new Uint8Array(32000))).toBe(1000);
  });
});
