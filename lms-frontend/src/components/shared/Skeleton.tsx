export function SkeletonBar({ className = '' }: { className?: string }) {
  return <div className={`shimmer ${className}`} />;
}

export function MetricSkeleton() {
  return (
    <div className="metric-card shimmer-metric">
      <div className="shimmer w-6 h-6 mb-1 rounded" />
      <div className="shimmer w-24 h-3 mt-1 rounded" />
      <div className="shimmer w-16 h-8 mt-1 rounded" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j}>
              <div className="shimmer h-4 w-3/4 rounded" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}
