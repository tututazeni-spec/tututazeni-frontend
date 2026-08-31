'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Search } from 'lucide-react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { Avatar } from '@/components/ui/Avatar';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { AvatarUploader } from '@/components/ui/AvatarUploader';

interface TopbarProps {
  title?: string;
}

export default function Topbar({ title }: TopbarProps) {
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  // Contador de não lidas — mesma key/endpoint que a página de notificações,
  // por isso partilha cache e refresca ao marcar como lida por lá.
  const { data: unread } = useApiQuery<{ count: number }>(
    queryKeys.notifications.unreadCount(),
    '/notifications/my/unread-count',
    { refetchInterval: 60_000 },
  );
  const hasUnread = (unread?.count ?? 0) > 0;

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 240,
        right: 0,
        height: 56,
        background: '#ffffff',
        borderBottom: '1px solid #e2e8f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        zIndex: 90,
      }}
    >
      {/* Left: optional title + search */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {title && (
          <span
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: '#1e293b',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </span>
        )}
        <form
          role="search"
          onSubmit={submitSearch}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: '#f1f5f9',
            borderRadius: 8,
            padding: '6px 12px',
            width: 280,
          }}
        >
          <button
            type="submit"
            aria-label="Pesquisar"
            style={{
              display: 'flex',
              alignItems: 'center',
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
            }}
          >
            <Search size={14} color="#94a3b8" />
          </button>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar..."
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: 13,
              color: '#1e293b',
              width: '100%',
            }}
          />
        </form>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button
          type="button"
          onClick={() => router.push('/notifications')}
          aria-label="Notificações"
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <Bell size={18} color="#64748b" />
          {hasUnread && (
            <span
              data-testid="unread-indicator"
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: '#ef4444',
              }}
            />
          )}
        </button>

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir foto de perfil"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          <Avatar
            name={user?.fullName ?? 'Utilizador'}
            url={user?.avatarUrl ?? undefined}
            size="sm"
          />
          <div style={{ textAlign: 'left' }}>
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#1e293b',
                margin: 0,
              }}
            >
              {user?.fullName ?? 'Utilizador'}
            </p>
            <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>
              {user?.email ?? ''}
            </p>
          </div>
        </button>

        <Modal open={open} onOpenChange={setOpen}>
          <ModalContent title="Foto de perfil">
            <div className="mt-4">
              <AvatarUploader
                name={user?.fullName ?? 'Utilizador'}
                url={user?.avatarUrl ?? undefined}
                size="lg"
              />
            </div>
          </ModalContent>
        </Modal>
      </div>
    </header>
  );
}
