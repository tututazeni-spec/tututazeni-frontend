// app/declarations/[id]/page.tsx
import { PdfDownloadButton } from '@/components/ui/PdfDownloadButton';

export default function DeclarationDetailPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1>Declaração de Trabalho</h1>
      {/* ... detalhes da declaração ... */}
      <PdfDownloadButton
        type="declaration"
        id={params.id}
        label="Exportar Declaração PDF"
      />
    </div>
  );
}