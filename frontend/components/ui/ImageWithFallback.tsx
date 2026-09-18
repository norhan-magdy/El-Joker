"use client";

import { useMemo, useState } from "react";
import Image from "next/image";

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  priority?: boolean;
  sizes?: string;
  className?: string;
}

function isValidUrl(src: string): boolean {
  try {
    const u = new URL(src);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function ImagePlaceholder({ alt }: { alt: string }) {
  return (
    <div
      role="img"
      aria-label={alt || undefined}
      className="flex h-full w-full items-center justify-center bg-background p-8"
    >
      <svg
        aria-hidden
        className="h-10 w-10 text-text-muted/70"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.2}
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M3.75 21h16.5A1.5 1.5 0 0 0 21.75 19.5V4.5A1.5 1.5 0 0 0 20.25 3H3.75A1.5 1.5 0 0 0 2.25 4.5v15A1.5 1.5 0 0 0 3.75 21Zm7.5-11.25h.008v.008h-.008V9.75Z"
        />
      </svg>
      {alt ? <span className="sr-only">{alt}</span> : null}
    </div>
  );
}

export function ImageWithFallback({ src, alt, priority, sizes, className = "" }: ImageWithFallbackProps) {
  const [failed, setFailed] = useState(false);
  const valid = useMemo(() => isValidUrl(src), [src]);

  if (!valid || failed) {
    return <ImagePlaceholder alt={alt} />;
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      onError={() => setFailed(true)}
      className={`object-cover ${className}`}
    />
  );
}