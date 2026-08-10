'use client';

import { useLogin } from '@/hooks/useLogin';
import { LoginView } from '@/components/login/LoginView';

export default function LoginPage() {
  const props = useLogin();
  return <LoginView {...props} />;
}
