import { describe, expect, test } from 'vitest';
import {
  MAX_PDF_UPLOAD_BYTES,
  assertUploadablePdf,
  fileToPdfDataUrl,
} from './lessonPdf';

function fakeFile(bytes: number, type = 'application/pdf'): File {
  return new File([new Uint8Array(bytes)], 'manual.pdf', { type });
}

describe('assertUploadablePdf', () => {
  test('aceita um PDF dentro do limite', () => {
    expect(() => assertUploadablePdf(fakeFile(1024))).not.toThrow();
  });

  test('recusa um ficheiro que não é PDF', () => {
    expect(() => assertUploadablePdf(fakeFile(1024, 'image/png'))).toThrow(
      'NOT_A_PDF',
    );
  });

  test('recusa um PDF acima do limite de upload', () => {
    expect(() =>
      assertUploadablePdf(fakeFile(MAX_PDF_UPLOAD_BYTES + 1)),
    ).toThrow('PDF_TOO_LARGE');
  });
});

describe('fileToPdfDataUrl', () => {
  test('devolve um data URL application/pdf', async () => {
    const url = await fileToPdfDataUrl(fakeFile(64));
    expect(url.startsWith('data:application/pdf;base64,')).toBe(true);
  });

  test('rejeita um ficheiro que não é PDF', async () => {
    await expect(fileToPdfDataUrl(fakeFile(64, 'image/png'))).rejects.toThrow(
      'NOT_A_PDF',
    );
  });
});
