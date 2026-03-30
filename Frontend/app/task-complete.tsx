import { useEffect } from 'react';
import { useRouter } from 'expo-router';

/**
 * Redirects to the unified task-success screen.
 * Previously a standalone screen — now forwards to task-success for consistency.
 */
export default function TaskCompleteScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace({ pathname: '/task-success', params: { points: '100' } } as any);
  }, []);

  return null;
}