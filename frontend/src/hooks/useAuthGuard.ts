import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';

export function useAuthGuard(redirectUrl = '/(auth)/login') {
  const { user, initialized } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (initialized && !user) {
      router.replace(redirectUrl as any);
    }
  }, [user, initialized, redirectUrl, router]);

  return { isAuthenticated: !!user, initialized };
}
