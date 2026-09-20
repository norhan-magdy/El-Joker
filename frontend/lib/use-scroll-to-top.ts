"use client";

import { useEffect, useRef } from "react";

export function useScrollToTopOnChange(value: unknown) {
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [value]);
}
