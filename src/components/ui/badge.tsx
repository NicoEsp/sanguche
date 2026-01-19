import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center whitespace-nowrap shrink-0 rounded-md border px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        nuevo:
          "border-2 border-pink-500 bg-pink-500 text-white font-bold hover:bg-pink-600",
        founder:
          "border-2 border-amber-500 bg-gradient-to-r from-amber-500 to-yellow-400 text-white font-bold shadow-sm",
        repremium:
          "border-2 border-purple-500 bg-gradient-to-r from-purple-600 to-indigo-500 text-white font-bold shadow-sm",
        cursosAll:
          "border-2 border-emerald-500 bg-gradient-to-r from-emerald-500 to-teal-400 text-white font-bold shadow-sm",
        comped:
          "border-yellow-500/50 bg-yellow-500/20 text-yellow-700 dark:text-yellow-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(badgeVariants({ variant }), className)}
        {...props}
      />
    )
  }
)
Badge.displayName = "Badge"

export { Badge, badgeVariants }
