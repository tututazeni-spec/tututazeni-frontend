'use client';
import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Home, Menu, Search } from 'lucide-react';
import { useMobileNavStore } from '@/lib/mobileNav';
import { FeedbackButton } from '@/components/product/FeedbackButton';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { useApiQuery } from '@/hooks/useApiQuery';
import { queryKeys } from '@/lib/queryKeys';
import { Avatar } from '@/components/ui/Avatar';
import { Modal, ModalContent } from '@/components/ui/Modal';
import { AvatarUploader } from '@/components/ui/AvatarUploader';
import { useAnyModalOpen } from '@/lib/modalVisibility';
import { pollInterval } from '@/lib/polling';
import { Input } from '@/components/ui/Input';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

interface TopbarProps {
  title?: string;
}

export default function Topbar({ title }: TopbarProps) {
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const anyModalOpen = useAnyModalOpen();
  const mobileNavOpen = useMobileNavStore((s) => s.open);
  const toggleMobileNav = useMobileNavStore((s) => s.toggle);

  // Contador de não lidas — mesma key/endpoint que a página de notificações,
  // por isso partilha cache e refresca ao marcar como lida por lá.
  const { data: unread } = useApiQuery<{ count: number }>(
    queryKeys.notifications.unreadCount(),
    '/notifications/my/unread-count',
    // silent: polling de fundo do badge — uma falha transitória (ex.: backend a
    // reiniciar) não deve gerar toast/erro na consola; o próximo ciclo recupera.
    { refetchInterval: pollInterval(60_000), meta: { silent: true } },
  );
  const hasUnread = (unread?.count ?? 0) > 0;

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <header
      className="app-topbar"
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        height: 56,
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
        // Auto-oculta-se enquanto qualquer Modal está aberto — o header tem
        // z-index acima do Overlay/Content do Modal, por isso sem isto
        // ficaria por cima do modal a interferir com os cliques.
        display: anyModalOpen ? 'none' : 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
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
              color: 'var(--color-ink)',
              whiteSpace: 'nowrap',
            }}
          >
            {title}
          </span>
        )}
        <button
          type="button"
          className="app-menu-button"
          onClick={toggleMobileNav}
          aria-label="Abrir menu de navegação"
          aria-expanded={mobileNavOpen}
          aria-controls="navegacao-principal"
          style={{
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 44,
            minHeight: 44,
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          <Menu size={20} color="var(--color-ink-muted)" />
        </button>
        <button
          type="button"
          onClick={() => router.push('/dashboard')}
          aria-label="Painel"
          title="Painel"
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
          }}
        >
          <Home size={18} color="var(--color-ink-muted)" />
        </button>
        <form
          role="search"
          className="app-topbar-search"
          onSubmit={submitSearch}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: 'var(--color-surface-sunken)',
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
            <Search size={14} color="var(--color-ink-faint)" />
          </button>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Pesquisar..."
            style={{
              border: 'none',
              background: 'transparent',
              outline: 'none',
              fontSize: 13,
              color: 'var(--color-ink)',
              width: '100%',
            }}
          />
        </form>
      </div>

      {/* Right */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <FeedbackButton />
        <ThemeToggle />
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
          <Bell size={18} color="var(--color-ink-muted)" />
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
                background: 'var(--color-danger)',
              }}
            />
          )}
        </button>

        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir foto de perfil"
          className="app-topbar-identity"
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
                color: 'var(--color-ink)',
                margin: 0,
              }}
            >
              {user?.fullName ?? 'Utilizador'}
            </p>
            <p style={{ fontSize: 11, color: 'var(--color-ink-faint)', margin: 0 }}>
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
