import Header from '@/components/layout/Header';
import { useLoanCollection } from '@/context/LoanCollectionContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert, Modal, SafeAreaView, ScrollView,
  StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { loanCollectionService } from '../../service/loan-collection.service';

export default function LoanDetailScreen() {
  const { id }   = useLocalSearchParams<{ id: string }>();
  const router   = useRouter();
  const { loans, customers, lines, recordPayment, updateLoan } = useLoanCollection();

  const loan     = loans.find(l => l.id === id);
  const customer = customers.find(c => c.id === loan?.customerId);
  const line     = lines.find(l => l.id === loan?.lineId);

  const [payments, setPayments] = useState<any[]>([]);
  const [tab, setTab]           = useState<'schedule' | 'history'>('schedule');
  const [payModal, setPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    if (id) {
      loanCollectionService.getPaymentsByLoan(id)
        .then(r => { if (r.success && r.data) setPayments(r.data); })
        .catch(() => {});
    }
  }, [id]);

  if (!loan) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Loan" showBack onBackPress={() => router.back()} />
        <View style={styles.empty}><Text style={styles.emptyText}>Loan not found</Text></View>
      </SafeAreaView>
    );
  }

  const progress = loan.totalAmount > 0 ? (loan.paidAmount / loan.totalAmount) * 100 : 0;

  // Build installment schedule
  const schedule = Array.from({ length: loan.noOfInstalls || loan.numberOfInstallments || 0 }, (_, i) => ({
    no:     i + 1,
    amount: loan.installmentAmount || 0,
  }));

  const handleCollect = async () => {
    if (!payAmount || isNaN(Number(payAmount)) || Number(payAmount) <= 0) {
      Alert.alert('Error', 'Enter a valid amount'); return;
    }
    setSaving(true);
    try {
      await recordPayment({
        loanId:      loan.id,
        customerId:  loan.customerId,
        amount:      Number(payAmount),
        paymentDate: new Date().toISOString().slice(0, 10),
        paymentType: 'installment',
      });
      // Refresh payments list
      const r = await loanCollectionService.getPaymentsByLoan(id);
      if (r.success && r.data) setPayments(r.data);
      setPayModal(false);
      setPayAmount('');
      Alert.alert('Success', 'Payment recorded!');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseLoan = () => {
    Alert.alert('Close Loan', 'Mark this loan as completed?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Close', style: 'destructive', onPress: async () => {
        try {
          await updateLoan(loan.id, { ...loan, status: 'completed' });
          Alert.alert('Done', 'Loan marked as completed');
          router.back();
        } catch (e: any) {
          Alert.alert('Error', e.message);
        }
      }},
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Loan Detail" showBack onBackPress={() => router.back()} />

      <ScrollView>
        {/* Header card */}
        <View style={styles.headerCard}>
          <Text style={styles.custName}>{customer?.name || 'Unknown'}</Text>
          <Text style={styles.custMeta}>{line?.lineName} • {line?.lineType}</Text>
          <View style={[styles.badge,
            loan.status === 'active'    ? styles.badgeActive :
            loan.status === 'completed' ? styles.badgeDone   : styles.badgeBad]}>
            <Text style={styles.badgeText}>{loan.status?.toUpperCase()}</Text>
          </View>
        </View>

        {/* Amounts grid */}
        <View style={styles.amtGrid}>
          <View style={styles.amtBox}>
            <Text style={styles.amtVal}>Rs.{(loan.principalAmount || 0).toFixed(0)}</Text>
            <Text style={styles.amtLbl}>Principal</Text>
          </View>
          <View style={styles.amtBox}>
            <Text style={styles.amtVal}>Rs.{(loan.totalAmount || 0).toFixed(0)}</Text>
            <Text style={styles.amtLbl}>Total</Text>
          </View>
          <View style={styles.amtBox}>
            <Text style={[styles.amtVal, { color: '#2e7d32' }]}>Rs.{(loan.paidAmount || 0).toFixed(0)}</Text>
            <Text style={styles.amtLbl}>Paid</Text>
          </View>
          <View style={styles.amtBox}>
            <Text style={[styles.amtVal, { color: '#e53935' }]}>Rs.{(loan.balanceAmount || 0).toFixed(0)}</Text>
            <Text style={styles.amtLbl}>Balance</Text>
          </View>
        </View>

        {/* Progress */}
        <View style={styles.progressWrap}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` as any }]} />
          </View>
          <Text style={styles.progressTxt}>{progress.toFixed(1)}% collected</Text>
        </View>

        {/* Info */}
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}><Text style={styles.infoLbl}>Interest Rate</Text><Text style={styles.infoVal}>{loan.interestRate}%</Text></View>
          <View style={styles.infoItem}><Text style={styles.infoLbl}>Installments</Text><Text style={styles.infoVal}>{loan.noOfInstalls || loan.numberOfInstallments}</Text></View>
          <View style={styles.infoItem}><Text style={styles.infoLbl}>Per Install</Text><Text style={styles.infoVal}>Rs.{(loan.installmentAmount || 0).toFixed(0)}</Text></View>
          <View style={styles.infoItem}><Text style={styles.infoLbl}>Start Date</Text><Text style={styles.infoVal}>{loan.startDate || '—'}</Text></View>
        </View>

        {/* Action buttons */}
        {loan.status === 'active' && (
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.collectBtn} onPress={() => { setPayAmount(String(loan.installmentAmount || '')); setPayModal(true); }}>
              <Text style={styles.collectBtnText}>💵 Collect Payment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.closeBtn} onPress={handleCloseLoan}>
              <Text style={styles.closeBtnText}>✅ Close Loan</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Tabs */}
        <View style={styles.tabRow}>
          <TouchableOpacity style={[styles.tab, tab === 'schedule' && styles.tabActive]} onPress={() => setTab('schedule')}>
            <Text style={[styles.tabText, tab === 'schedule' && styles.tabTextActive]}>Schedule</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, tab === 'history' && styles.tabActive]} onPress={() => setTab('history')}>
            <Text style={[styles.tabText, tab === 'history' && styles.tabTextActive]}>History ({payments.length})</Text>
          </TouchableOpacity>
        </View>

        {tab === 'schedule' && schedule.map((item, idx) => {
          const paid = payments.length > idx;
          return (
            <View key={item.no} style={[styles.schedRow, paid && styles.schedRowPaid]}>
              <Text style={styles.schedNo}>#{item.no}</Text>
              <Text style={styles.schedAmt}>Rs.{item.amount.toFixed(0)}</Text>
              <View style={[styles.schedBadge, paid ? styles.badgeDone : styles.badgeActive]}>
                <Text style={styles.badgeText}>{paid ? 'PAID' : 'DUE'}</Text>
              </View>
            </View>
          );
        })}

        {tab === 'history' && (
          payments.length === 0
            ? <View style={styles.empty}><Text style={styles.emptyText}>No payments yet</Text></View>
            : payments.map((p: any) => (
              <View key={p.id} style={styles.payRow}>
                <View>
                  <Text style={styles.payAmt}>Rs.{parseFloat(p.amount).toFixed(2)}</Text>
                  <Text style={styles.payDate}>{p.paymentDate || p.createdAt}</Text>
                </View>
                <Text style={styles.payType}>{p.paymentType}</Text>
              </View>
            ))
        )}
      </ScrollView>

      {/* Payment Modal */}
      <Modal visible={payModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Record Payment</Text>
            <Text style={styles.modalSub}>{customer?.name}</Text>
            <Text style={styles.fieldLabel}>Amount (Rs.)</Text>
            <TextInput
              style={styles.input}
              value={payAmount}
              onChangeText={setPayAmount}
              keyboardType="numeric"
              placeholder="Enter amount"
            />
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setPayModal(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleCollect} disabled={saving}>
                <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#f5f5f5' },
  headerCard:    { backgroundColor: '#007AFF', padding: 20, alignItems: 'center' },
  custName:      { fontSize: 20, fontWeight: 'bold', color: '#fff', marginBottom: 4 },
  custMeta:      { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 10 },
  badge:         { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  badgeActive:   { backgroundColor: '#E8F5E9' },
  badgeDone:     { backgroundColor: '#E3F2FD' },
  badgeBad:      { backgroundColor: '#FFEBEE' },
  badgeText:     { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  amtGrid:       { flexDirection: 'row', backgroundColor: '#fff', padding: 16 },
  amtBox:        { flex: 1, alignItems: 'center' },
  amtVal:        { fontSize: 14, fontWeight: 'bold', color: '#222' },
  amtLbl:        { fontSize: 10, color: '#888', marginTop: 3 },
  progressWrap:  { backgroundColor: '#fff', paddingHorizontal: 16, paddingBottom: 14 },
  progressBar:   { height: 8, backgroundColor: '#eee', borderRadius: 4, overflow: 'hidden', marginBottom: 4 },
  progressFill:  { height: '100%', backgroundColor: '#34C759', borderRadius: 4 },
  progressTxt:   { fontSize: 12, color: '#888', textAlign: 'right' },
  infoGrid:      { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#fff', padding: 12, marginTop: 1 },
  infoItem:      { width: '50%', padding: 8 },
  infoLbl:       { fontSize: 11, color: '#888' },
  infoVal:       { fontSize: 15, fontWeight: '600', color: '#222', marginTop: 2 },
  actionRow:     { flexDirection: 'row', padding: 16, gap: 10 },
  collectBtn:    { flex: 1, backgroundColor: '#007AFF', borderRadius: 10, padding: 13, alignItems: 'center' },
  collectBtnText:{ color: '#fff', fontWeight: '700', fontSize: 14 },
  closeBtn:      { flex: 1, backgroundColor: '#fff', borderRadius: 10, padding: 13, alignItems: 'center', borderWidth: 1, borderColor: '#ddd' },
  closeBtnText:  { color: '#333', fontWeight: '700', fontSize: 14 },
  tabRow:        { flexDirection: 'row', backgroundColor: '#fff', marginTop: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  tab:           { flex: 1, padding: 14, alignItems: 'center' },
  tabActive:     { borderBottomWidth: 2, borderBottomColor: '#007AFF' },
  tabText:       { fontSize: 14, color: '#888' },
  tabTextActive: { color: '#007AFF', fontWeight: '700' },
  schedRow:      { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 14, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  schedRowPaid:  { opacity: 0.5 },
  schedNo:       { width: 40, fontSize: 14, color: '#888' },
  schedAmt:      { flex: 1, fontSize: 15, fontWeight: '600', color: '#222' },
  schedBadge:    { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  payRow:        { backgroundColor: '#fff', margin: 10, marginBottom: 0, borderRadius: 10, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#eee' },
  payAmt:        { fontSize: 16, fontWeight: 'bold', color: '#2e7d32' },
  payDate:       { fontSize: 12, color: '#999', marginTop: 2 },
  payType:       { fontSize: 12, color: '#888', textTransform: 'capitalize' },
  empty:         { alignItems: 'center', padding: 40 },
  emptyText:     { fontSize: 15, color: '#888' },
  modalOverlay:  { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalBox:      { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  modalTitle:    { fontSize: 18, fontWeight: 'bold', color: '#222', marginBottom: 4 },
  modalSub:      { fontSize: 14, color: '#888', marginBottom: 16 },
  fieldLabel:    { fontSize: 13, fontWeight: '600', color: '#444', marginBottom: 6 },
  input:         { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, fontSize: 16, marginBottom: 16 },
  modalBtns:     { flexDirection: 'row', gap: 12 },
  cancelBtn:     { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#ddd', alignItems: 'center' },
  cancelBtnText: { fontSize: 15, color: '#555' },
  saveBtn:       { flex: 1, padding: 14, borderRadius: 10, backgroundColor: '#007AFF', alignItems: 'center' },
  saveBtnText:   { fontSize: 15, color: '#fff', fontWeight: '700' },
});
