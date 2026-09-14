'use client';
// Antiga página própria "Módulos & Lições" — fundida na aba "Módulos &
// Lições" da página única de Cursos (ver components/courses/ModulosView.tsx
// e app/(platform)/courses/page.tsx). Esta rota fica só como redirect para
// não partir bookmarks/links antigos a /courses/modulos[?courseId=N].

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CourseModulesRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('tab', 'modulos');
    router.replace(`/courses?${params.toString()}`);
  }, [router]);

  return null;
}
