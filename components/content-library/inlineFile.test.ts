import { describe, expect, test } from 'vitest';
import { MAX_UPLOAD_BYTES, validateUpload } from './inlineFile';

const file = (size: number, type: string) =>
  new File([new Uint8Array(size)], 'x', { type });

describe('validateUpload', () => {
  test('aceita um PDF até 5 MB', () => {
    expect(validateUpload(file(1024, 'application/pdf'))).toBeNull();
    expect(validateUpload(file(MAX_UPLOAD_BYTES, 'video/mp4'))).toBeNull();
  });

  test('rejeita acima de 5 MB', () => {
    expect(
      validateUpload(file(MAX_UPLOAD_BYTES + 1, 'application/pdf')),
    ).toMatch(/máximo é 5 MB/);
  });

  test('rejeita tipos não suportados e ficheiros vazios', () => {
    expect(validateUpload(file(10, 'application/x-msdownload'))).toMatch(
      /não suportado/,
    );
    expect(validateUpload(file(0, 'application/pdf'))).toMatch(/vazio/);
  });
});
