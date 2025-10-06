import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "src/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex touch-none select-none items-center",
      // Horizontal/vertical sizing handled via data-orientation
      "data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className="relative grow overflow-hidden rounded-full bg-secondary data-[orientation=horizontal]:h-2 data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-2 data-[orientation=vertical]:h-full">
      <SliderPrimitive.Range className="absolute h-full bg-primary" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
