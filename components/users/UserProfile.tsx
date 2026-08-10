// components/users/UserProfile.tsx
// Container: useUserProfile trata as 3 queries + mutação de acção; a
// apresentação (header, tabs, TeamView) vive em
// components/users/UserProfileView.tsx. Extraído de
// app/(platform)/users/page.tsx.

'use client';

import { useState } from 'react';
import { useUserProfile, type ProfileTab } from '@/hooks/useUserProfile';
import { UserProfileView } from './UserProfileView';

interface UserProfileProps {
  userId: number;
  onBack: () => void;
}

export function UserProfile({ userId, onBack }: UserProfileProps) {
  const [tab, setTab] = useState<ProfileTab>('overview');
  const { user, loadingUser, stats, auditLogs, actionLoading, handleAction } =
    useUserProfile(userId, tab);

  return (
    <UserProfileView
      userId={userId}
      onBack={onBack}
      tab={tab}
      onTabChange={setTab}
      user={user}
      loadingUser={loadingUser}
      stats={stats}
      auditLogs={auditLogs}
      actionLoading={actionLoading}
      onAction={handleAction}
    />
  );
}
