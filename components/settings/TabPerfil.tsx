// components/settings/TabPerfil.tsx
// Tab "Perfil": cartão principal, informação organizacional e badges recentes.
// Migrado para componentes UI + tokens de design.

'use client';

import type { CurrentUser as Me } from '@/hooks/useCurrentUser';
import { AvatarUploader } from '@/components/ui/AvatarUploader';
import { Badge } from '@/components/ui/Badge';
import { Card, CardBody } from '@/components/ui/Card';

interface TabPerfilProps {
  user: Me;
}

export function TabPerfil({ user }: TabPerfilProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Cartão principal */}
      <Card className="col-span-2">
        <CardBody>
          <div className="flex items-center gap-5">
            {/* Avatar */}
            <AvatarUploader
              name={user.fullName}
              url={user.avatarUrl ?? undefined}
              size="lg"
            />
            <div className="flex-1">
              <h2 className="m-0 text-2xl font-bold text-ink">
                {user.fullName}
              </h2>
              <p className="mt-1 text-sm text-ink-muted">{user.email}</p>
              <div className="flex gap-2 mt-3 flex-wrap">
                {user.role && <Badge intent="info">{user.role.name}</Badge>}
                <Badge intent={user.active ? 'success' : 'danger'}>
                  {user.active ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <p className="m-0 text-xs text-ink font-bold uppercase tracking-wider">
                Pontos
              </p>
              <p className="mt-1 text-3xl font-bold text-ink">
                {user.points?.points?.toLocaleString('pt-PT') ?? 0}
              </p>
            </div>
          </div>

          {user.profile?.bio && (
            <div className="mt-4 p-3 bg-surface-sunken rounded-lg">
              <p className="m-0 text-sm text-ink-muted italic">
                &quot;{user.profile.bio}&quot;
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Info organizacional */}
      <Card>
        <CardBody>
          <h3 className="mb-4 text-sm font-bold text-ink">
            Informação Organizacional
          </h3>
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
      <Card>
        <CardBody>
          <h3 className="mb-4 text-sm font-bold text-ink">
            Distintivos Recentes
          </h3>
          {!user.badgeAwards?.length ? (
            <p className="text-ink-faint text-sm text-center py-5">
              Nenhum Distintivo conquistado ainda.
            </p>
          ) : (
            <div className="space-y-2">
              {user.badgeAwards.map((b, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 bg-accent-subtle rounded-lg border border-accent"
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
