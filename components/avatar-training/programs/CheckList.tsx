// components/avatar-training/programs/CheckList.tsx
// Lista de caixas de selecção com altura limitada (apresentação).

export function CheckList<T extends number | string = number>({
  legend,
  options,
  selected,
  onChange,
  emptyText,
}: {
  legend: string;
  options: { id: T; label: string }[];
  selected: T[];
  onChange: (ids: T[]) => void;
  emptyText: string;
}) {
  return (
    <fieldset>
      <legend className="mb-1 font-body text-sm font-medium text-ink">
        {legend}
      </legend>
      <div className="max-h-32 space-y-1 overflow-y-auto rounded-control border border-border bg-surface p-2">
        {options.length === 0 ? (
          <p className="font-body text-xs text-ink-faint">{emptyText}</p>
        ) : (
          options.map((o) => (
            <label
              key={o.id}
              className="flex items-center gap-2 font-body text-sm text-ink"
            >
              <input
                type="checkbox"
                checked={selected.includes(o.id)}
                onChange={(e) =>
                  onChange(
                    e.target.checked
                      ? [...selected, o.id]
                      : selected.filter((x) => x !== o.id),
                  )
                }
              />
              {o.label}
            </label>
          ))
        )}
      </div>
    </fieldset>
  );
}
