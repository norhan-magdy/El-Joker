import type { ReactNode } from "react";

interface EmptyStateProps {
  title: string;
  caption?: string;
  action?: ReactNode;
}

export function EmptyState({ title, caption, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <svg aria-hidden className="mb-4 h-10 w-10 text-text-muted/60" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 13.5h3.86a2.25 2.25 0 0 1 2.012 1.244l.256.512a2.25 2.25 0 0 0 2.013 1.244h3.218a2.25 2.25 0 0 0 2.013-1.244l.256-.512a2.25 2.25 0 0 1 2.013-1.244h3.859m-18.622 0a2.25 2.25 0 0 1 1.657-2.646c.189-.088.392-.163.603-.233m-1.657 2.646h18.622m-18.622 0a3.375 3.375 0 0 1-3.375-3.375V14.25" />
      </svg>
      <h4 className="mb-1 text-lg font-semibold text-text-primary">{title}</h4>
      {caption ? <p className="mb-6 max-w-sm text-sm text-text-muted">{caption}</p> : <p className="mb-6" />}
      {action}
    </div>
  );
}