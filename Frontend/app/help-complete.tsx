import { useEffect } from 'react';
import { useRouter } from 'expo-router';

/**
 * Redirects to the unified task-success screen.
 * Previously a standalone help complete screen — now forwards to task-success for consistency.
 */
export default function HelpCompleteScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace({ pathname: '/task-success', params: { points: '200' } } as any);
  }, []);

  return null;
}
