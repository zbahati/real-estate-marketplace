import { Redirect } from 'expo-router';

export default function Index() {
  // Public entry: show app tabs (home) even when not logged in
  return <Redirect href="/(tabs)" />;
}