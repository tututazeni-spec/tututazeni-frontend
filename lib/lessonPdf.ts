// frontend/lib/lessonPdf.ts
// Processamento do PDF de uma lição no browser: valida tipo/tamanho e
// devolve o ficheiro como data URL base64. Sem dependências — o backend
// guarda a string tal e qual em Lesson.contentUrl (mesmo padrão do
// avatar/thumbnail, ver lib/courseImage.ts). Irmão sem <canvas>: um PDF
// não é redimensionável, só validado.

/** Rejeição rápida antes de ler o ficheiro. ~5 MB de PDF ≈ 6.85 MB em base64. */
export const MAX_PDF_UPLOAD_BYTES = 5 * 1024 * 1024;

/** Tem de ser ≤ ao @MaxLength(7_000_000) de CreateModuleLessonDto.contentUrl no backend. */
export const MAX_PDF_DATA_URL_LEN = 7_000_000;

/**
 * Valida que `file` é um PDF dentro do limite de upload. Lança um Error com
 * `message` estável (`'NOT_A_PDF'` | `'PDF_TOO_LARGE'`) para o chamador
 * traduzir numa mensagem de UI.
 */
export function assertUploadablePdf(file: File): void {
  if (file.type !== 'application/pdf') throw new Error('NOT_A_PDF');
  if (file.size > MAX_PDF_UPLOAD_BYTES) throw new Error('PDF_TOO_LARGE');
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Não foi possível ler o ficheiro'));
    reader.readAsDataURL(file);
  });
}

/**
 * Lê o PDF escolhido como data URL. Valida antes (tipo/tamanho) e depois
 * (comprimento da string vs. limite do backend).
 */
export async function fileToPdfDataUrl(file: File): Promise<string> {
  assertUploadablePdf(file);
  const dataUrl = await readFileAsDataUrl(file);
  if (dataUrl.length > MAX_PDF_DATA_URL_LEN) throw new Error('PDF_TOO_LARGE');
  return dataUrl;
}

/** Mensagem de UI (PT) para os erros estáveis lançados acima. */
export function pdfErrorMessage(err: unknown): string {
  const code = err instanceof Error ? err.message : String(err);
  if (code === 'NOT_A_PDF') return 'O ficheiro tem de ser um PDF.';
  if (code === 'PDF_TOO_LARGE')
    return `O PDF é demasiado grande (máx. ${Math.floor(
      MAX_PDF_UPLOAD_BYTES / (1024 * 1024),
    )} MB).`;
  return 'Não foi possível carregar o PDF.';
}
