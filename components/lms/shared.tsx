// components/lms/shared.tsx

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

export function CardGridSkeleton() {
  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="h-48 bg-gray-100 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="p-6 space-y-4">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="h-24 bg-gray-100 rounded-lg animate-pulse" />
      ))}
    </div>
  );
}

export function MyPathsSkeleton() {
  return (
    <div className="p-6 space-y-4">
      <div className="h-24 bg-gray-100 rounded-lg animate-pulse" />
      <div className="h-40 bg-gray-100 rounded-lg animate-pulse" />
    </div>
  );
}
