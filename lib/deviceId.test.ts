// lib/deviceId.test.ts
import { afterEach, describe, expect, test, vi } from 'vitest';
import { getDeviceId } from './deviceId';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.clear();
});

describe('getDeviceId', () => {
  test('gera um UUID v4 e devolve sempre o mesmo neste browser', () => {
    const first = getDeviceId();
    expect(first).toMatch(UUID_V4);
    expect(getDeviceId()).toBe(first);
    expect(localStorage.getItem('innova.deviceId')).toBe(first);
  });

  test('reaproveita um identificador válido já guardado', () => {
    const stored = '3f0c1b0e-6a5d-4a6e-9a47-2f1d6c1c0a11';
    localStorage.setItem('innova.deviceId', stored);
    expect(getDeviceId()).toBe(stored);
  });

  test('ignora um valor guardado que não é UUID v4', () => {
    localStorage.setItem('innova.deviceId', 'lixo');
    const id = getDeviceId();
    expect(id).toMatch(UUID_V4);
    expect(localStorage.getItem('innova.deviceId')).toBe(id);
  });

  test('se o armazenamento falhar devolve na mesma um UUID v4 válido', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado');
    });
    expect(getDeviceId()).toMatch(UUID_V4);
  });
});
