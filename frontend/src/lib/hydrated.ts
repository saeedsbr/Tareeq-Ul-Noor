'use client';
import { useEffect, useState } from 'react';

/**
 * False until React has attached its handlers. Submit buttons stay disabled until then, so a click (or Enter)
 * during a slow page load can never fall back to a native form submit that reloads the page and puts the
 * password into the address bar.
 */
export function useHydrated() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  return ready;
}
