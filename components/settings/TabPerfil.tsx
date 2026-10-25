// components/settings/TabPerfil.tsx
// Tab "Perfil": cartão principal, informação organizacional e badges recentes.
// Migrado para componentes UI + tokens de design.

'use client';

import type { CurrentUser as Me } from '@/hooks/useCurrentUser';
import { AvatarUploader } from '@/components/ui/AvatarUploader';
import { Card, CardBody } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';

interface TabPerfilProps {
  user: Me;
}

export function TabPerfil({ user }: TabPerfilProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Cartão principal */}
      {/* Mesmas cores do card "ROI Total" (roi-impact/RoiTotalCard) */}
      <div className="col-span-2 overflow-hidden rounded-panel bg-gradient-to-br from-brand via-brand-mid to-brand-dark p-5 text-white shadow-[0_8px_24px_rgba(15,31,61,0.25)]">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <AvatarUploader
            name={user.fullName}
            url={user.avatarUrl ?? undefined}
            size="lg"
          />
          <div className="flex-1">
            <h2 className="m-0 font-display text-2xl font-bold text-white">
              {user.fullName}
            </h2>
            <p className="mt-1 text-sm text-white">{user.email}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {user.role && (
                <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-on-brand-accent">
                  {user.role.name}
                </span>
              )}
              <span
                className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold"
                style={{ color: user.active ? '#34D399' : '#F87171' }}
              >
                {user.active ? 'Activo' : 'Inactivo'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="m-0 text-xs font-bold uppercase tracking-wider text-white/70">
              Pontos
            </p>
            <p className="mt-1 font-display text-3xl font-bold text-white">
              {user.points?.points?.toLocaleString('pt-PT') ?? 0}
            </p>
          </div>
        </div>

        {user.profile?.bio && (
          <div className="mt-4 rounded-card bg-white/10 px-4 py-3">
            <p className="m-0 text-sm italic text-white/90">
              &quot;{user.profile.bio}&quot;
            </p>
          </div>
        )}
      </div>

      {/* Info organizacional */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-brand/60 text-xs font-medium text-white uppercase tracking-wide">
          Informação Organizacional
        </div>
        <CardBody>
          <div className="space-y-3">
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
                className="flex justify-between items-center pb-3 border-b border-surface-sunken"
              >
                <span className="text-xs text-ink-faint font-semibold">
                  {label}
                </span>
                <span className="text-sm text-ink font-medium">
                  {value ?? '—'}
                </span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Badges */}
      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-border bg-brand/60 text-xs font-medium text-white uppercase tracking-wide">
          Distintivos Recentes
        </div>
        <CardBody>
          {!user.badgeAwards?.length ? (
            <EmptyState
              variant="inline"
              title="Nenhum Distintivo conquistado ainda"
            />
          ) : (
            <div className="space-y-2">
              {user.badgeAwards.map((b, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 bg-accent-subtle rounded-control border border-accent"
                >
                  <span className="text-xl"></span>
                  <div className="flex-1">
                    <p className="m-0 text-sm font-bold text-ink">
                      {b.badge.name}
                    </p>
                    {b.badge.description && (
                      <p className="mt-0.5 text-xs text-ink-muted">
                        {b.badge.description}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-ink-faint">
                    {new Date(b.awardedAt).toLocaleDateString('pt-PT')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
