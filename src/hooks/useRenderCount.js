import { useRef, useEffect } from 'react';

/**
 * Hook to track and log component render counts for debugging
 * Useful for identifying excessive re-renders during auth flows
 * @param {string} componentName - Name of component for logging
 */
export const useRenderCount = (componentName) => {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current++;
  });

  return renderCount.current;
};
