import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
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
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch {
      alert('Invalid email or password');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Find homes, cars, and land near you</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Input placeholder="Email" onChangeText={setEmail} />
          <Input placeholder="Password" secureTextEntry onChangeText={setPassword} />

          <Button title={loading ? 'Loading...' : 'Login'} onPress={handleLogin} />
        </View>

        {/* Footer */}
        <Text style={styles.footerText}>
          Don’t have an account?{' '}
          <Text style={styles.link} onPress={() => router.push('/register')}>
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

    // shadow
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