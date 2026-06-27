import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Header from '@/components/layout/Header';
import * as AuthService from '@/service/auth.service';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';

export default function EmployeesScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'admin') {
      return;
    }

    const loadUsers = async () => {
      setIsLoading(true);
      try {
        const response = await AuthService.getAllUsers();
        if (response.success && response.data) {
          setUsers(response.data);
        } else {
          setError(response.message || 'Failed to load employees');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load employees');
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, [user]);

  const renderEmployee = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={[styles.role, item.role === 'admin' ? styles.adminRole : styles.agentRole]}>{item.role}</Text>
      </View>
      <Text style={styles.email}>{item.email}</Text>
      <Text style={styles.phone}>{item.phone}</Text>
      {item.createdBy && <Text style={styles.meta}>Created by: {item.createdBy}</Text>}
    </View>
  );

  if (user?.role !== 'admin') {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Employees" showBack={true} onBackPress={() => router.replace('/')} />
        <View style={styles.content}>
          <Text style={styles.unauthorizedText}>You do not have permission to view this page.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Employees" showBack={true} onBackPress={() => router.replace('/')} />
      <View style={styles.content}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#007AFF" />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : users.length === 0 ? (
          <Text style={styles.emptyText}>No employees found yet.</Text>
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => item.id}
            renderItem={renderEmployee}
            contentContainerStyle={styles.list}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { flex: 1, padding: 16 },
  list: { paddingBottom: 24 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  name: { fontSize: 16, fontWeight: '700', color: '#111827' },
  role: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  adminRole: { backgroundColor: '#fde68a', color: '#92400e' },
  agentRole: { backgroundColor: '#bfdbfe', color: '#1d4ed8' },
  email: { color: '#4b5563', fontSize: 14, marginBottom: 4 },
  phone: { color: '#4b5563', fontSize: 14, marginBottom: 4 },
  meta: { color: '#6b7280', fontSize: 12 },
  emptyText: { marginTop: 32, fontSize: 16, color: '#6b7280', textAlign: 'center' },
  errorText: { marginTop: 32, fontSize: 16, color: '#dc2626', textAlign: 'center' },
  unauthorizedText: { marginTop: 32, fontSize: 16, color: '#dc2626', textAlign: 'center', paddingHorizontal: 20 },
});
