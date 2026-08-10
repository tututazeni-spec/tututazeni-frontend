// components/ui/FormField.tsx
// Envolve label + hint/erro à volta de um Input/Textarea/Select — id/aria
// ligados automaticamente para não repetir a lógica de a11y em cada página.

import type { ReactNode } from 'react';

export interface FormFieldProps {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}

export function FormField({ label, htmlFor, hint, error, children }: FormFieldProps) {
  const hintId = hint ? `${htmlFor}-hint` : undefined;
  const errorId = error ? `${htmlFor}-error` : undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="font-body text-xs font-medium text-ink">
        {label}
      </label>
      {children}
      {error ? (
        <span id={errorId} className="font-body text-xs text-danger">
          {error}
        </span>
      ) : hint ? (
        <span id={hintId} className="font-body text-xs text-ink-muted">
          {hint}
        </span>
      ) : null}
    </div>
  );
}
