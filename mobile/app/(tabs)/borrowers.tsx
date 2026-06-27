import { useEffect, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Header from '@/components/layout/Header';
import { useLoanCollection } from '@/context/LoanCollectionContext';
import { useRouter } from 'expo-router';

export default function BorrowersScreen() {
  const { customers } = useLoanCollection();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const renderBorrower = ({ item }: { item: any }) => (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/customer-detail/${item.id}`)}>
      <View style={styles.row}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={[styles.status, item.status === 'active' ? styles.active : item.status === 'completed' ? styles.completed : styles.defaulted]}>
          {item.status}
        </Text>
      </View>
      <Text style={styles.meta}>📞 {item.phone}</Text>
      <Text style={styles.meta}>📍 {item.address}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Borrowers" showBack={true} onBackPress={() => router.replace('/')} />
      <View style={styles.content}>
        {isLoading ? (
          <ActivityIndicator size="large" color="#007AFF" />
        ) : customers.length === 0 ? (
          <Text style={styles.emptyText}>No borrowers available yet.</Text>
        ) : (
          <FlatList
            data={customers}
            keyExtractor={(item) => item.id}
            renderItem={renderBorrower}
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
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  name: { fontSize: 16, fontWeight: '700', color: '#111827' },
  status: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  active: { backgroundColor: '#d1fae5', color: '#047857' },
  completed: { backgroundColor: '#dbeafe', color: '#1d4ed8' },
  defaulted: { backgroundColor: '#fee2e2', color: '#b91c1c' },
  meta: { color: '#4b5563', fontSize: 14 },
  emptyText: { marginTop: 32, fontSize: 16, color: '#6b7280', textAlign: 'center' },
});
