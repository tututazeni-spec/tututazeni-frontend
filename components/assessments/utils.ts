// components/assessments/utils.ts
// Helper puro de parsing de opções (a API devolve `options` ainda como
// JSON bruto). Extraído verbatim de
// app/(platform)/assessments/page.tsx.

import type { QOption } from './types';

export function parseOptions(optionsJson: unknown): QOption[] | null {
  if (!optionsJson) return null;
  try {
    return typeof optionsJson === 'string'
      ? JSON.parse(optionsJson)
      : (optionsJson as QOption[]);
  } catch {
    return null;
  }
}
