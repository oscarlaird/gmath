export const measureTime = (label) => {
  const start = performance.now();
  return () => {
    const end = performance.now();
    console.log(`⏱️ ${label}: ${(end - start).toFixed(2)}ms`);
    return end - start;
  };
}; 