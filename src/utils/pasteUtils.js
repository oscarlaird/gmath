export const setupPastePrevention = () => {
  const preventPaste = (e) => {
    e.preventDefault();
    console.log('Paste operation blocked');
  };

  // Add global listeners once
  document.addEventListener('paste', preventPaste, true);
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      e.preventDefault();
      console.log('Ctrl+V blocked');
    }
  }, true);

  // Return cleanup function
  return () => {
    document.removeEventListener('paste', preventPaste, true);
    document.removeEventListener('keydown', preventPaste, true);
  };
}; 