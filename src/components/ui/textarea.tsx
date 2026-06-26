import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "border-input placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 disabled:bg-input/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40 focus-visible:bg-background/60 flex field-sizing-content min-h-16 w-full cursor-text rounded-lg border bg-transparent px-2.5 py-2 text-base transition-all duration-200 outline-none focus-visible:ring-3 focus-visible:ring-offset-0 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:ring-3 md:text-sm",
        "hover:border-ring/40 hover:bg-background/40",
        className
      )}
      {...props}
    />
  );
}

export { Textarea };
