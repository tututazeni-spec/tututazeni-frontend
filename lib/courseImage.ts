// frontend/lib/courseImage.ts
// Processamento da imagem do curso no browser: cover-crop 16:9 +
// redimensionamento para 640×360 via <canvas>, devolvido como data URL JPEG.
// Sem dependências — o backend guarda a string tal e qual em
// Course.thumbnailUrl. Irmão de lib/image.ts (avatar), mas 16:9 em vez de
// quadrado porque a imagem é sempre mostrada em `aspect-video object-cover`
// (CourseCard, MyEnrollmentsView, CourseDetailView).

/** Tem de ser ≤ ao @MaxLength(700_000) de CreateCourseDto.thumbnailUrl no backend. */
export const MAX_COURSE_IMAGE_DATA_URL_LEN = 700_000;

/** Rejeição rápida antes de sequer descodificar o ficheiro. */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

const TARGET_W = 640;
const TARGET_H = 360;
const TARGET_RATIO = TARGET_W / TARGET_H;

/**
 * Área de origem a desenhar para preencher (cover) um alvo com rácio
 * `targetRatio`, centrada. Recorta as laterais numa imagem larga, o
 * topo/fundo numa imagem alta.
 */
export function computeCoverCrop(
  w: number,
  h: number,
  targetRatio = TARGET_RATIO,
): { sx: number; sy: number; sw: number; sh: number } {
  const sourceRatio = w / h;
  if (sourceRatio > targetRatio) {
    const sw = Math.round(h * targetRatio);
    return { sx: Math.floor((w - sw) / 2), sy: 0, sw, sh: h };
  }
  const sh = Math.round(w / targetRatio);
  return { sx: 0, sy: Math.floor((h - sh) / 2), sw: w, sh };
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Não foi possível ler o ficheiro'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Ficheiro de imagem inválido'));
    img.src = src;
  });
}

function draw(
  img: HTMLImageElement,
  outW: number,
  outH: number,
  quality: number,
): string {
  const { sx, sy, sw, sh } = computeCoverCrop(
    img.naturalWidth,
    img.naturalHeight,
  );
  const canvas = document.createElement('canvas');
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D indisponível');
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
  return canvas.toDataURL('image/jpeg', quality);
}

export async function resizeCourseImageToDataUrl(file: File): Promise<string> {
  const img = await loadImage(await readFileAsDataUrl(file));

  let out = draw(img, TARGET_W, TARGET_H, 0.85);
  if (out.length > 400_000) out = draw(img, TARGET_W, TARGET_H, 0.7);
  if (out.length > 550_000) out = draw(img, 480, 270, 0.7);
  if (out.length > MAX_COURSE_IMAGE_DATA_URL_LEN)
    throw new Error('IMAGE_TOO_LARGE');
  return out;
}
