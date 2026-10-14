"use client";

import * as AvatarPrimitive from "@radix-ui/react-avatar";
import { cn } from "@/lib/utils";

type AvatarProps = {
  initials?: string;
  src?: string;
  alt?: string;
  className?: string;
};

export function Avatar({ initials, src, alt, className }: AvatarProps) {
  return (
    <AvatarPrimitive.Root
      className={cn(
        "relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full",
        className
      )}
    >
      {src && (
        <AvatarPrimitive.Image
          src={src}
          alt={alt ?? initials ?? ""}
          className="aspect-square h-full w-full object-cover"
        />
      )}
      <AvatarPrimitive.Fallback
        delayMs={0}
        className="flex h-full w-full items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary"
      >
        {initials ?? "?"}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
}
