// components/onboarding/utils.ts
// Verificação de prazo expirado. Extraído de
// app/(platform)/onboarding/page.tsx.

export function isOverdue(d: string | null): boolean {
  return !!d && new Date() > new Date(d);
}
