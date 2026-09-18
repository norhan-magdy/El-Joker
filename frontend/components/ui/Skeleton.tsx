import type { HTMLAttributes } from "react";

type SkeletonProps = HTMLAttributes<HTMLDivElement>;

export function Skeleton({ className = "", ...rest }: SkeletonProps) {
  return <div aria-hidden className={`animate-pulse rounded-md bg-border ${className}`} {...rest} />;
}