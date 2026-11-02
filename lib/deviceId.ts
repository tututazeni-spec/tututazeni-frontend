// lib/deviceId.ts
// Identificador do dispositivo (UUID v4 guardado no browser). Serve ao backend para
// reconhecer o dispositivo confiável do instrutor externo; o servidor só guarda o hash.

const KEY = 'innova.deviceId';
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

function newUuid(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // Contextos sem randomUUID (http sem TLS): UUID v4 a partir de getRandomValues.
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export function getDeviceId(): string {
  try {
    const stored = window.localStorage.getItem(KEY);
    if (stored && UUID_V4.test(stored)) return stored;
    const id = newUuid();
    window.localStorage.setItem(KEY, id);
    return id;
  } catch {
    // Armazenamento bloqueado (janela privada): id efémero; o backend tratará como dispositivo novo.
    return newUuid();
  }
}
