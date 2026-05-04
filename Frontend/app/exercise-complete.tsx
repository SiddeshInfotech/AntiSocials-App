import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL } from '../constants/Api';

/**
 * Redirects to the unified task-success screen.
 * Previously a standalone exercise screen — now forwards to task-success for consistency.
 */
export default function ExerciseCompleteScreen() {
  const router = useRouter();

  useEffect(() => {
    const completeTask = async () => {
      let pointsData = { pointsAdded: '0', totalPoints: '0', streak: '0' };
      try {
        const token = await SecureStore.getItemAsync('token');
        if (token) {
          const response = await fetch(`${API_BASE_URL}/api/tasks/complete`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ task_name: 'Stretch neck & shoulders' })
          });
          const data = await response.json();
          if (response.ok || data.success) {
            pointsData = { 
              pointsAdded: data.pointsAdded?.toString() || "0", 
              totalPoints: data.totalPoints?.toString() || "0",
              streak: data.streak?.toString() || "0"
            };
          }
        }
      } catch(e) { console.error(e); }

      router.replace({ 
        pathname: '/task-success', 
        params: { points: pointsData.pointsAdded, totalPoints: pointsData.totalPoints, streak: pointsData.streak } 
      } as any);
    };
    completeTask();
  }, [router]);

  return null;
}

