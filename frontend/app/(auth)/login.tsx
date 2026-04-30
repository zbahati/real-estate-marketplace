import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useState } from 'react';
import { useAuthStore } from '../../src/store/authStore';
import { useRouter } from 'expo-router';

import Input from '../../src/components/Input';
import Button from '../../src/components/Button';
import { COLORS, SPACING, FONT, RADIUS } from '../../src/theme';

export default function Login() {
  const router = useRouter();
  const { login, loading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter your email and password');
      return;
    }
    try {
      const success = await login(email.trim(), password);
      if (success) {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      Alert.alert('Login Failed', err.message ?? 'Invalid email or password');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Find homes, cars, and land near you</Text>
        </View>

        <View style={styles.card}>
          <Input
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Input
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Button title={loading ? 'Logging in...' : 'Login'} onPress={handleLogin} disabled={loading} />
        </View>

        <Text style={styles.footerText}>
          Don&apos;t have an account?{' '}
          <Text style={styles.link} onPress={() => router.push('/(auth)/register' as any)}>
            Register
          </Text>
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  header: {
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: FONT.title,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  subtitle: {
    fontSize: FONT.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },
  card: {
    backgroundColor: COLORS.card,
    padding: SPACING.lg,
    borderRadius: RADIUS.lg,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  footerText: {
    textAlign: 'center',
    marginTop: SPACING.lg,
    color: COLORS.textSecondary,
  },
  link: {
    color: COLORS.primary,
    fontWeight: '600',
  },
});
