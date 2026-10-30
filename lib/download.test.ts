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
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/x/export?format=pdf',
      expect.objectContaining({ method: 'GET', credentials: 'include' }),
    );
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

describe('openFromApi', () => {
  afterEach(() => vi.restoreAllMocks());

  const mockGetRaw = async (blob: Blob) => {
    const { apiClient } = await import('@/lib/apiClient');
    vi.spyOn(apiClient, 'getRaw').mockResolvedValue({
      blob: () => Promise.resolve(blob),
      headers: new Headers(),
    } as unknown as Response);
  };

  it('abre o ficheiro no separador aberto antes do pedido', async () => {
    const tab = { location: { href: '' }, close: vi.fn() };
    vi.spyOn(window, 'open').mockReturnValue(tab as unknown as Window);
    URL.createObjectURL = vi.fn(() => 'blob:pdf');
    URL.revokeObjectURL = vi.fn();
    await mockGetRaw(new Blob(['%PDF-']));
    const { openFromApi } = await import('./download');
    await openFromApi('/certificates/5/pdf');
    expect(window.open).toHaveBeenCalledWith('', '_blank');
    expect(tab.location.href).toBe('blob:pdf');
  });

  it('com o separador bloqueado, descarrega o ficheiro', async () => {
    vi.spyOn(window, 'open').mockReturnValue(null);
    URL.createObjectURL = vi.fn(() => 'blob:pdf');
    URL.revokeObjectURL = vi.fn();
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => undefined);
    await mockGetRaw(new Blob(['%PDF-']));
    const { openFromApi } = await import('./download');
    await openFromApi('/certificates/5/pdf', { fallbackName: 'c.pdf' });
    expect(click).toHaveBeenCalled();
  });

  it('se o pedido falha, fecha o separador e propaga o erro', async () => {
    const tab = { location: { href: '' }, close: vi.fn() };
    vi.spyOn(window, 'open').mockReturnValue(tab as unknown as Window);
    const { apiClient } = await import('@/lib/apiClient');
    vi.spyOn(apiClient, 'getRaw').mockRejectedValue(new Error('falhou'));
    const { openFromApi } = await import('./download');
    await expect(openFromApi('/x')).rejects.toThrow('falhou');
    expect(tab.close).toHaveBeenCalled();
  });
});
