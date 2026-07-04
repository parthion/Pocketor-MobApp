import Header from '@/components/layout/Header';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Alert, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        await logout();
      }},
    ]);
  };

  const SettingRow = ({ icon, label, value, onPress, danger = false }: {
    icon: string; label: string; value?: string; onPress?: () => void; danger?: boolean;
  }) => (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowIcon}>{icon}</Text>
        <Text style={[styles.rowLabel, danger && styles.dangerText]}>{label}</Text>
      </View>
      {value ? <Text style={styles.rowValue}>{value}</Text> : <Text style={styles.rowArrow}>›</Text>}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Settings" showBack={true} onBackPress={() => router.replace('/')} />

      <ScrollView contentContainerStyle={styles.content}>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.charAt(0).toUpperCase() || '👤'}</Text>
          </View>
          <Text style={styles.profileName}>{user?.name || 'User'}</Text>
          <Text style={styles.profileEmail}>{user?.email}</Text>
          <Text style={styles.profilePhone}>{user?.phone}</Text>
        </View>

        {/* Account */}
        <Text style={styles.groupTitle}>Account</Text>
        <View style={styles.group}>
          <SettingRow icon="👤" label="Name" value={user?.name || '—'} />
          <SettingRow icon="✉️" label="Email" value={user?.email || '—'} />
          <SettingRow icon="📱" label="Phone" value={user?.phone || '—'} />
        </View>

        {/* App */}
        <Text style={styles.groupTitle}>App</Text>
        <View style={styles.group}>
          <SettingRow icon="💼" label="Lines & Areas" onPress={() => router.push('/(tabs)/collection')} />
          <SettingRow icon="👥" label="Borrowers" onPress={() => router.push('/(tabs)/borrowers')} />
          {user?.role === 'admin' && (
            <SettingRow icon="👔" label="Employees" onPress={() => router.push('/(tabs)/employees')} />
          )}
          <SettingRow icon="💰" label="Loans" onPress={() => router.push('/(tabs)/loans')} />
          <SettingRow icon="💳" label="Expenses" onPress={() => router.push('/(tabs)/expense')} />
          <SettingRow icon="📊" label="Reports" onPress={() => router.push('/(tabs)/reports')} />
        </View>

        {/* Support */}
        <Text style={styles.groupTitle}>Support</Text>
        <View style={styles.group}>
          <SettingRow icon="📞" label="Contact Support" onPress={() => Linking.openURL('mailto:support@pocketor.app')} />
          <SettingRow icon="🌐" label="Website" onPress={() => Linking.openURL('https://pocketor.app')} />
          <SettingRow icon="📄" label="Privacy Policy" onPress={() => Linking.openURL('https://pocketor.app/privacy')} />
          <SettingRow icon="📋" label="Terms & Conditions" onPress={() => Linking.openURL('https://pocketor.app/terms')} />
        </View>

        {/* About */}
        <Text style={styles.groupTitle}>About</Text>
        <View style={styles.group}>
          <SettingRow icon="ℹ️" label="App Version" value="v1.0.0" />
          <SettingRow icon="🏷️" label="Build" value="2026.01" />
        </View>

        {/* Logout */}
        <View style={[styles.group, { marginTop: 8 }]}>
          <SettingRow icon="🚪" label="Logout" onPress={handleLogout} danger />
        </View>

      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/collection')}>
          <Text style={styles.navIcon}>💰</Text><Text style={styles.navLabel}>Collection</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/expense')}>
          <Text style={styles.navIcon}>💳</Text><Text style={styles.navLabel}>Expense</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/customer')}>
          <Text style={styles.navIcon}>👥</Text><Text style={styles.navLabel}>Customer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/reports')}>
          <Text style={styles.navIcon}>📊</Text><Text style={styles.navLabel}>Reports</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>⚙️</Text><Text style={[styles.navLabel, styles.activeLabel]}>Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 40 },
  profileCard: { backgroundColor: '#007AFF', borderRadius: 16, padding: 24, alignItems: 'center', marginBottom: 20 },
  avatar: { width: 70, height: 70, borderRadius: 35, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  avatarText: { fontSize: 32, color: '#fff', fontWeight: 'bold' },
  profileName: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  profileEmail: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 3 },
  profilePhone: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2 },
  groupTitle: { fontSize: 12, fontWeight: '700', color: '#888', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6, marginTop: 16, paddingHorizontal: 4 },
  group: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#eee' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 13, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowIcon: { fontSize: 20 },
  rowLabel: { fontSize: 15, color: '#333' },
  rowValue: { fontSize: 14, color: '#888' },
  rowArrow: { fontSize: 20, color: '#ccc' },
  dangerText: { color: '#e53935', fontWeight: '600' },
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingBottom: 20, paddingTop: 8 },
  navItem: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  navIcon: { fontSize: 22, marginBottom: 3 },
  navLabel: { fontSize: 11, color: '#666' },
  activeLabel: { color: '#007AFF', fontWeight: '600' },
});
