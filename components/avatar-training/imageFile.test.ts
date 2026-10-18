import { describe, expect, it } from 'vitest';
import { MAX_IMAGE_BYTES, validateImageFile } from './imageFile';

describe('validateImageFile', () => {
  it('aceita imagens até 5 MB', () => {
    expect(validateImageFile({ size: MAX_IMAGE_BYTES, type: 'image/png' })).toBeNull();
  });
  it('rejeita ficheiros acima de 5 MB', () => {
    expect(validateImageFile({ size: MAX_IMAGE_BYTES + 1, type: 'image/png' })).toMatch(/5 MB/);
  });
  it('rejeita formatos que não são imagem e ficheiros vazios', () => {
    expect(validateImageFile({ size: 10, type: 'application/pdf' })).toMatch(/Formato/);
    expect(validateImageFile({ size: 0, type: 'image/png' })).toMatch(/vazio/);
  });
});
