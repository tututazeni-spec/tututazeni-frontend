// components/settings/TabSeguranca.tsx
// Tab "Segurança" (docs/modulo_settings.md §4): alteração de senha (todos),
// 2FA/sessões/histórico pessoais (todos) e política + contas bloqueadas +
// sessões/histórico da organização (ADMIN) — /settings/security/*.
//
// Container: cada cartão liga um hook de dados (hooks/use*.ts) à sua vista de
// apresentação em ./seguranca/. As regras puras estão em ./seguranca/logic.ts.

'use client';

import { useToast } from '@/providers/ToastProvider';
import { useChangePassword } from '@/hooks/useChangePassword';
import { useLockedUsers } from '@/hooks/useLockedUsers';
import { useLoginHistory } from '@/hooks/useLoginHistory';
import { useSecurityPolicy } from '@/hooks/useSecurityPolicy';
import { useMySessions, useOrgSessions } from '@/hooks/useSecuritySessions';
import { useTwoFactor } from '@/hooks/useTwoFactor';
import { AllSessionsCardView } from './seguranca/AllSessionsCardView';
import { LockedUsersCardView } from './seguranca/LockedUsersCardView';
import { LoginHistoryCardView } from './seguranca/LoginHistoryCardView';
import { MySessionsCardView } from './seguranca/MySessionsCardView';
import { PasswordCardView } from './seguranca/PasswordCardView';
import { SecurityPolicyCardView } from './seguranca/SecurityPolicyCardView';
import { TwoFactorCardView } from './seguranca/TwoFactorCardView';
import type { ToastFn } from './seguranca/logic';

interface TabSegurancaProps {
  isAdmin?: boolean;
  onToast?: ToastFn;
}

export function TabSeguranca({ isAdmin = false, onToast }: TabSegurancaProps) {
  const toast = useToast();
  const toastFn: ToastFn = (msg, type) => {
    if (onToast) {
      onToast(msg, type);
    } else {
      toast({ title: msg, intent: type === 'error' ? 'danger' : 'success' });
    }
  };

  return (
    <div className="space-y-4">
      <PasswordCard toastFn={toastFn} />
      <TwoFactorCard toastFn={toastFn} />
      <MySessionsCard toastFn={toastFn} />
      <LoginHistoryCard
        title="O meu histórico de logins"
        basePath="/settings/security/me/login-history"
        showOutcomeFilter={false}
      />

      {isAdmin && (
        <>
          <SecurityPolicyCard toastFn={toastFn} />
          <LockedUsersCard toastFn={toastFn} />
          <AllSessionsCard toastFn={toastFn} />
          <LoginHistoryCard
            title="Histórico de logins (organização)"
            basePath="/settings/security/login-history"
            showOutcomeFilter
          />
        </>
      )}
    </div>
  );
}

interface CardProps {
  toastFn: ToastFn;
}

function PasswordCard({ toastFn }: CardProps) {
  return <PasswordCardView ctl={useChangePassword(toastFn)} />;
}

function TwoFactorCard({ toastFn }: CardProps) {
  return <TwoFactorCardView ctl={useTwoFactor(toastFn)} />;
}

function MySessionsCard({ toastFn }: CardProps) {
  return <MySessionsCardView ctl={useMySessions(toastFn)} />;
}

function SecurityPolicyCard({ toastFn }: CardProps) {
  return <SecurityPolicyCardView ctl={useSecurityPolicy(toastFn)} />;
}

function LockedUsersCard({ toastFn }: CardProps) {
  return <LockedUsersCardView ctl={useLockedUsers(toastFn)} />;
}

function AllSessionsCard({ toastFn }: CardProps) {
  return <AllSessionsCardView ctl={useOrgSessions(toastFn)} />;
}

interface LoginHistoryCardProps {
  title: string;
  basePath: string;
  showOutcomeFilter: boolean;
}

function LoginHistoryCard({
  title,
  basePath,
  showOutcomeFilter,
}: LoginHistoryCardProps) {
  return (
    <LoginHistoryCardView
      title={title}
      showOutcomeFilter={showOutcomeFilter}
      ctl={useLoginHistory(basePath)}
    />
  );
}
