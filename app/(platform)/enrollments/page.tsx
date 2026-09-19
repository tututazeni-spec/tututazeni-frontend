'use client';
// Antiga página própria "Matrículas" — fundida nas abas "Inscrições" e
// "Progresso" da página única de Cursos (docs/modulo_courses.md secções 3-4;
// ver components/courses/InscricoesView.tsx e ProgressoView.tsx). Esta rota
// fica só como redirect para não partir bookmarks/links antigos a
// /enrollments — mesmo padrão de app/(platform)/courses/modulos/page.tsx.

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EnrollmentsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/courses?tab=inscricoes');
  }, [router]);

  return null;
}
