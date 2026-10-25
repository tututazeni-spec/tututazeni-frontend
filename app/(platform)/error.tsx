'use client';

// Error boundary das páginas da plataforma. Fica dentro do layout, por isso a
// Sidebar e a Topbar continuam utilizáveis quando uma página rebenta (o
// app/error.tsx da raiz substituiria tudo). Cada módulo tem o seu error.tsx
// com o mesmo corpo, para o erro ficar isolado na rota que rebentou.

import { RouteError } from '@/components/ui/RouteError';

export default function PlatformError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError {...props} source="app/(platform)/error.tsx" />;
}
