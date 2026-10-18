// lib/openDataUrl.ts
// Abre um data URL (base64) num separador novo. Os browsers bloqueiam a
// navegação para `data:`, por isso converte-se em Blob. Não usa fetch(): o CSP
// `connect-src 'self'` bloqueia fetch para `data:` ("Failed to fetch").

export function openDataUrl(dataUrl: string): void {
  const comma = dataUrl.indexOf(',');
  if (!dataUrl.startsWith('data:') || comma < 0) return;
  const mime =
    dataUrl.slice(5, comma).split(';')[0] || 'application/octet-stream';
  const binary = atob(dataUrl.slice(comma + 1));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const url = URL.createObjectURL(new Blob([bytes], { type: mime }));
  window.open(url, '_blank', 'noopener');
  // Só libertar depois de o separador ter tido tempo de carregar o blob.
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
