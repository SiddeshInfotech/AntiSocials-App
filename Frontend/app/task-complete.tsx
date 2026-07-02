import { useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/Api';

/**
 * Redirects to unified task-success screen
 * Now supports dynamic task types + points and connects them to the backend API.
 */
export default function TaskCompleteScreen() {
  const router = useRouter();
  const { type, points } = useLocalSearchParams<{ type?: string; points?: string }>();

  // 🎯 Assign default points based on task if not passed
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
    const completeTask = async () => {
      let pointsData = { pointsAdded: points || getPoints(), totalPoints: '0', streak: '0' };
      const taskNames: Record<string, string> = {
        'breathing': 'Breathe consciously for 3 minutes',
        'water': 'Drink a glass of water mindfully',
        'tech': 'Take an hour tech-free break',
        'meet': 'Meet one friend in real life',
        'social': 'Call an old friend',
      };
      const taskName = taskNames[type || ''] || '';

      if (taskName) {
        try {
          const token = await SecureStore.getItemAsync('token');
          if (token) {
            const response = await fetch(`${API_BASE_URL}/api/tasks/complete`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ task_name: taskName })
            });
            const data = await response.json();
            if (response.ok || data.success) {
              pointsData = { 
                pointsAdded: data.pointsAdded?.toString() || pointsData.pointsAdded, 
                totalPoints: data.totalPoints?.toString() || "0",
                streak: data.streak?.toString() || "0"
              };
            }
          }
        } catch (e) {
          console.error("TaskComplete complete API error:", e);
        }
      }

      router.replace({
        pathname: '/task-success',
        params: {
          type: type || 'default',
          points: pointsData.pointsAdded,
          totalPoints: pointsData.totalPoints,
          streak: pointsData.streak,
        },
      } as any);
    };
    completeTask();
  }, [points, router, type]);

  return null;
}
