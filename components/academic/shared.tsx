// components/academic/shared.tsx

interface InfoProps {
  label: string;
  value: string;
}

export function Info({ label, value }: InfoProps) {
  return (
    <div>
      <p className="text-xs text-gray-400 uppercase">{label}</p>
      <p className="text-sm text-gray-800 font-medium">{value}</p>
    </div>
  );
}

interface SummaryCardProps {
  label: string;
  value: string;
  color?: string;
}

export function SummaryCard({ label, value, color }: SummaryCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <p className="text-xs text-gray-400 uppercase">{label}</p>
      <p className={`text-2xl font-bold ${color || 'text-gray-900'}`}>
        {value}
      </p>
    </div>
  );
}

export function CardGridSkeleton() {
  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-40 bg-gray-100 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <div className="h-32 bg-gray-100 rounded-lg animate-pulse" />
      <div className="h-48 bg-gray-100 rounded-lg animate-pulse" />
    </div>
  );
}
