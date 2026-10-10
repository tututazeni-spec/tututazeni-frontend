// lib/gender.ts
// Rótulos pt-PT para o enum Gender (prisma/schema.prisma). Valor desconhecido
// devolve-se tal como veio, para não esconder dados novos.

const GENDER_LABELS: Record<string, string> = {
  MALE: 'Masculino',
  FEMALE: 'Feminino',
  NON_BINARY: 'Não-binário',
  PREFER_NOT_TO_SAY: 'Prefere não dizer',
};

export function genderLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  return GENDER_LABELS[value.toUpperCase()] ?? value;
}
