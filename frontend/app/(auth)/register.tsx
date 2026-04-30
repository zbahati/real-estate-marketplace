import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useState } from 'react';
import { useAuthStore } from '../../src/store/authStore';
import { useRouter } from 'expo-router';

import Input from '../../src/components/Input';
import Button from '../../src/components/Button';
import { COLORS, SPACING, FONT, RADIUS } from '../../src/theme';

export default function Register() {
  const router = useRouter();
  const { register, loading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const handleRegister = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Email is required');
      return;
    }
    if (!password.trim()) {
      Alert.alert('Error', 'Password is required');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    if (!fullName.trim()) {
      Alert.alert('Error', 'Full name is required');
      return;
    }

    try {
      const success = await register({ email, password, full_name: fullName, phone });
      if (success) {
        router.replace('/(tabs)');
      }
    } catch (err: any) {
      Alert.alert('Registration Failed', err.message ?? 'Something went wrong');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.wrapper}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>

          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Join our marketplace today</Text>
          </View>

          <View style={styles.card}>
            <Input
              placeholder="Full Name"
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
            />
            <Input
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <Input
              placeholder="Phone (optional)"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
            <Input
              placeholder="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <Button
              title={loading ? 'Creating Account...' : 'Create Account'}
              onPress={handleRegister}
              disabled={loading}
            />
          </View>

          <Text style={styles.footerText}>
            Already have an account?{' '}
            <Text style={styles.link} onPress={() => router.push('/(auth)/login')}>
              Login
            </Text>
          </Text>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
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
