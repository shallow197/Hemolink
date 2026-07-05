import { useEffect, useRef } from 'react';

export function usePoll(callback, intervalMs, deps = []) {
  const cb = useRef(callback);
  cb.current = callback;

  useEffect(() => {
    const id = setInterval(() => cb.current(), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, ...deps]);
}
