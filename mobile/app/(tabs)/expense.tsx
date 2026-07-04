import Header from '@/components/layout/Header';
import { expenseService, type Expense } from '@/service/expense.service';
import expenseQueue, { isNetworkError } from '@/utils/expenseQueue';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ActivityIndicator, Alert, AppState, FlatList, Modal, RefreshControl,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';

const CATEGORIES = ['Travel', 'Food', 'Office', 'Salary', 'Maintenance', 'Other'];

export default function ExpenseScreen() {
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState('All');

  // Form fields
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Other');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const appState = useRef(AppState.currentState);

  // Flush offline queue whenever the app comes to the foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', nextState => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        flushQueue();
      }
      appState.current = nextState;
    });
    return () => sub.remove();
  }, []);

  const flushQueue = async () => {
    const { synced } = await expenseQueue.flush(data => expenseService.create(data).then(r => {
      if (!r.success) throw new Error(r.message);
    }));
    if (synced > 0) loadExpenses();
  };

  const loadExpenses = useCallback(async () => {
    try {
      const res = await expenseService.getAll({ category: filterCategory });
      if (res.success && res.data) setExpenses(res.data);
    } catch (err) {
      Alert.alert('Error', 'Failed to load expenses');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [filterCategory]);

  useEffect(() => {
    setIsLoading(true);
    flushQueue().then(() => loadExpenses());
  }, [loadExpenses]);

  const handleAdd = async () => {
    if (!title.trim() || !amount.trim()) {
      Alert.alert('Error', 'Title and amount are required');
      return;
    }
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Error', 'Amount must be a positive number');
      return;
    }
    setSaving(true);
    const expenseData = {
      title: title.trim(),
      amount: parsedAmount,
      category,
      note: note.trim() || undefined,
    };
    try {
      const res = await expenseService.create(expenseData);
      if (res.success && res.data) {
        setExpenses(prev => [res.data!, ...prev]);
      }
      setTitle(''); setAmount(''); setNote(''); setCategory('Other');
      setShowModal(false);
    } catch (err) {
      if (isNetworkError(err)) {
        // No connectivity — save locally and sync later automatically
        await expenseQueue.enqueue(expenseData);
        setTitle(''); setAmount(''); setNote(''); setCategory('Other');
        setShowModal(false);
        Alert.alert('Saved Offline', 'No internet connection. Your expense has been saved and will sync automatically when you\'re back online.');
      } else {
        Alert.alert('Error', err instanceof Error ? err.message : 'Failed to add expense');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete', 'Delete this expense?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await expenseService.delete(id);
            setExpenses(prev => prev.filter(e => e.id !== id));
          } catch {
            Alert.alert('Error', 'Failed to delete expense');
          }
        },
      },
    ]);
  };

  const formatDate = (iso: string) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };

  const total = expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Expense"
        showBack={true}
        onBackPress={() => router.replace('/')}
        rightAction={{ icon: '+', onPress: () => setShowModal(true) }}
      />

      {/* Total */}
      <View style={styles.totalBox}>
        <Text style={styles.totalLabel}>Total Expenses</Text>
        <Text style={styles.totalValue}>₹ {total.toFixed(2)}</Text>
      </View>

      {/* Category filter */}
      <FlatList
        horizontal showsHorizontalScrollIndicator={false}
        data={['All', ...CATEGORIES]}
        keyExtractor={i => i}
        style={styles.filterRow}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterChip, filterCategory === item && styles.filterChipActive]}
            onPress={() => setFilterCategory(item)}
          >
            <Text style={[styles.filterChipText, filterCategory === item && styles.filterChipTextActive]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Expense list */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={e => e.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadExpenses(); }} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>💳</Text>
              <Text style={styles.emptyText}>No expenses yet</Text>
              <Text style={styles.emptySub}>Tap + to record an expense</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardLeft}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardMeta}>{item.category} • {formatDate(item.expenseDate)}</Text>
                {item.note ? <Text style={styles.cardNote}>{item.note}</Text> : null}
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.cardAmount}>₹ {item.amount.toFixed(2)}</Text>
                <TouchableOpacity onPress={() => handleDelete(item.id)}>
                  <Text style={styles.deleteBtn}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/collection')}>
          <Text style={styles.navIcon}>💰</Text><Text style={styles.navLabel}>Collection</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={[styles.navIcon]}>💳</Text><Text style={[styles.navLabel, styles.activeLabel]}>Expense</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/customer')}>
          <Text style={styles.navIcon}>👥</Text><Text style={styles.navLabel}>Customer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/reports')}>
          <Text style={styles.navIcon}>📊</Text><Text style={styles.navLabel}>Reports</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/settings')}>
          <Text style={styles.navIcon}>⚙️</Text><Text style={styles.navLabel}>Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Add Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Expense</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.fieldLabel}>Title *</Text>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="e.g. Fuel" />

            <Text style={styles.fieldLabel}>Amount (₹) *</Text>
            <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0.00" />

            <Text style={styles.fieldLabel}>Category</Text>
            <View style={styles.categoryRow}>
              {CATEGORIES.map(c => (
                <TouchableOpacity
                  key={c}
                  style={[styles.catChip, category === c && styles.catChipActive]}
                  onPress={() => setCategory(c)}
                >
                  <Text style={[styles.catChipText, category === c && styles.catChipTextActive]}>{c}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Note</Text>
            <TextInput style={styles.input} value={note} onChangeText={setNote} placeholder="Optional note" />

            <TouchableOpacity style={[styles.saveBtn, saving && styles.saveBtnDisabled]} onPress={handleAdd} disabled={saving}>
              <Text style={styles.saveBtnText}>{saving ? 'Saving...' : 'Save Expense'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  totalBox: { backgroundColor: '#007AFF', margin: 16, borderRadius: 12, padding: 16, alignItems: 'center' },
  totalLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 13 },
  totalValue: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginTop: 4 },
  filterRow: { paddingHorizontal: 16, marginBottom: 8, flexGrow: 0 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#fff', marginRight: 8, borderWidth: 1, borderColor: '#ddd' },
  filterChipActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  filterChipText: { fontSize: 13, color: '#555' },
  filterChipTextActive: { color: '#fff', fontWeight: '600' },
  list: { padding: 16, paddingTop: 8 },
  card: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', borderWidth: 1, borderColor: '#eee' },
  cardLeft: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#222' },
  cardMeta: { fontSize: 12, color: '#999', marginTop: 3 },
  cardNote: { fontSize: 12, color: '#aaa', marginTop: 2 },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  cardAmount: { fontSize: 16, fontWeight: 'bold', color: '#e53e3e' },
  deleteBtn: { fontSize: 18 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 56, marginBottom: 12 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#666' },
  emptySub: { fontSize: 13, color: '#999', marginTop: 4 },
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingBottom: 20, paddingTop: 8 },
  navItem: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  navIcon: { fontSize: 22, marginBottom: 3 },
  navLabel: { fontSize: 11, color: '#666' },
  activeLabel: { color: '#007AFF', fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#222' },
  modalClose: { fontSize: 22, color: '#999' },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 4, marginTop: 10 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 10, fontSize: 14, color: '#333', backgroundColor: '#fafafa' },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#fff' },
  catChipActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  catChipText: { fontSize: 12, color: '#555' },
  catChipTextActive: { color: '#fff', fontWeight: '600' },
  saveBtn: { backgroundColor: '#007AFF', borderRadius: 10, padding: 14, alignItems: 'center', marginTop: 20 },
  saveBtnDisabled: { backgroundColor: '#93c5fd' },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
