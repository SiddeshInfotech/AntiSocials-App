import { useEffect } from 'react';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { apiFetch } from '../constants/Api';

/**
 * Redirects to unified task-success screen
 * Supports standard task difficulty: Easy=100, Medium=300, Hard=600.
 */
export default function TaskCompleteScreen() {
  const router = useRouter();
  const { type, points } = useLocalSearchParams<{ type?: string; points?: string }>();

  const getTaskInfo = () => {
    switch (type) {
      case 'breathing':
        return { name: 'Breathe consciously for 3 minutes', difficulty: 'easy', defaultPoints: '100' };
      case 'water':
        return { name: 'Drink a glass of water mindfully', difficulty: 'easy', defaultPoints: '100' };
      case 'social':
        return { name: 'Call an old friend', difficulty: 'medium', defaultPoints: '300' };
      case 'tech':
        return { name: 'Take an hour tech-free break', difficulty: 'hard', defaultPoints: '600' };
      case 'meet':
        return { name: 'Meet one friend in real life', difficulty: 'hard', defaultPoints: '600' };
      default:
        return { name: 'Task', difficulty: 'easy', defaultPoints: '100' };
    }
  };

  useEffect(() => {
    const completeTask = async () => {
      const taskInfo = getTaskInfo();
      let pointsData = { 
        pointsEarned: points || taskInfo.defaultPoints, 
        totalPoints: points || taskInfo.defaultPoints, 
        streak: '1' 
      };

      try {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
          const response = await apiFetch('/api/tasks/complete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ task_name: taskInfo.name })
          });
          const data = await response.json();
          if (response.ok || data.success) {
            const pts = (data.pointsEarned ?? data.points_earned ?? data.pointsAdded ?? taskInfo.defaultPoints);
            pointsData = { 
              pointsEarned: pts > 0 ? pts.toString() : taskInfo.defaultPoints, 
              totalPoints: (data.totalPoints ?? data.total_points ?? taskInfo.defaultPoints).toString(),
              streak: (data.currentStreak ?? data.current_streak ?? data.streak ?? 1).toString()
            };
          }
        }
      } catch (e) {
        console.error("TaskComplete complete API error:", e);
      }

      router.replace({
        pathname: '/task-success',
        params: {
          type: type || 'default',
          taskName: taskInfo.name,
          difficulty: taskInfo.difficulty,
          pointsEarned: pointsData.pointsEarned,
          points: pointsData.pointsEarned,
          totalPoints: pointsData.totalPoints,
          streak: pointsData.streak,
        },
      } as any);
    };
    completeTask();
  }, [points, router, type]);

  return null;
}
