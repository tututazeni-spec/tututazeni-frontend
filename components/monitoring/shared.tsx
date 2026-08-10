// components/monitoring/shared.tsx

export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="p-6">
      <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
        {message}
        <button onClick={onRetry} className="ml-4 underline">
          Tentar novamente
        </button>
      </div>
    </div>
  );
}

export function ListSkeleton({
  rows = 4,
  height = 'h-32',
}: {
  rows?: number;
  height?: string;
}) {
  return (
    <div className="p-6 space-y-4">
      {[...Array(rows)].map((_, i) => (
        <div
          key={i}
          className={`${height} bg-gray-100 rounded-lg animate-pulse`}
        />
      ))}
    </div>
  );
}
