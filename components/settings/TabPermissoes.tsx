// components/settings/TabPermissoes.tsx
// Tab "Permissões": role actual e permissões agrupadas por prefixo.
// Extraído de app/(platform)/settings/page.tsx.

'use client';

import type { CurrentUser as Me } from '@/hooks/useCurrentUser';
import { card } from './styles';

interface TabPermissoesProps {
  user: Me;
}

export function TabPermissoes({ user }: TabPermissoesProps) {
  const permissions = user.role?.permissions ?? [];

  const grouped = permissions.reduce(
    (acc, p) => {
      const parts = p.name.split('.');
      const group = parts[0] ?? 'outros';
      if (!acc[group]) acc[group] = [];
      acc[group].push(p.name);
      return acc;
    },
    {} as Record<string, string[]>,
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      {/* Role info */}
      <div style={{ ...card, gridColumn: '1 / -1' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: 'linear-gradient(135deg, #1e40af, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 800,
              fontSize: 20,
            }}
          >
            {user.role?.name?.charAt(0) ?? '?'}
          </div>
          <div>
            <p
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 700,
                color: '#1e293b',
              }}
            >
              Role: {user.role?.name ?? 'Sem role'}
            </p>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
              {permissions.length} permissões activas
            </p>
          </div>
        </div>
      </div>

      {/* Permissões agrupadas */}
      {Object.keys(grouped).length === 0 ? (
        <div
          style={{
            ...card,
            gridColumn: '1 / -1',
            textAlign: 'center',
            padding: 40,
          }}
        >
          <p style={{ color: '#94a3b8', fontSize: 13 }}>
            Nenhuma permissão específica atribuída ao teu role.
          </p>
        </div>
      ) : (
        Object.entries(grouped).map(([group, perms]) => (
          <div key={group} style={card}>
            <h4
              style={{
                margin: '0 0 14px',
                fontSize: 12,
                fontWeight: 700,
                color: '#1e40af',
                textTransform: 'uppercase',
                letterSpacing: 0.8,
              }}
            >
              {group}
            </h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {perms.map((p) => (
                <span
                  key={p}
                  style={{
                    padding: '4px 10px',
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 600,
                    background: '#eff6ff',
                    color: '#1e40af',
                    border: '1px solid #bfdbfe',
                  }}
                >
                  ✓ {p}
                </span>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
