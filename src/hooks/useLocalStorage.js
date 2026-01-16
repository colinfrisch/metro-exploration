import { useState, useCallback } from 'react';

export function useLocalStorage(key, initialValue = '') {
  const [value, setValue] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(key) || initialValue;
    }
    return initialValue;
  });

  const setStoredValue = useCallback((newValue) => {
    setValue(newValue);
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, newValue);
    }
  }, [key]);

  return [value, setStoredValue];
}
