// app/declarations/[id]/page.tsx
import { PdfDownloadButton } from '@/components/ui/PdfDownloadButton';

// Next.js 15: params é uma Promise e tem de ser aguardada
export default async function DeclarationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div>
      <h1>Declaração de Trabalho</h1>
      {/* ... detalhes da declaração ... */}
      <PdfDownloadButton
        type="declaration"
        id={id}
        label="Exportar Declaração PDF"
      />
    </div>
  );
}