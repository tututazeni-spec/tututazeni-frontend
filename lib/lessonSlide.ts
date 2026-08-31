// frontend/lib/lessonSlide.ts
// Processamento do PPTX/PPT de uma lição no browser: valida tipo/tamanho e
// devolve o ficheiro como data URL base64. Irmão do lib/lessonPdf.ts — o
// backend guarda a string tal e qual em Lesson.contentUrl (mesmo padrão do
// avatar/thumbnail/PDF). Uma apresentação não é redimensionável, só validada.

/** Rejeição rápida antes de ler o ficheiro. ~5 MB de PPTX ≈ 6.85 MB em base64. */
export const MAX_SLIDE_UPLOAD_BYTES = 5 * 1024 * 1024;

/** Tem de ser ≤ ao @MaxLength(7_000_000) de CreateModuleLessonDto.contentUrl no backend. */
export const MAX_SLIDE_DATA_URL_LEN = 7_000_000;

/** MIME types aceites: .pptx (OpenXML) e o legado .ppt. */
const SLIDE_MIME_TYPES = new Set([
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint',
]);

/**
 * Valida que `file` é um PPTX/PPT dentro do limite de upload. Lança um Error
 * com `message` estável (`'NOT_A_SLIDE'` | `'SLIDE_TOO_LARGE'`) para o
 * chamador traduzir numa mensagem de UI.
 *
 * Alguns browsers não preenchem `file.type` para .pptx — nesse caso caímos
 * para a extensão do nome.
 */
export function assertUploadableSlide(file: File): void {
  const byExt = /\.pptx?$/i.test(file.name);
  const byMime = SLIDE_MIME_TYPES.has(file.type);
  if (!byMime && !byExt) throw new Error('NOT_A_SLIDE');
  if (file.size > MAX_SLIDE_UPLOAD_BYTES) throw new Error('SLIDE_TOO_LARGE');
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
 * Lê a apresentação escolhida como data URL. Valida antes (tipo/tamanho) e
 * depois (comprimento da string vs. limite do backend).
 */
export async function fileToSlideDataUrl(file: File): Promise<string> {
  assertUploadableSlide(file);
  const dataUrl = await readFileAsDataUrl(file);
  if (dataUrl.length > MAX_SLIDE_DATA_URL_LEN)
    throw new Error('SLIDE_TOO_LARGE');
  return dataUrl;
}

/** Mensagem de UI (PT) para os erros estáveis lançados acima. */
export function slideErrorMessage(err: unknown): string {
  const code = err instanceof Error ? err.message : String(err);
  if (code === 'NOT_A_SLIDE')
    return 'O ficheiro tem de ser uma apresentação PowerPoint (.pptx ou .ppt).';
  if (code === 'SLIDE_TOO_LARGE')
    return `A apresentação é demasiado grande (máx. ${Math.floor(
      MAX_SLIDE_UPLOAD_BYTES / (1024 * 1024),
    )} MB).`;
  return 'Não foi possível carregar a apresentação.';
}
