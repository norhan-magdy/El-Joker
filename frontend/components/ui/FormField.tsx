"use client";

import { useId, type ReactNode } from "react";
import { Label } from "@/components/ui/Label";

interface FormFieldProps {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function FormField({ label, hint, error, children, className = "" }: FormFieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <Label htmlFor={id}>{label}</Label>
      {hint ? <p id={hintId} className="text-xs text-text-muted">{hint}</p> : null}
      {children}
      {error ? (
        <p id={errorId} className="text-sm text-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function useFormFieldIds(id: string) {
  return { inputId: id, errorId: `${id}-error`, hintId: `${id}-hint` };
}