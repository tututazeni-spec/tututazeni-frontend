// lib/provinces.ts
// Fonte única das províncias de Angola (códigos de enum do backend).
//
// Antes desta extracção, a mesma lista de 21 códigos estava copiada
// byte-a-byte em components/crm/partners/types.ts e
// components/crm/beneficiaries/types.ts — duas cópias que podiam
// desincronizar ao adicionar/renomear uma província.

export const ANGOLA_PROVINCES = [
  'BENGO',
  'BENGUELA',
  'BIE',
  'CABINDA',
  'CUANDO',
  'CUANZA_NORTE',
  'CUANZA_SUL',
  'CUBANGO',
  'CUNENE',
  'HUAMBO',
  'HUILA',
  'ICOLO_E_BENGO',
  'LUANDA',
  'LUNDA_NORTE',
  'LUNDA_SUL',
  'MALANJE',
  'MOXICO',
  'MOXICO_LESTE',
  'NAMIBE',
  'UIGE',
  'ZAIRE',
] as const;

export type AngolaProvince = (typeof ANGOLA_PROVINCES)[number];
