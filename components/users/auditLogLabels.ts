// components/users/auditLogLabels.ts
// Rótulos em português das acções escritas em UserAuditLog — lista de
// eventos do docs/modulo_users.md Ponto 6 ("Registar alterações como…").
// Partilhado entre AuditHistoryView.tsx (Histórico & Auditoria) e a secção
// "Histórico de importações" de ImportView.tsx (mesma tabela, action
// BULK_IMPORT).

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  USER_CREATED: 'Utilizador criado',
  USER_UPDATED: 'Dados alterados',
  DEPARTMENT_CHANGED: 'Departamento alterado',
  POSITION_CHANGED: 'Cargo alterado',
  MANAGER_CHANGED: 'Gestor alterado',
  PROFILE_CHANGED: 'Perfil alterado',
  USER_ACTIVATED: 'Conta ativada',
  USER_DEACTIVATED: 'Conta desativada',
  USER_SUSPENDED: 'Conta suspensa',
  USER_SOFT_DELETED: 'Conta eliminada',
  PASSWORD_CHANGED: 'Password alterada',
  MFA_ENABLED: 'MFA ativado',
  MFA_DISABLED: 'MFA desativado',
  LOGIN: 'Login',
  LOGOUT: 'Logout',
  BULK_IMPORT: 'Importação em massa',
};

export function auditActionLabel(action: string): string {
  return AUDIT_ACTION_LABELS[action] ?? action;
}

/** Extrai um resumo legível do JSON.stringify guardado em UserAuditLog.meta. */
export function describeAuditMeta(action: string, meta: string | null): string | null {
  if (!meta) return null;
  try {
    const parsed = JSON.parse(meta) as Record<string, unknown>;
    if ('from' in parsed || 'to' in parsed) {
      const from = parsed.from ?? '—';
      const to = parsed.to ?? '—';
      return `de "${from}" para "${to}"`;
    }
    if (action === 'BULK_IMPORT') {
      return `${parsed.created ?? 0} criados, ${parsed.updated ?? 0} atualizados, ${parsed.errors ?? 0} erros (${parsed.total ?? 0} linhas)`;
    }
    if (action === 'USER_UPDATED' && Array.isArray(parsed.fields)) {
      return `campos: ${(parsed.fields as string[]).join(', ')}`;
    }
    if (typeof parsed.reason === 'string' && parsed.reason) return `motivo: ${parsed.reason}`;
    return null;
  } catch {
    return null;
  }
}
