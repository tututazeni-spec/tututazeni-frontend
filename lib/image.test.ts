import { describe, expect, test } from 'vitest';
import { computeSquareCrop } from './image';

describe('computeSquareCrop', () => {
  test('paisagem — recorta as laterais, centrado', () => {
    expect(computeSquareCrop(200, 100)).toEqual({ sx: 50, sy: 0, side: 100 });
  });
  test('retrato — recorta topo/fundo, centrado', () => {
    expect(computeSquareCrop(100, 200)).toEqual({ sx: 0, sy: 50, side: 100 });
  });
  test('quadrado — sem recorte', () => {
    expect(computeSquareCrop(150, 150)).toEqual({ sx: 0, sy: 0, side: 150 });
  });
  test('dimensão ímpar — arredonda o offset para baixo', () => {
    expect(computeSquareCrop(101, 100)).toEqual({ sx: 0, sy: 0, side: 100 });
    expect(computeSquareCrop(105, 100)).toEqual({ sx: 2, sy: 0, side: 100 });
  });
});
