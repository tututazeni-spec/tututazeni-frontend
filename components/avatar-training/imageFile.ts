// components/avatar-training/imageFile.ts
// Imagem do avatar enviada como ficheiro: o backend não tem multipart, guarda
// um data URL base64 em imageUrl (validado por @IsUrlOrInlineFile, máx. 5 MB).
// Aceitamos até 5 MB; imagens grandes são reduzidas no browser para não
// arrastar megabytes em cada lista de avatares.

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
];
export const IMAGE_ACCEPT = IMAGE_MIME_TYPES.join(',');

const KEEP_ORIGINAL_BELOW = 700 * 1024;
const MAX_SIDE = 800;

/** Devolve a mensagem de erro, ou null se o ficheiro é aceitável. */
export function validateImageFile(file: {
  size: number;
  type: string;
}): string | null {
  if (file.size === 0) return 'O ficheiro está vazio.';
  if (file.size > MAX_IMAGE_BYTES)
    return `O ficheiro tem ${(file.size / (1024 * 1024)).toFixed(1)} MB — o máximo é 5 MB.`;
  if (!IMAGE_MIME_TYPES.includes(file.type))
    return 'Formato não suportado — use PNG, JPEG, WebP ou GIF.';
  return null;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () =>
      reject(reader.error ?? new Error('Falha a ler o ficheiro'));
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

/** Lê o ficheiro como data URL; imagens grandes (não GIF) são reduzidas. */
export async function imageFileToDataUrl(file: File): Promise<string> {
  const original = await readAsDataUrl(file);
  if (file.size <= KEEP_ORIGINAL_BELOW || file.type === 'image/gif')
    return original;
  const img = await loadImage(original);
  const scale = Math.min(
    1,
    MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight),
  );
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return original;
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const out = canvas.toDataURL('image/jpeg', 0.85);
  return out.length < original.length ? out : original;
}
