import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex min-h-12 items-center justify-center gap-2 rounded-full px-5 text-base font-bold transition active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-lift hover:bg-[#05aa9b]",
        secondary: "bg-secondary text-secondary-foreground shadow-lift hover:bg-[#0f172a]",
        outline: "border border-border bg-white text-foreground hover:border-primary hover:text-primary",
        ghost: "text-foreground hover:bg-muted",
        danger: "bg-risk-high text-white shadow-lift hover:bg-[#d63f44]",
      },
      size: {
        default: "min-h-12 px-5",
        sm: "min-h-10 px-4 text-sm",
        lg: "min-h-14 px-7 text-lg",
        icon: "h-12 w-12 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
