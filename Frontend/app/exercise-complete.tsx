import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { apiFetch } from '../constants/Api';

/**
 * Redirects to the unified task-success screen.
 * Previously a standalone exercise screen — now forwards to task-success for consistency.
 */
export default function ExerciseCompleteScreen() {
  const router = useRouter();

  useEffect(() => {
    const completeTask = async () => {
      let pointsData = { pointsEarned: '100', totalPoints: '100', streak: '1' };
      try {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
          const response = await apiFetch('/api/tasks/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ task_name: 'Stretch neck & shoulders' })
          });
          const data = await response.json();
          if (response.ok || data.success) {
            const pts = (data.pointsEarned ?? data.points_earned ?? data.pointsAdded ?? 100);
            pointsData = { 
              pointsEarned: pts > 0 ? pts.toString() : "100", 
              totalPoints: (data.totalPoints ?? data.total_points ?? 100).toString(),
              streak: (data.currentStreak ?? data.current_streak ?? data.streak ?? 1).toString()
            };
          }
        }
      } catch(e) { console.error(e); }

      router.replace({ 
        pathname: '/task-success', 
        params: { 
          pointsEarned: pointsData.pointsEarned,
          points: pointsData.pointsEarned, 
          totalPoints: pointsData.totalPoints, 
          streak: pointsData.streak,
          difficulty: 'easy',
          taskName: 'Stretch neck & shoulders'
        } 
      } as any);
    };
    completeTask();
  }, [router]);

  return null;
}

