// components/ui/Table.tsx
import type {
  HTMLAttributes,
  TableHTMLAttributes,
  ThHTMLAttributes,
  TdHTMLAttributes,
} from 'react';
import { cn } from '@/lib/cn';

export function Table({
  className,
  wrapperClassName,
  ...props
}: TableHTMLAttributes<HTMLTableElement> & { wrapperClassName?: string }) {
  return (
    <div
      className={cn(
        'overflow-x-auto rounded-card border border-border bg-surface',
        wrapperClassName,
      )}
    >
      <table
        className={cn(
          'w-full border-collapse font-body text-sm text-ink',
          className,
        )}
        {...props}
      />
    </div>
  );
}

export function TableHead({
  className,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn('bg-surface-sunken', className)} {...props} />;
}

export function TableBody(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props} />;
}

export function TableRow({
  className,
  ...props
}: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'border-b border-border transition-colors duration-150 last:border-0 hover:bg-surface-sunken/60',
        className,
      )}
      {...props}
    />
  );
}

export function TableHeaderCell({
  className,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-ink-muted',
        className,
      )}
      {...props}
    />
  );
}

export function TableCell({
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn('px-4 py-3', className)} {...props} />;
}
