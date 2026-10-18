import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, onFocus, onChange, ...props }, ref) => {
    const isNumber = type === "number"
    return (
      <input
        type={type}
        onFocus={(e) => {
          // Select a lone "0" so typing replaces it.
          if (isNumber && Number(e.target.value) === 0 && e.target.value !== "") e.target.select()
          onFocus?.(e)
        }}
        onChange={(e) => {
          // Drop leading zeros ("0100" -> "100", keep "0.5").
          if (isNumber && /^0\d/.test(e.target.value)) {
            e.target.value = e.target.value.replace(/^0+(?=\d)/, "")
          }
          onChange?.(e)
        }}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
