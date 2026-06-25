import { cn } from '@/lib/cn'

// Loading shimmer placeholder, reusing the .shimmer-bg keyframes.
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn('relative overflow-hidden rounded-xl bg-white/[0.04]', className)}>
      <div className="shimmer-bg absolute inset-0 animate-shimmer" />
    </div>
  )
}

export function SkeletonCard() {
  return (
    <div className="glass rounded-2xl p-6">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="mt-4 h-8 w-2/3" />
      <Skeleton className="mt-3 h-2 w-full" />
    </div>
  )
}
