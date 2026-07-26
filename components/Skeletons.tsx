function Block({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-neutral-200 ${className}`} />;
}

export function CardsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-neutral-200 bg-white p-4">
          <Block className="h-3 w-20" />
          <Block className="mt-2 h-4 w-40" />
          <Block className="mt-3 h-3 w-full" />
          <Block className="mt-4 h-5 w-16" />
        </div>
      ))}
    </div>
  );
}

export function KanbanSkeleton() {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {Array.from({ length: 5 }).map((_, col) => (
        <div key={col} className="flex w-72 flex-shrink-0 flex-col rounded-xl border border-neutral-200 bg-neutral-50/60">
          <div className="border-b border-neutral-200 px-3 py-2.5">
            <Block className="h-3 w-20" />
          </div>
          <div className="space-y-2 p-2">
            {Array.from({ length: col === 0 ? 3 : 1 }).map((_, i) => (
              <div key={i} className="rounded-lg border border-neutral-200 bg-white p-3">
                <Block className="h-3 w-16" />
                <Block className="mt-2 h-4 w-32" />
                <Block className="mt-3 h-3 w-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="border-b border-neutral-200 px-4 py-2.5">
        <Block className="h-3 w-full max-w-md" />
      </div>
      <div className="divide-y divide-neutral-100">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3">
            <Block className="h-3 w-24" />
            <Block className="h-3 w-32" />
            <Block className="h-4 w-20 rounded-full" />
            <Block className="h-3 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function CalendarSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="rounded-xl border border-neutral-200 bg-white p-4 lg:col-span-2">
        <Block className="h-4 w-32" />
        <div className="mt-4 grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, i) => (
            <Block key={i} className="h-16" />
          ))}
        </div>
      </div>
      <div className="rounded-xl border border-neutral-200 bg-white p-4">
        <Block className="h-4 w-24" />
        <div className="mt-3 space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Block key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
