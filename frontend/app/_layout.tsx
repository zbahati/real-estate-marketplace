import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { initializeAuth } from '../src/store/authStore';

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initializeAuth().then(() => setReady(true));
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }} />
    </GestureHandlerRootView>
  );
}
