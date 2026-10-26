// src/app/(site)/properties/for-sale/loading.tsx
export default function PropertiesLoading() {
  return (
    <div aria-busy="true" aria-label="Loading properties">
      <div className="h-56 bg-navy-900" />
      <div className="container-page grid gap-8 py-10 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <div className="hidden h-[32rem] animate-pulse rounded-[var(--radius-card)] bg-sand lg:block" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-surface">
              <div className="aspect-[4/3] animate-pulse bg-sand" />
              <div className="space-y-3 p-5">
                <div className="h-5 w-1/2 animate-pulse rounded bg-sand" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-sand" />
                <div className="h-4 w-1/3 animate-pulse rounded bg-sand" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
