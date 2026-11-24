// components/users/UserProfile.tsx
// Container: useUserProfile trata as 3 queries + mutação de acção; a
// apresentação (header, tabs, TeamView) vive em
// components/users/UserProfileView.tsx. Extraído de
// app/(platform)/users/page.tsx.

'use client';

import { useState } from 'react';
import { useUserProfile, type ProfileTab } from '@/hooks/useUserProfile';
import { useHasRole } from '@/hooks/useCurrentRole';
import { ADMIN_ROLES } from '@/lib/roles';
import { EditUserView } from './EditUserView';
import { UserProfileView } from './UserProfileView';

interface UserProfileProps {
  userId: number;
  onBack: () => void;
}

export function UserProfile({ userId, onBack }: UserProfileProps) {
  const [tab, setTab] = useState<ProfileTab>('overview');
  const [editing, setEditing] = useState(false);
  const canEdit = useHasRole(ADMIN_ROLES);
  const { user, loadingUser, stats, actionLoading, handleAction } =
    useUserProfile(userId);

  if (editing && user) {
    return (
      <EditUserView
        user={user}
        onBack={() => setEditing(false)}
        onSaved={() => setEditing(false)}
      />
    );
  }

  return (
    <UserProfileView
      userId={userId}
      onBack={onBack}
      tab={tab}
      onTabChange={setTab}
      user={user}
      loadingUser={loadingUser}
      stats={stats}
      actionLoading={actionLoading}
      onAction={handleAction}
      onEdit={canEdit ? () => setEditing(true) : undefined}
    />
  );
}
