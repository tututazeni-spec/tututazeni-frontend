'use client';

import { RouteError } from '@/components/ui/RouteError';

export default function ModuleError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteError {...props} source="app/(platform)/work-declaration/error.tsx" />;
}
