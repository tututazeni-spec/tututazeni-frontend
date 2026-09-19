// components/ai-tutor/ComingSoonView.tsx
// Placeholder para as abas ainda por construir (Analytics detalhado e
// Configurações — docs/ai-tutor.md secções 7-8). As abas já aparecem na
// navegação para reflectir a estrutura final do módulo; o conteúdo chega
// numa próxima fase.

import { Construction } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

export function ComingSoonView({
  title,
  description,
  planned,
}: {
  title: string;
  description: string;
  planned: string[];
}) {
  return (
    <Card className="p-8 text-center max-w-xl mx-auto">
      <div className="w-12 h-12 rounded-control bg-primary-subtle text-primary flex items-center justify-center mx-auto mb-4">
        <Construction size={22} strokeWidth={1.75} />
      </div>
      <div className="font-body text-sm font-semibold text-ink mb-1">{title}</div>
      <p className="font-body text-sm text-ink-faint mb-4">{description}</p>
      <div className="flex flex-wrap justify-center gap-2">
        {planned.map((p) => (
          <Badge key={p} intent="neutral" dot={false}>
            {p}
          </Badge>
        ))}
      </div>
    </Card>
  );
}
