// Base única da API (auditoria A-1, achado F3): caminho relativo same-origin.
// Em dev o rewrite do next.config.ts faz proxy para o Nest; em produção o
// Caddy interceta /api na borda. Zero dependência de NEXT_PUBLIC_API_URL.
//
// Este ficheiro tinha também o seu próprio cliente fetch + lógica de
// logout-em-401 (`export const api = {...}`), uma 3ª cópia quase idêntica
// da já existente em lib/apiClient.ts — cada uma com a sua própria guarda
// `loggingOut`, por isso um 401 apanhado por um cliente não via o logout já
// disparado pelo outro. Os 2 últimos consumidores (TabSeguranca.tsx e
// settings/page.tsx) foram migrados para o apiClient canónico; ver
// lib/apiClient.ts#logout para o fluxo de logout partilhado.
export const API_URL = '/api';
