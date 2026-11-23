// lib/angolanBanks.ts
// Bancos comerciais angolanos (autorizados pelo BNA) para escolher em formulários
// de pagamento. Valor guardado = nome completo; a sigla serve só para pesquisa.
export const ANGOLAN_BANKS: ReadonlyArray<{ name: string; short: string }> = [
  { name: 'Banco Angolano de Investimentos', short: 'BAI' },
  { name: 'Banco de Fomento Angola', short: 'BFA' },
  { name: 'Banco BIC', short: 'BIC' },
  { name: 'Banco de Poupança e Crédito', short: 'BPC' },
  { name: 'Banco Comercial Angolano', short: 'BCA' },
  { name: 'Banco Económico', short: 'BE' },
  { name: 'Banco Millennium Atlântico', short: 'BMA' },
  { name: 'Standard Bank Angola', short: 'SBA' },
  { name: 'Banco Sol', short: 'SOL' },
  { name: 'Banco Keve', short: 'KEVE' },
  { name: 'Banco de Negócios Internacional', short: 'BNI' },
  { name: 'Banco Angolano de Negócios e Comércio', short: 'BANC' },
  { name: 'Banco Caixa Geral Angola', short: 'BCGA' },
  { name: 'Banco Valor', short: 'BVB' },
  { name: 'Banco Yetu', short: 'YETU' },
  { name: 'Banco VTB África', short: 'VTB' },
  { name: 'Access Bank Angola', short: 'ABA' },
  { name: 'Banco Comercial do Huambo', short: 'BCH' },
  { name: 'Banco Kwanza Invest', short: 'BKI' },
  { name: 'Banco de Investimento Rural', short: 'BIR' },
  { name: 'Banco Mais', short: 'MAIS' },
  { name: 'Banco Prestígio', short: 'BPR' },
];

export const BANK_OTHER = '__OTHER__';
