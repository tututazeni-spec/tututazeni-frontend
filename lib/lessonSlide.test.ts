import { describe, expect, test } from 'vitest';
import {
  MAX_SLIDE_UPLOAD_BYTES,
  assertUploadableSlide,
  fileToSlideDataUrl,
} from './lessonSlide';

const PPTX_MIME =
  'application/vnd.openxmlformats-officedocument.presentationml.presentation';

function fakeFile(bytes: number, name = 'deck.pptx', type = PPTX_MIME): File {
  return new File([new Uint8Array(bytes)], name, { type });
}

describe('assertUploadableSlide', () => {
  test('aceita um .pptx dentro do limite', () => {
    expect(() => assertUploadableSlide(fakeFile(1024))).not.toThrow();
  });

  test('aceita pela extensão quando o browser não preenche o MIME', () => {
    expect(() =>
      assertUploadableSlide(fakeFile(1024, 'deck.pptx', '')),
    ).not.toThrow();
  });

  test('aceita o legado .ppt', () => {
    expect(() =>
      assertUploadableSlide(
        fakeFile(1024, 'deck.ppt', 'application/vnd.ms-powerpoint'),
      ),
    ).not.toThrow();
  });

  test('recusa um ficheiro que não é apresentação', () => {
    expect(() =>
      assertUploadableSlide(fakeFile(1024, 'foto.png', 'image/png')),
    ).toThrow('NOT_A_SLIDE');
  });

  test('recusa uma apresentação acima do limite de upload', () => {
    expect(() =>
      assertUploadableSlide(fakeFile(MAX_SLIDE_UPLOAD_BYTES + 1)),
    ).toThrow('SLIDE_TOO_LARGE');
  });
});

describe('fileToSlideDataUrl', () => {
  test('devolve um data URL base64', async () => {
    const url = await fileToSlideDataUrl(fakeFile(64));
    expect(url.startsWith('data:')).toBe(true);
    expect(url).toContain(';base64,');
  });

  test('rejeita um ficheiro que não é apresentação', async () => {
    await expect(
      fileToSlideDataUrl(fakeFile(64, 'foto.png', 'image/png')),
    ).rejects.toThrow('NOT_A_SLIDE');
  });
});
