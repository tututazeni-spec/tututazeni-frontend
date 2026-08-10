// components/settings/TabPerfil.tsx
// Tab "Perfil": cartão principal, informação organizacional e badges
// recentes. Extraído de app/(platform)/settings/page.tsx.

'use client';

import type { CurrentUser as Me } from '@/hooks/useCurrentUser';
import { card } from './styles';

interface TabPerfilProps {
  user: Me;
}

export function TabPerfil({ user }: TabPerfilProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      {/* Cartão principal */}
      <div style={{ ...card, gridColumn: '1 / -1' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* Avatar */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              flexShrink: 0,
              background: 'linear-gradient(135deg, #1e40af, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              fontWeight: 800,
              color: '#fff',
            }}
          >
            {user.fullName.charAt(0).toUpperCase()}
          </div>
          <div style={{ flex: 1 }}>
            <h2
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 800,
                color: '#1e293b',
              }}
            >
              {user.fullName}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: '#64748b' }}>
              {user.email}
            </p>
            <div
              style={{
                display: 'flex',
                gap: 8,
                marginTop: 10,
                flexWrap: 'wrap',
              }}
            >
              {user.role && (
                <span
                  style={{
                    padding: '3px 10px',
                    borderRadius: 20,
                    fontSize: 11,
                    fontWeight: 700,
                    background: '#eff6ff',
                    color: '#1e40af',
                  }}
                >
                  {user.role.name}
                </span>
              )}
              <span
                style={{
                  padding: '3px 10px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 700,
                  background: user.active ? '#ecfdf5' : '#fef2f2',
                  color: user.active ? '#16a34a' : '#dc2626',
                }}
              >
                {user.active ? '● Activo' : '● Inactivo'}
              </span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: '#94a3b8',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: 0.8,
              }}
            >
              Pontos
            </p>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: 28,
                fontWeight: 800,
                color: '#f59e0b',
              }}
            >
              ⭐ {user.points?.points?.toLocaleString('pt-PT') ?? 0}
            </p>
          </div>
        </div>

        {user.profile?.bio && (
          <div
            style={{
              marginTop: 16,
              padding: '12px 16px',
              background: '#f8fafc',
              borderRadius: 8,
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: 13,
                color: '#475569',
                fontStyle: 'italic',
              }}
            >
              &quot;{user.profile.bio}&quot;
            </p>
          </div>
        )}
      </div>

      {/* Info organizacional */}
      <div style={card}>
        <h3
          style={{
            margin: '0 0 16px',
            fontSize: 14,
            fontWeight: 700,
            color: '#1e293b',
          }}
        >
          📋 Informação Organizacional
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[
            { label: 'Departamento', value: user.department?.name },
            { label: 'Unidade', value: user.unit?.name },
            { label: 'Cargo', value: user.position?.name },
            { label: 'Nível', value: user.position?.level },
            {
              label: 'Membro desde',
              value: new Date(user.createdAt).toLocaleDateString('pt-PT', {
                year: 'numeric',
                month: 'long',
              }),
            },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>
                {label}
              </span>
              <span style={{ fontSize: 13, color: '#1e293b', fontWeight: 500 }}>
                {value ?? '—'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Badges */}
      <div style={card}>
        <h3
          style={{
            margin: '0 0 16px',
            fontSize: 14,
            fontWeight: 700,
            color: '#1e293b',
          }}
        >
          🏅 Badges Recentes
        </h3>
        {!user.badgeAwards?.length ? (
          <p
            style={{
              color: '#94a3b8',
              fontSize: 13,
              textAlign: 'center',
              padding: '20px 0',
            }}
          >
            Nenhum badge conquistado ainda.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {user.badgeAwards.map((b, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  background: '#fffbeb',
                  borderRadius: 10,
                  border: '1px solid #fde68a',
                }}
              >
                <span style={{ fontSize: 22 }}>🏅</span>
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#1e293b',
                    }}
                  >
                    {b.badge.name}
                  </p>
                  {b.badge.description && (
                    <p
                      style={{
                        margin: '2px 0 0',
                        fontSize: 11,
                        color: '#94a3b8',
                      }}
                    >
                      {b.badge.description}
                    </p>
                  )}
                </div>
                <span style={{ fontSize: 11, color: '#94a3b8' }}>
                  {new Date(b.awardedAt).toLocaleDateString('pt-PT')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
