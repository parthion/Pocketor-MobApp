import Header from '@/components/layout/Header';
import { useLoanCollection } from '@/context/LoanCollectionContext';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Alert, FlatList, Modal, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';

const NAV = [
  { icon: '💰', label: 'Collection', route: '/(tabs)/collection' },
  { icon: '💳', label: 'Expense',    route: '/(tabs)/expense' },
  { icon: '👥', label: 'Customer',   route: '/(tabs)/customer' },
  { icon: '📊', label: 'Reports',    route: '/(tabs)/reports' },
  { icon: '⚙️', label: 'Settings',   route: '/(tabs)/settings' },
];

export default function DailyCollectionScreen() {
  const router = useRouter();
  const { loans, customers, lines, areas, recordPayment } = useLoanCollection();
  const today = new Date().toLocaleDateString('en-GB');

  const [selectedLine, setSelectedLine] = useState('all');
  const [selectedArea, setSelectedArea] = useState('all');
  const [payModal, setPayModal]         = useState<any>(null);
  const [payAmount, setPayAmount]       = useState('');
  const [saving, setSaving]             = useState(false);

  // Active loans due for collection
  const dueLoans = useMemo(() => {
    return loans.filter(l => {
      if (l.status !== 'active') return false;
      if (selectedLine !== 'all' && l.lineId !== selectedLine) return false;
      if (selectedArea !== 'all' && l.areaId !== selectedArea) return false;
      return true;
    });
  }, [loans, selectedLine, selectedArea]);

  const collected    = dueLoans.filter(l => (l.paidAmount || 0) >= (l.totalAmount || 0));
  const pending      = dueLoans.filter(l => (l.paidAmount || 0) < (l.totalAmount || 0));
  const totalDue     = pending.reduce((s, l) => s + (l.installmentAmount || 0), 0);
  const totalCollected = pending.reduce((s, l) => s + (l.paidAmount || 0), 0);

  const filteredAreas = selectedLine === 'all'
    ? areas
    : areas.filter(a => a.lineId === selectedLine);

  const openPayModal = (loan: any) => {
    setPayAmount(String(loan.installmentAmount || ''));
    setPayModal(loan);
  };

  const handlePay = async () => {
    if (!payAmount || isNaN(Number(payAmount)) || Number(payAmount) <= 0) {
      Alert.alert('Error', 'Enter a valid amount'); return;
    }
    setSaving(true);
    try {
      await recordPayment({
        loanId:      payModal.id,
        customerId:  payModal.customerId,
        amount:      Number(payAmount),
        paymentDate: new Date().toISOString().slice(0, 10),
        paymentType: 'installment',
      });
      setPayModal(null);
      setPayAmount('');
      Alert.alert('✅ Collected', `₹${payAmount} recorded successfully`);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to record');
    } finally {
      setSaving(false);
    }
  };

  const renderLoan = ({ item }: { item: any }) => {
    const customer   = customers.find(c => c.id === item.customerId);
    const area       = areas.find(a => a.id === item.areaId);
    const isPaid     = (item.paidAmount || 0) >= (item.totalAmount || 0);
    const balance    = (item.balanceAmount ?? item.totalAmount ?? 0);

    return (
      <View style={[styles.card, isPaid && styles.cardPaid]}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.custName}>{customer?.name || 'Unknown'}</Text>
            <Text style={styles.custMeta}>{area?.name || '—'} • {customer?.phone || ''}</Text>
          </View>
          <View style={[styles.badge, isPaid ? styles.badgePaid : styles.badgeDue]}>
            <Text style={styles.badgeText}>{isPaid ? 'PAID' : 'DUE'}</Text>
          </View>
        </View>

        <View style={styles.amounts}>
          <View style={styles.amtBox}>
            <Text style={styles.amtLabel}>Installment</Text>
            <Text style={styles.amtValue}>₹{(item.installmentAmount || 0).toFixed(0)}</Text>
          </View>
          <View style={styles.amtBox}>
            <Text style={styles.amtLabel}>Balance</Text>
            <Text style={[styles.amtValue, { color: '#e53935' }]}>₹{balance.toFixed(0)}</Text>
          </View>
          <View style={styles.amtBox}>
            <Text style={styles.amtLabel}>Paid</Text>
            <Text style={[styles.amtValue, { color: '#2e7d32' }]}>₹{(item.paidAmount || 0).toFixed(0)}</Text>
          </View>
        </View>

        {!isPaid && (
          <TouchableOpacity style={styles.collectBtn} onPress={() => openPayModal(item)}>
            <Text style={styles.collectBtnText}>💵 Collect</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title={`Collection — ${today}`}
        showBack={true}
        onBackPress={() => router.replace('/')}
      />

      {/* Summary bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNum}>{pending.length}</Text>
          <Text style={styles.summaryLbl}>Pending</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryNum}>{collected.length}</Text>
          <Text style={styles.summaryLbl}>Collected</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryNum, { color: '#e53935' }]}>₹{totalDue.toFixed(0)}</Text>
          <Text style={styles.summaryLbl}>Due Today</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filterRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.chip, selectedLine === 'all' && styles.chipActive]}
            onPress={() => { setSelectedLine('all'); setSelectedArea('all'); }}
          >
            <Text style={[styles.chipText, selectedLine === 'all' && styles.chipTextActive]}>All Lines</Text>
          </TouchableOpacity>
          {lines.map(l => (
            <TouchableOpacity
              key={l.id}
              style={[styles.chip, selectedLine === l.id && styles.chipActive]}
              onPress={() => { setSelectedLine(l.id); setSelectedArea('all'); }}
            >
              <Text style={[styles.chipText, selectedLine === l.id && styles.chipTextActive]}>{l.lineName}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {filteredAreas.length > 0 && (
        <View style={styles.filterRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity
              style={[styles.chip, selectedArea === 'all' && styles.chipActive]}
              onPress={() => setSelectedArea('all')}
            >
              <Text style={[styles.chipText, selectedArea === 'all' && styles.chipTextActive]}>All Areas</Text>
            </TouchableOpacity>
            {filteredAreas.map(a => (
              <TouchableOpacity
                key={a.id}
                style={[styles.chip, selectedArea === a.id && styles.chipActive]}
                onPress={() => setSelectedArea(a.id)}
              >
                <Text style={[styles.chipText, selectedArea === a.id && styles.chipTextActive]}>{a.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <FlatList
        data={[...pending, ...collected]}
        keyExtractor={i => i.id}
        renderItem={renderLoan}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No active loans</Text>
          </View>
        }
      />

      {/* Bottom Nav */}
      <View style={styles.bottomNav}>
        {NAV.map(n => (
          <TouchableOpacity key={n.label} style={styles.navItem} onPress={() => router.push(n.route as any)}>
            <Text style={styles.navIcon}>{n.icon}</Text>
            <Text style={styles.navLabel}>{n.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Payment Modal */}
      <Modal visible={!!payModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Record Collection</Text>
            <Text style={styles.modalSub}>
              {customers.find(c => c.id === payModal?.customerId)?.name}
            </Text>
            <Text style={styles.fieldLabel}>Amount (₹)</Text>
            <TextInput
              style={styles.input}
              value={payAmount}
              onChangeText={setPayAmount}
              keyboardType="numeric"
              placeholder="Enter amount"
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setPayModal(null)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handlePay} disabled={saving}>
                <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Collect'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:      { flex: 1, backgroundColor: '#f5f5f5' },
  summaryBar:     { flexDirection: 'row', backgroundColor: '#007AFF', padding: 14 },
  summaryItem:    { flex: 1, alignItems: 'center' },
  summaryNum:     { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  summaryLbl:     { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  filterRow:      { paddingHorizontal: 12, paddingVertical: 6, flexDirection: 'row' },
  chip:           { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, backgroundColor: '#fff', marginRight: 8, borderWidth: 1, borderColor: '#ddd' },
  chipActive:     { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  chipText:       { fontSize: 13, color: '#555' },
  chipTextActive: { color: '#fff', fontWeight: '600' },
  list:           { padding: 12 },
  card:           { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  cardPaid:       { opacity: 0.6 },
  cardTop:        { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  custName:       { fontSize: 16, fontWeight: '700', color: '#222' },
  custMeta:       { fontSize: 12, color: '#888', marginTop: 2 },
  badge:          { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  badgeDue:       { backgroundColor: '#FFF3CD' },
  badgePaid:      { backgroundColor: '#D4EDDA' },
  badgeText:      { fontSize: 11, fontWeight: '700' },
  amounts:        { flexDirection: 'row', marginBottom: 10 },
  amtBox:         { flex: 1, alignItems: 'center' },
  amtLabel:       { fontSize: 11, color: '#999' },
  amtValue:       { fontSize: 15, fontWeight: '700', color: '#222', marginTop: 2 },
  collectBtn:     { backgroundColor: '#007AFF', borderRadius: 8, padding: 10, alignItems: 'center' },
  collectBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  empty:          { alignItems: 'center', paddingVertical: 60 },
  emptyIcon:      { fontSize: 50, marginBottom: 10 },
  emptyText:      { fontSize: 16, color: '#888' },
  bottomNav:      { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingBottom: 20, paddingTop: 8 },
  navItem:        { flex: 1, alignItems: 'center', paddingVertical: 8 },
  navIcon:        { fontSize: 22, marginBottom: 3 },
  navLabel:       { fontSize: 11, color: '#666' },
  modalOverlay:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox:       { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalTitle:     { fontSize: 18, fontWeight: 'bold', color: '#222', marginBottom: 4 },
  modalSub:       { fontSize: 14, color: '#888', marginBottom: 16 },
  fieldLabel:     { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6 },
  input:          { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 16 },
  modalBtns:      { flexDirection: 'row', gap: 12 },
  cancelBtn:      { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  cancelBtnText:  { fontSize: 15, color: '#555' },
  saveBtn:        { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#007AFF', alignItems: 'center' },
  saveBtnText:    { fontSize: 15, color: '#fff', fontWeight: '700' },
});
