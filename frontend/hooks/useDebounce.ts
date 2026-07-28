import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce fast-changing values (e.g. search inputs)
 * Prevents continuous re-filtering and unnecessary layout recalculations on every keystroke.
 */
export function useDebounce<T>(value: T, delay: number = 250): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
