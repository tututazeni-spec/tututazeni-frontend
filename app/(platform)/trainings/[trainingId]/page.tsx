'use client';
// Rota autónoma de detalhe de treinamento — permite link directo a partir de
// fora do módulo /trainings (ex: "Minhas Matrículas" em /enrollments) sem
// depender do estado de navegação interno de app/(platform)/trainings/page.tsx,
// que só guarda { view, selectedId } em useState local.

import { useParams, useRouter } from 'next/navigation';
import { DetailView } from '@/components/trainings/DetailView';

export default function TrainingDetailPage() {
  const router = useRouter();
  const params = useParams();
  const trainingId = parseInt((params?.trainingId as string) ?? '0');

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <DetailView
        trainingId={trainingId}
        onBack={() => router.push('/trainings')}
      />
    </div>
  );
}
