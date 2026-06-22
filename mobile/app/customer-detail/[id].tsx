import Header from '@/components/layout/Header';
import { useLoanCollection } from '@/context/LoanCollectionContext';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert, Linking, SafeAreaView,
  ScrollView, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { loanCollectionService } from '../../service/loan-collection.service';

export default function CustomerDetailScreen() {
  const { id }  = useLocalSearchParams<{ id: string }>();
  const router  = useRouter();
  const { customers, loans, areas, lines } = useLoanCollection();

  const customer  = customers.find(c => c.id === id);
  const custLoans = loans.filter(l => l.customerId === id);
  const area      = areas.find(a => a.id === customer?.areaId);
  const line      = lines.find(l => l.id === customer?.lineId);

  const [payments, setPayments] = useState<any[]>([]);
  const [tab, setTab]           = useState<'loans' | 'payments'>('loans');

  useEffect(() => {
    if (id) {
      loanCollectionService.getPaymentsByCustomer(id)
        .then(r => { if (r.success && r.data) setPayments(r.data); })
        .catch(() => {});
    }
  }, [id]);

  if (!customer) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="Customer" showBack onBackPress={() => router.back()} />
        <View style={styles.empty}><Text style={styles.emptyText}>Customer not found</Text></View>
      </SafeAreaView>
    );
  }

  const totalLoaned  = custLoans.reduce((s, l) => s + (l.principalAmount || 0), 0);
  const totalPaid    = custLoans.reduce((s, l) => s + (l.paidAmount      || 0), 0);
  const totalBalance = custLoans.reduce((s, l) => s + (l.balanceAmount   || 0), 0);
  const activeLoans  = custLoans.filter(l => l.status === 'active').length;

  const sendWhatsApp = () => {
    const phone = customer.phone?.replace(/\D/g, '');
    if (!phone) { Alert.alert('No phone number'); return; }
    const msg = encodeURIComponent(
      `Dear ${customer.name}, your loan balance is Rs.${totalBalance.toFixed(0)}. Please make the payment. - Pocketor`
    );
    Linking.openURL(`whatsapp://send?phone=91${phone}&text=${msg}`)
      .catch(() => Alert.alert('WhatsApp not installed'));
  };

  const callCustomer = () => {
    if (!customer.phone) { Alert.alert('No phone number'); return; }
    Linking.openURL(`tel:${customer.phone}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header title="Customer Detail" showBack onBackPress={() => router.back()} />
      <ScrollView>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{customer.name.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.custName}>{customer.name}</Text>
          <Text style={styles.custMeta}>{line?.lineName} {area ? '> ' + area.name : ''}</Text>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={callCustomer}>
              <Text style={styles.actionIcon}>📞</Text>
              <Text style={styles.actionLabel}>{customer.phone || 'Call'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionBtn, styles.waBtn]} onPress={sendWhatsApp}>
              <Text style={styles.actionIcon}>💬</Text>
              <Text style={[styles.actionLabel, { color: '#fff' }]}>WhatsApp</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>Rs.{totalLoaned.toFixed(0)}</Text>
            <Text style={styles.statLbl}>Loaned</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: '#2e7d32' }]}>Rs.{totalPaid.toFixed(0)}</Text>
            <Text style={styles.statLbl}>Paid</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statVal, { color: '#e53935' }]}>Rs.{totalBalance.toFixed(0)}</Text>
            <Text style={styles.statLbl}>Balance</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statVal}>{activeLoans}</Text>
            <Text style={styles.statLbl}>Active</Text>
          </View>
        </View>

        {customer.address ? (
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📍</Text>
            <Text style={styles.infoText}>{customer.address}</Text>
          </View>
        ) : null}

        {/* Tabs */}
        <View style={styles.tabRow}>
          <TouchableOpacity style={[styles.tab, tab === 'loans' && styles.tabActive]} onPress={() => setTab('loans')}>
            <Text style={[styles.tabText, tab === 'loans' && styles.tabTextActive]}>Loans ({custLoans.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tab, tab === 'payments' && styles.tabActive]} onPress={() => setTab('payments')}>
            <Text style={[styles.tabText, tab === 'payments' && styles.tabTextActive]}>Payments ({payments.length})</Text>
          </TouchableOpacity>
        </View>

        {tab === 'loans' && custLoans.map(loan => {
          const progress = loan.totalAmount > 0 ? (loan.paidAmount / loan.totalAmount) * 100 : 0;
          return (
            <TouchableOpacity
              key={loan.id}
              style={styles.loanCard}
              onPress={() => router.push({ pathname: '/loan-detail/[id]', params: { id: loan.id } })}
            >
              <View style={styles.loanTop}>
                <Text style={styles.loanId}>#{loan.id.slice(-6)}</Text>
                <View style={[styles.badge,
                  loan.status === 'active'    ? styles.badgeActive :
                  loan.status === 'completed' ? styles.badgeDone   : styles.badgeBad]}>
                  <Text style={styles.badgeText}>{loan.status}</Text>
                </View>
              </View>
              <View style={styles.loanAmts}>
                <Text style={styles.loanAmt}>Principal: Rs.{(loan.principalAmount || 0).toFixed(0)}</Text>
                <Text style={styles.loanAmt}>Balance: Rs.{(loan.balanceAmount || 0).toFixed(0)}</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` as any }]} />
              </View>
              <Text style={styles.progressTxt}>{progress.toFixed(1)}% paid — Tap for details</Text>
            </TouchableOpacity>
          );
        })}

        {tab === 'payments' && (
          payments.length === 0
            ? <View style={styles.empty}><Text style={styles.emptyText}>No payments yet</Text></View>
            : payments.map((p: any) => (
              <View key={p.id} style={styles.payRow}>
                <View>
                  <Text style={styles.payAmt}>Rs.{parseFloat(p.amount).toFixed(2)}</Text>
                  <Text style={styles.payDate}>{p.paymentDate || p.createdAt}</Text>
                </View>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{p.paymentType}</Text>
                </View>
              </View>
            ))
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: '#f5f5f5' },
  profileCard:   { backgroundColor: '#007AFF', padding: 24, alignItems: 'center' },
  avatar:        { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  avatarText:    { fontSize: 32, color: '#fff', fontWeight: 'bold' },
  custName:      { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  custMeta:      { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4, marginBottom: 14 },
  actionRow:     { flexDirection: 'row', gap: 12 },
  actionBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  waBtn:         { backgroundColor: '#25D366' },
  actionIcon:    { fontSize: 16 },
  actionLabel:   { fontSize: 13, color: '#fff', fontWeight: '600' },
  statsRow:      { flexDirection: 'row', backgroundColor: '#fff', padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  statBox:       { flex: 1, alignItems: 'center' },
  statVal:       { fontSize: 15, fontWeight: 'bold', color: '#222' },
  statLbl:       { fontSize: 10, color: '#888', marginTop: 3, textAlign: 'center' },
  infoRow:       { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: '#fff', marginTop: 1 },
  infoIcon:      { fontSize: 16, marginRight: 8 },
  infoText:      { fontSize: 14, color: '#555' },
  tabRow:        { flexDirection: 'row', backgroundColor: '#fff', marginTop: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  tab:           { flex: 1, padding: 14, alignItems: 'center' },
  tabActive:     { borderBottomWidth: 2, borderBottomColor: '#007AFF' },
  tabText:       { fontSize: 14, color: '#888' },
  tabTextActive: { color: '#007AFF', fontWeight: '700' },
  loanCard:      { backgroundColor: '#fff', margin: 10, marginBottom: 0, borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#eee' },
  loanTop:       { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  loanId:        { fontSize: 12, color: '#999' },
  loanAmts:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  loanAmt:       { fontSize: 13, color: '#555' },
  progressBar:   { height: 6, backgroundColor: '#eee', borderRadius: 3, overflow: 'hidden' },
  progressFill:  { height: '100%', backgroundColor: '#34C759', borderRadius: 3 },
  progressTxt:   { fontSize: 11, color: '#999', marginTop: 3, textAlign: 'right' },
  badge:         { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10, backgroundColor: '#eee' },
  badgeActive:   { backgroundColor: '#E8F5E9' },
  badgeDone:     { backgroundColor: '#E3F2FD' },
  badgeBad:      { backgroundColor: '#FFEBEE' },
  badgeText:     { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  payRow:        { backgroundColor: '#fff', margin: 10, marginBottom: 0, borderRadius: 10, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#eee' },
  payAmt:        { fontSize: 16, fontWeight: 'bold', color: '#2e7d32' },
  payDate:       { fontSize: 12, color: '#999', marginTop: 2 },
  empty:         { alignItems: 'center', padding: 40 },
  emptyText:     { fontSize: 15, color: '#888' },
});
