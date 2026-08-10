'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { NAV, TAB_STYLE, btnGhost } from '@/components/settings/styles';
import { TabPerfil } from '@/components/settings/TabPerfil';
import { TabPermissoes } from '@/components/settings/TabPermissoes';
import { TabSeguranca } from '@/components/settings/TabSeguranca';
import { Toast } from '@/components/settings/Toast';
import type { Tab } from '@/components/settings/types';

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>('perfil');
  const [toast, setToast] = useState<{
    msg: string;
    type: 'success' | 'error';
  } | null>(null);
  const {
    data: user,
    isLoading: loading,
    error: queryError,
  } = useCurrentUser();
  const error = queryError?.message ?? '';

  function showToast(msg: string, type: 'success' | 'error') {
    setToast({ msg, type });
  }

  function logout() {
    // Pede ao backend para limpar o cookie httpOnly antes de redireccionar
    // (mesmo padrão de components/Sidebar.tsx) — antes só removia uma
    // chave "token" do localStorage que nunca chegou a ser escrita (a
    // sessão é sempre um cookie httpOnly, nunca localStorage), por isso o
    // cookie de sessão nunca era invalidado no logout por este botão.
    void api.post('/auth/logout', {}).finally(() => {
      window.location.href = '/login';
    });
  }

  if (loading)
    return (
      <div
        style={{
          padding: 60,
          textAlign: 'center',
          color: '#94a3b8',
          fontSize: 14,
        }}
      >
        A carregar perfil...
      </div>
    );

  if (error)
    return (
      <div
        style={{
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 12,
          padding: 24,
          color: '#dc2626',
          fontSize: 13,
        }}
      >
        {error === 'Unauthorized' || error.includes('401')
          ? 'Sessão expirada. Faz login novamente.'
          : error}
      </div>
    );

  if (!user) return null;

  return (
    <div>
      {/* ── Header ── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 24,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: '#1e293b',
              margin: 0,
            }}
          >
            ⚙️ Definições
          </h1>
          <p style={{ color: '#64748b', fontSize: 14, marginTop: 4 }}>
            Perfil, segurança e permissões da conta
          </p>
        </div>
        <button
          onClick={logout}
          style={{
            ...btnGhost,
            color: '#dc2626',
            background: '#fef2f2',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          🚪 Terminar Sessão
        </button>
      </div>

      {/* ── Tabs ── */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          background: '#f1f5f9',
          borderRadius: 10,
          padding: 4,
          marginBottom: 24,
          width: 'fit-content',
        }}
      >
        {NAV.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={TAB_STYLE(tab === t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Conteúdo ── */}
      {tab === 'perfil' && <TabPerfil user={user} />}
      {tab === 'seguranca' && <TabSeguranca onToast={showToast} />}
      {tab === 'permissoes' && <TabPermissoes user={user} />}

      {/* ── Toast ── */}
      {toast && (
        <Toast
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
