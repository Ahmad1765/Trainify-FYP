import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("shimmer rounded-lg bg-fitness-dark-gray/70", className)}
      {...props}
    />
  )
}

export { Skeleton }
