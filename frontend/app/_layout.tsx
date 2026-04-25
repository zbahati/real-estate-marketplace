import { Stack } from 'expo-router';

export default function RootLayout() {
  // Hide default header so tabs render cleanly
  return <Stack screenOptions={{ headerShown: false }} />;
}
