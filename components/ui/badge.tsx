import * as React from "react";

import { cn } from "@/lib/utils";

export function Badge({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex min-h-8 items-center rounded-chip px-3 py-1 text-sm font-bold",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
