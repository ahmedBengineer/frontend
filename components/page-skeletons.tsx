import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

function PageShell({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <div className={cn("space-y-6 p-4 md:p-6", className)}>{children}</div>
}

export function PageHeaderSkeleton({ withAction = true }: { withAction?: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 rounded-xl" />
        <Skeleton className="h-4 w-64 rounded-xl" />
      </div>
      {withAction && <Skeleton className="h-10 w-32 rounded-xl" />}
    </div>
  )
}

export function FilterBarSkeleton({ filters = 2 }: { filters?: number }) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <Skeleton className="h-11 flex-1 rounded-xl" />
      {Array.from({ length: filters }).map((_, i) => (
        <Skeleton key={i} className="h-11 w-48 rounded-xl" />
      ))}
    </div>
  )
}

export function StatsCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div
      className={cn(
        "grid gap-4",
        count === 3 && "grid-cols-1 md:grid-cols-3",
        count === 4 && "grid-cols-1 md:grid-cols-4",
        count !== 3 && count !== 4 && "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-slate-200/60 p-4 text-center"
        >
          <Skeleton className="h-8 w-12 mx-auto mb-2 rounded-xl" />
          <Skeleton className="h-4 w-20 mx-auto rounded-xl" />
        </div>
      ))}
    </div>
  )
}

export function CardGridSkeleton({
  cards = 6,
  columns = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
}: {
  cards?: number
  columns?: string
}) {
  return (
    <div className={cn("grid gap-4 md:gap-6", columns)}>
      {Array.from({ length: cards }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden"
        >
          <div className="p-5 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <Skeleton className="h-6 w-40 rounded-xl" />
                <Skeleton className="h-4 w-24 rounded-xl" />
              </div>
              <Skeleton className="h-8 w-8 rounded-xl" />
            </div>
          </div>
          <div className="p-5 space-y-3">
            <Skeleton className="h-4 w-full rounded-xl" />
            <Skeleton className="h-4 w-3/4 rounded-xl" />
            <Skeleton className="h-4 w-1/2 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function TablePageSkeleton({
  rows = 5,
  cols = 6,
}: {
  rows?: number
  cols?: number
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 overflow-hidden">
      <div className="p-5 border-b border-slate-100 space-y-2">
        <Skeleton className="h-6 w-48 rounded-xl" />
        <Skeleton className="h-4 w-64 rounded-xl" />
      </div>
      <div className="p-5 space-y-4">
        <div className={cn("grid gap-4", `grid-cols-${cols}`)} style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
          {Array.from({ length: cols }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full rounded-xl" />
          ))}
        </div>
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="grid gap-4"
            style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: cols }).map((_, j) => (
              <Skeleton key={j} className="h-4 w-full rounded-xl" />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function ConversationsTableSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton withAction={false} />
      <div className="space-y-4">
        <Skeleton className="h-10 w-96 rounded-xl" />
        <FilterBarSkeleton filters={2} />
        <TablePageSkeleton rows={5} cols={9} />
      </div>
    </div>
  )
}

export function ViewAgentsPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton withAction={false} />
      <StatsCardsSkeleton count={4} />
      <CardGridSkeleton cards={4} columns="grid-cols-1 lg:grid-cols-2" />
    </div>
  )
}

export function EditAgentsPageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <CardGridSkeleton cards={4} columns="grid-cols-1 lg:grid-cols-2" />
    </div>
  )
}

export function CompaniesPageSkeleton() {
  return (
    <PageShell>
      <Skeleton className="h-20 w-full rounded-2xl" />
      <FilterBarSkeleton filters={2} />
      <CardGridSkeleton cards={8} columns="grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" />
    </PageShell>
  )
}

export function AgentGridPageSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Skeleton className="h-48 w-full rounded-none" />
      <PageShell className="max-w-7xl mx-auto">
        <StatsCardsSkeleton count={3} />
        <FilterBarSkeleton filters={2} />
        <CardGridSkeleton cards={9} columns="grid-cols-1 md:grid-cols-2 lg:grid-cols-3" />
      </PageShell>
    </div>
  )
}

export function FormSectionsSkeleton({ sections = 4 }: { sections?: number }) {
  return (
    <>
      {Array.from({ length: sections }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-slate-200/60 p-6 space-y-4"
        >
          <Skeleton className="h-6 w-40 rounded-xl" />
          <Skeleton className="h-4 w-64 rounded-xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      ))}
    </>
  )
}

export function FormPageSkeleton({ sections = 4 }: { sections?: number }) {
  return (
    <PageShell>
      <PageHeaderSkeleton />
      <FormSectionsSkeleton sections={sections} />
    </PageShell>
  )
}

export function DashboardPageSkeleton() {
  return (
    <PageShell className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-80 lg:col-span-2 rounded-3xl" />
        <Skeleton className="h-80 rounded-3xl" />
      </div>
      <Skeleton className="h-[420px] w-full rounded-3xl" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </PageShell>
  )
}

export function AuthPageSkeleton() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center space-y-3">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <Skeleton className="h-8 w-48 rounded-xl" />
          <Skeleton className="h-4 w-64 rounded-xl" />
        </div>
        <div className="bg-white rounded-2xl border border-slate-200/60 p-8 space-y-5">
          <div className="space-y-2">
            <Skeleton className="h-4 w-16 rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-16 rounded-xl" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <Skeleton className="h-11 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}

export function BillingPlansSkeleton() {
  return (
    <PageShell>
      <PageHeaderSkeleton />
      <FilterBarSkeleton filters={0} />
      <CardGridSkeleton cards={6} columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3" />
    </PageShell>
  )
}

export function ListRowsSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="h-10 w-10 rounded-xl shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40 rounded-xl" />
            <Skeleton className="h-3 w-56 rounded-xl" />
          </div>
          <Skeleton className="h-8 w-20 rounded-xl" />
        </div>
      ))}
    </div>
  )
}

export function ListPageSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <PageShell>
      <PageHeaderSkeleton />
      <FilterBarSkeleton />
      <ListRowsSkeleton rows={rows} />
    </PageShell>
  )
}

export function MapPageSkeleton() {
  return (
    <PageShell>
      <PageHeaderSkeleton />
      <Skeleton className="h-[600px] w-full rounded-3xl" />
    </PageShell>
  )
}

export function SimplePageSkeleton() {
  return (
    <PageShell>
      <PageHeaderSkeleton />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </PageShell>
  )
}
