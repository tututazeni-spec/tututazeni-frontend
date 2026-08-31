// frontend/lib/image.ts
// Processamento da foto de perfil no browser: center-crop quadrado +
// redimensionamento para 256px via <canvas>, devolvido como data URL JPEG.
// Sem dependências — o backend guarda a string tal e qual em User.avatarUrl.

/** Tem de ser idêntico ao @MaxLength(200_000) do UpdateMyAvatarDto no backend. */
export const MAX_AVATAR_DATA_URL_LEN = 200_000;

/** Rejeição rápida antes de sequer descodificar o ficheiro. */
export const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;

export function computeSquareCrop(
  w: number,
  h: number,
): { sx: number; sy: number; side: number } {
  const side = Math.min(w, h);
  return {
    sx: Math.floor((w - side) / 2),
    sy: Math.floor((h - side) / 2),
    side,
  };
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

function drawSquare(
  img: HTMLImageElement,
  size: number,
  quality: number,
): string {
  const { sx, sy, side } = computeSquareCrop(img.naturalWidth, img.naturalHeight);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D indisponível');
  ctx.drawImage(img, sx, sy, side, side, 0, 0, size, size);
  return canvas.toDataURL('image/jpeg', quality);
}

export async function resizeImageToDataUrl(
  file: File,
  size = 256,
): Promise<string> {
  const img = await loadImage(await readFileAsDataUrl(file));

  let out = drawSquare(img, size, 0.85);
  if (out.length > 120_000) out = drawSquare(img, size, 0.7);
  if (out.length > 160_000) out = drawSquare(img, 192, 0.7);
  if (out.length > MAX_AVATAR_DATA_URL_LEN) throw new Error('IMAGE_TOO_LARGE');
  return out;
}
