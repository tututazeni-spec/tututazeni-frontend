import { describe, expect, test } from 'vitest';
import { computeCoverCrop } from './courseImage';

describe('computeCoverCrop (alvo 16:9)', () => {
  test('imagem já 16:9 — sem recorte', () => {
    expect(computeCoverCrop(1600, 900)).toEqual({
      sx: 0,
      sy: 0,
      sw: 1600,
      sh: 900,
    });
  });

  test('imagem muito larga (panorâmica) — recorta as laterais, centrado', () => {
    // 4000×900, alvo 16:9 → sw = 900 * 16/9 = 1600, sx = (4000-1600)/2 = 1200
    expect(computeCoverCrop(4000, 900)).toEqual({
      sx: 1200,
      sy: 0,
      sw: 1600,
      sh: 900,
    });
  });

  test('imagem alta (retrato) — recorta topo/fundo, centrado', () => {
    // 900×1600, alvo 16:9 → sh = 900 * 9/16 = 506, sy = (1600-506)/2 = 547
    expect(computeCoverCrop(900, 1600)).toEqual({
      sx: 0,
      sy: 547,
      sw: 900,
      sh: 506,
    });
  });

  test('quadrado — recorta topo/fundo', () => {
    // 1000×1000 → sh = 1000 * 9/16 = 563, sy = floor((1000-563)/2) = 218
    expect(computeCoverCrop(1000, 1000)).toEqual({
      sx: 0,
      sy: 218,
      sw: 1000,
      sh: 563,
    });
  });

  test('aceita um rácio alvo alternativo', () => {
    // alvo 1:1 numa imagem 200×100 → sw = 100, sx = 50
    expect(computeCoverCrop(200, 100, 1)).toEqual({
      sx: 50,
      sy: 0,
      sw: 100,
      sh: 100,
    });
  });
});
