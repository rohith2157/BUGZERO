import { cn } from "../../lib/utils";
import { useState } from "react";
import { GradFlow } from 'gradflow'

// Want to create stunning backgrounds and play with the colors and valies check: Check out https://gradflow.meera.dev/

export const StripeGradientShader = ({ className, style, children }) => {
  return (
    <div className={cn("relative w-full overflow-hidden", className)} style={style}>
      <div className="absolute inset-0 z-0">
        <GradFlow config={{
          color1: { r: 255, g: 255, b: 255 },
          color2: { r: 66, g: 255, b: 233 },
          color3: { r: 129, g: 6, b: 190 },
          speed: 0.4,
          scale: 1,
          type: 'stripe',
          noise: 0.08
        }} />
      </div>
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
};
