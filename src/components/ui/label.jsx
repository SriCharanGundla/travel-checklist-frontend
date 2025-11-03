import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"

import { cn } from "@/lib/utils"

function Label({
  className,
  required = false,
  ...props
}) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      data-required={required}
      className={cn(
        "flex items-center gap-2 text-sm font-medium leading-none text-foreground select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:opacity-50 peer-disabled:cursor-not-allowed peer-disabled:opacity-50",
        required && "after:ml-1 after:text-destructive after:content-['*']",
        className
      )}
      {...props} />
  );
}

export { Label }
