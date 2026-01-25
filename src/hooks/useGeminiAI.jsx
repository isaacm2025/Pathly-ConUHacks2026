import { useState, useEffect } from 'react';
import { isAIEnabled } from '../api/geminiApi';

/**
 * Hook to check if Gemini AI is enabled
 */
export function useGeminiAI() {
  const [isEnabled, setIsEnabled] = useState(false);

  useEffect(() => {
    setIsEnabled(isAIEnabled());
  }, []);

  return {
    isEnabled,
    // Keep these for backward compatibility but they're no longer needed
    apiKey: isEnabled ? 'configured' : null,
    setApiKey: () => {},
    clearApiKey: () => {}
  };
}
