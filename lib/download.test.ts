import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildQuery, downloadFromApi, saveBlob } from './download';

describe('buildQuery', () => {
  it('omite valores vazios, undefined e null', () => {
    expect(buildQuery({ a: '1', b: '', c: undefined, d: null, e: 0 })).toBe(
      '?a=1&e=0',
    );
  });

  it('devolve string vazia sem parâmetros', () => {
    expect(buildQuery()).toBe('');
    expect(buildQuery({ a: undefined })).toBe('');
  });
});

describe('saveBlob / downloadFromApi', () => {
  let clicked: { href: string; download: string }[];

  beforeEach(() => {
    vi.useFakeTimers();
    clicked = [];
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (
      this: HTMLAnchorElement,
    ) {
      clicked.push({ href: this.href, download: this.download });
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('só revoga o object URL depois de um atraso (evita 0 bytes no Chrome)', () => {
    saveBlob(new Blob(['x']), 'a.csv');
    expect(clicked[0].download).toBe('a.csv');
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    vi.advanceTimersByTime(60_000);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:x');
  });

  it('usa o nome do Content-Disposition e envia a query', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('x', {
        headers: {
          'Content-Disposition': 'attachment; filename="rel%201.pdf"',
        },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    await downloadFromApi('/x/export', {
      params: { format: 'pdf', q: '' },
      fallbackName: 'fb.pdf',
    });
    expect(fetchMock).toHaveBeenCalledWith('/api/x/export?format=pdf', {
      credentials: 'include',
    });
    expect(clicked[0].download).toBe('rel 1.pdf');
  });

  it('`filename` tem prioridade e `fallbackName` cobre a falta de cabeçalho', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async () => new Response('x')),
    );
    await downloadFromApi('/a', {
      filename: 'forcado.csv',
      fallbackName: 'fb',
    });
    await downloadFromApi('/a', { fallbackName: 'fb.csv' });
    expect(clicked.map((c) => c.download)).toEqual(['forcado.csv', 'fb.csv']);
  });

  it('lança a message do backend, ou errorMessage se o corpo não for JSON', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify({ message: 'Sem permissão' }), {
            status: 403,
          }),
        )
        .mockResolvedValueOnce(new Response('<html>', { status: 500 })),
    );
    await expect(downloadFromApi('/a')).rejects.toThrow('Sem permissão');
    await expect(
      downloadFromApi('/a', { errorMessage: 'Falha ao exportar' }),
    ).rejects.toThrow('Falha ao exportar');
    expect(clicked).toHaveLength(0);
  });
});
