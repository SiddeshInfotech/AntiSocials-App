import { useEffect } from 'react';
import { useRouter } from 'expo-router';

/**
 * Redirects to the unified task-success screen.
 * Previously a standalone exercise screen — now forwards to task-success for consistency.
 */
export default function ExerciseCompleteScreen() {
  const router = useRouter();

  useEffect(() => {
    router.replace({ pathname: '/task-success', params: { points: '250' } } as any);
  }, []);

  return null;
}

