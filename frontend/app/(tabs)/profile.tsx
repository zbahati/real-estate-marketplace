import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthGuard } from '../../src/hooks/useAuthGuard';
import { useAuthStore } from '../../src/store/authStore';
import { COLORS, SPACING, FONT, RADIUS } from '../../src/theme';

export default function Profile() {
  const { isAuthenticated, initialized } = useAuthGuard();
  const { user, logout } = useAuthStore();
  const router = useRouter();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(tabs)');
          },
        },
      ]
    );
  };

  if (!initialized) {
    return (
      <View style={styles.center}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <SafeAreaView style={styles.wrapper} edges={['bottom']}>
        <View style={styles.center}>
          <Ionicons name="person-circle-outline" size={80} color={COLORS.textSecondary} />
          <Text style={styles.guestTitle}>Guest Mode</Text>
          <Text style={styles.guestText}>Login to save favorites, create listings, and more</Text>
          <TouchableOpacity
            style={styles.loginBtn}
            onPress={() => router.push('/(auth)/login' as any)}
          >
            <Text style={styles.loginBtnText}>Login</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.registerBtn}
            onPress={() => router.push('/(auth)/register' as any)}
          >
            <Text style={styles.registerBtnText}>Create Account</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() ?? '?';

  const menuItems = [
    { icon: 'create-outline' as const, label: 'My Listings', route: '/(tabs)' as any },
    { icon: 'heart-outline' as const, label: 'Favorites', route: 'favorites' as any },
    { icon: 'settings-outline' as const, label: 'Settings', disabled: true },
    { icon: 'help-circle-outline' as const, label: 'Help & Support', disabled: true },
  ];

  return (
    <SafeAreaView style={styles.wrapper} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text style={styles.name}>{user?.full_name ?? 'User'}</Text>
          <Text style={styles.email}>{user?.email ?? ''}</Text>
          {user?.phone ? (
            <Text style={styles.phone}>{user.phone}</Text>
          ) : null}
        </View>

        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.menuItem, index > 0 && styles.menuItemBorder]}
              disabled={item.disabled}
              onPress={() => item.route && router.push(item.route)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={item.icon}
                size={22}
                color={item.disabled ? COLORS.textSecondary : COLORS.primary}
              />
              <Text
                style={[
                  styles.menuLabel,
                  item.disabled && styles.menuLabelDisabled,
                ]}
              >
                {item.label}
              </Text>
              {!item.disabled && (
                <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={22} color={COLORS.danger} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    fontSize: FONT.body,
    color: COLORS.textSecondary,
  },
  guestTitle: {
    fontSize: FONT.subtitle,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  guestText: {
    fontSize: FONT.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.xl,
  },
  loginBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.md,
    marginTop: SPACING.lg,
    minWidth: 200,
    alignItems: 'center',
  },
  loginBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: FONT.body,
  },
  registerBtn: {
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.md,
    marginTop: SPACING.sm,
    minWidth: 200,
    alignItems: 'center',
  },
  registerBtnText: {
    color: COLORS.primary,
    fontWeight: '700',
    fontSize: FONT.body,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    backgroundColor: COLORS.card,
    borderBottomLeftRadius: RADIUS.lg,
    borderBottomRightRadius: RADIUS.lg,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: FONT.subtitle,
    fontWeight: '700',
  },
  name: {
    fontSize: FONT.subtitle,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  email: {
    fontSize: FONT.small,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  phone: {
    fontSize: FONT.small,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  menuSection: {
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  menuItemBorder: {
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  menuLabel: {
    flex: 1,
    marginLeft: SPACING.md,
    fontSize: FONT.body,
    color: COLORS.textPrimary,
  },
  menuLabelDisabled: {
    color: COLORS.textSecondary,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  logoutText: {
    color: COLORS.danger,
    fontWeight: '700',
    fontSize: FONT.body,
    marginLeft: SPACING.sm,
  },
  version: {
    textAlign: 'center',
    fontSize: FONT.small,
    color: COLORS.textSecondary,
    marginTop: SPACING.lg,
    marginBottom: SPACING.lg,
  },
});
