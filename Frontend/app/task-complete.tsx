import { useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';

/**
 * Redirects to unified task-success screen
 * Now supports dynamic task types + points
 */
export default function TaskCompleteScreen() {
  const router = useRouter();
  const { type, points } = useLocalSearchParams<{ type?: string; points?: string }>();

  // 🎯 Assign points based on task
  const getPoints = () => {
    switch (type) {
      case 'breathing':
        return '100';
      case 'water':
        return '150';
      case 'social':
        return '200';
      case 'tech':
        return '600';
      case 'meet':
        return '700';
      default:
        return '100';
    }
  };

  useEffect(() => {
    router.replace({
      pathname: '/task-success',
      params: {
        type: type || 'default',
        points: points || getPoints(),
      },
    } as any);
  }, [points, router, type]);

  return null;
}