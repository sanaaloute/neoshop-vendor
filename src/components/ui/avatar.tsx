"use client";

import { useState } from "react";
import { resolveImageUrl } from "@/lib/image-url";
import { cn } from "@/lib/utils";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export interface AvatarProps {
  src?: string | null;
  name: string;
  alt?: string;
  className?: string;
  fallbackClassName?: string;
}

/**
 * Renders a user avatar image when a valid URL is provided, falling back to
 * initials on missing src or image load failure. This prevents broken-image
 * icons for relative paths, expired URLs, or empty values.
 */
export function Avatar({
  src,
  name,
  alt,
  className,
  fallbackClassName,
}: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const resolvedSrc = resolveImageUrl(src);
  const hasSrc = Boolean(resolvedSrc);

  if (!hasSrc || failed) {
    return (
      <div
        className={cn(
          "bg-primary/10 text-primary flex items-center justify-center rounded-full text-xs font-semibold",
          fallbackClassName,
          className
        )}
        aria-label={alt ?? name}
      >
        {initials(name)}
      </div>
    );
  }

  return (
    <img
      src={resolvedSrc!}
      alt={alt ?? name}
      className={cn("rounded-full object-cover", className)}
      onError={() => setFailed(true)}
    />
  );
}
