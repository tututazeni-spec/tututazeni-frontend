// components/ui/PathProgress.tsx
// Motivo de assinatura da direcção "Percurso": indicador de passos em
// ponto-e-linha. Usar só para sequências reais — progresso de curso/
// módulo, PDI, plano de carreira, wizard multi-passo.
import { cn } from '@/lib/cn';

export interface PathStep {
  label: string;
  status: 'done' | 'current' | 'pending';
}

export interface PathProgressProps {
  steps: PathStep[];
  className?: string;
}

export function PathProgress({ steps, className }: PathProgressProps) {
  return (
    <ol className={cn('flex items-center', className)}>
      {steps.map((step, i) => (
        <li key={step.label} className="flex flex-1 items-center last:flex-none">
          <div className="flex flex-col items-center gap-1">
            <span
              className={cn(
                'h-2.5 w-2.5 rounded-full',
                step.status === 'pending' ? 'bg-border-strong' : 'bg-primary',
                step.status === 'current' && 'ring-2 ring-accent-subtle ring-offset-2 ring-offset-canvas',
              )}
              aria-current={step.status === 'current' ? 'step' : undefined}
            />
            <span className="whitespace-nowrap font-body text-[10px] text-ink-muted">
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={cn(
                'mx-1 h-0.5 flex-1',
                step.status === 'done' ? 'bg-primary' : 'bg-border-strong',
              )}
            />
          )}
        </li>
      ))}
    </ol>
  );
}
