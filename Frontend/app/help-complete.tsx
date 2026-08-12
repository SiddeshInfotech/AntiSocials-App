import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { apiFetch } from '../constants/Api';

/**
 * Redirects to the unified task-success screen.
 * Previously a standalone help complete screen — now forwards to task-success for consistency.
 */
export default function HelpCompleteScreen() {
  const router = useRouter();

  useEffect(() => {
    const completeTask = async () => {
      let pointsData = { pointsEarned: '300', totalPoints: '300', streak: '1' };
      try {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
          const response = await apiFetch('/api/tasks/complete', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ task_name: 'Help someone offline' })
          });
          const data = await response.json();
          if (response.ok || data.success) {
            const pts = (data.pointsEarned ?? data.points_earned ?? data.pointsAdded ?? 300);
            pointsData = { 
              pointsEarned: pts > 0 ? pts.toString() : "300", 
              totalPoints: (data.totalPoints ?? data.total_points ?? 300).toString(),
              streak: (data.currentStreak ?? data.current_streak ?? data.streak ?? 1).toString()
            };
          }
        }
      } catch (e) {
        console.error("Help task complete error:", e);
      }

      router.replace({
        pathname: '/task-success',
        params: {
          pointsEarned: pointsData.pointsEarned,
          points: pointsData.pointsEarned,
          totalPoints: pointsData.totalPoints,
          streak: pointsData.streak,
          difficulty: 'medium',
          taskName: 'Help someone offline'
        }
      } as any);
    };
    completeTask();
  }, [router]);

  return null;
}
