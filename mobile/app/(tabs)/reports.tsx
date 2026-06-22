import Header from '@/components/layout/Header';
import { useLoanCollection } from '@/context/LoanCollectionContext';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Tab = 'overview' | 'loans' | 'collections';

export default function ReportsScreen() {
  const router = useRouter();
  const { loans, customers, payments, lines, areas } = useLoanCollection();
  const [tab, setTab] = useState<Tab>('overview');

  const stats = useMemo(() => {
    const totalLoaned    = loans.reduce((s, l) => s + (l.principalAmount || 0), 0);
    const totalCollected = payments.reduce((s, p) => s + (p.amount || 0), 0);
    const totalPending   = loans.filter(l => l.status === 'active').reduce((s, l) => s + (l.balanceAmount || 0), 0);
    const activeLoans    = loans.filter(l => l.status === 'active').length;
    const completedLoans = loans.filter(l => l.status === 'completed').length;
    const defaultedLoans = loans.filter(l => l.status === 'defaulted').length;
    return { totalLoaned, totalCollected, totalPending, activeLoans, completedLoans, defaultedLoans };
  }, [loans, payments]);

  const StatCard = ({ label, value, color = '#007AFF' }: { label: string; value: string; color?: string }) => (
    <View style={styles.statCard}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Header
        title="Reports"
        showBack={true}
        onBackPress={() => router.replace('/')}
      />

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['overview', 'loans', 'collections'] as Tab[]).map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tab, tab === t && styles.tabActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {tab === 'overview' && (
          <>
            <Text style={styles.sectionTitle}>Financial Overview</Text>
            <View style={styles.statsGrid}>
              <StatCard label="Total Loaned" value={`₹ ${stats.totalLoaned.toFixed(2)}`} color="#1565C0" />
              <StatCard label="Total Collected" value={`₹ ${stats.totalCollected.toFixed(2)}`} color="#2e7d32" />
              <StatCard label="Pending Recovery" value={`₹ ${stats.totalPending.toFixed(2)}`} color="#e53935" />
              <StatCard label="Total Customers" value={`${customers.length}`} color="#6a1b9a" />
            </View>

            <Text style={styles.sectionTitle}>Loan Status</Text>
            <View style={styles.statusRow}>
              <View style={[styles.statusBox, { backgroundColor: '#E8F5E9' }]}>
                <Text style={[styles.statusNum, { color: '#2e7d32' }]}>{stats.activeLoans}</Text>
                <Text style={styles.statusLbl}>Active</Text>
              </View>
              <View style={[styles.statusBox, { backgroundColor: '#E3F2FD' }]}>
                <Text style={[styles.statusNum, { color: '#1565C0' }]}>{stats.completedLoans}</Text>
                <Text style={styles.statusLbl}>Completed</Text>
              </View>
              <View style={[styles.statusBox, { backgroundColor: '#FFEBEE' }]}>
                <Text style={[styles.statusNum, { color: '#c62828' }]}>{stats.defaultedLoans}</Text>
                <Text style={styles.statusLbl}>Defaulted</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Lines & Areas</Text>
            <View style={styles.statsGrid}>
              <StatCard label="Total Lines" value={`${lines.length}`} color="#00796b" />
              <StatCard label="Total Areas" value={`${areas.length}`} color="#f57c00" />
            </View>
          </>
        )}

        {tab === 'loans' && (
          <>
            <Text style={styles.sectionTitle}>Loan Details ({loans.length})</Text>
            {loans.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>💰</Text>
                <Text style={styles.emptyText}>No loans yet</Text>
              </View>
            ) : loans.map(loan => {
              const customer = customers.find(c => c.id === loan.customerId);
              const progress = loan.totalAmount > 0
                ? ((loan.paidAmount || 0) / loan.totalAmount) * 100 : 0;
              return (
                <View key={loan.id} style={styles.loanRow}>
                  <View style={styles.loanRowTop}>
                    <Text style={styles.loanName}>{customer?.name || 'Unknown'}</Text>
                    <View style={[styles.badge,
                      loan.status === 'active' ? styles.badgeActive :
                      loan.status === 'completed' ? styles.badgeDone : styles.badgeBad]}>
                      <Text style={styles.badgeText}>{loan.status}</Text>
                    </View>
                  </View>
                  <View style={styles.loanRowMid}>
                    <Text style={styles.loanAmt}>Principal: ₹{(loan.principalAmount || 0).toFixed(2)}</Text>
                    <Text style={styles.loanAmt}>Balance: ₹{(loan.balanceAmount || 0).toFixed(2)}</Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` as any }]} />
                  </View>
                  <Text style={styles.progressText}>{progress.toFixed(1)}% paid</Text>
                </View>
              );
            })}
          </>
        )}

        {tab === 'collections' && (
          <>
            <Text style={styles.sectionTitle}>Recent Payments ({payments.length})</Text>
            {payments.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyText}>No payments recorded</Text>
              </View>
            ) : [...payments].slice(0, 50).map((p: any) => {
              const customer = customers.find(c => c.id === p.customerId);
              return (
                <View key={p.id} style={styles.payRow}>
                  <View>
                    <Text style={styles.payName}>{customer?.name || 'Unknown'}</Text>
                    <Text style={styles.payDate}>{p.paymentDate || p.createdAt}</Text>
                  </View>
                  <Text style={styles.payAmt}>₹ {parseFloat(p.amount).toFixed(2)}</Text>
                </View>
              );
            })}
          </>
        )}
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
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>📊</Text><Text style={[styles.navLabel, styles.activeLabel]}>Reports</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => router.push('/(tabs)/settings')}>
          <Text style={styles.navIcon}>⚙️</Text><Text style={styles.navLabel}>Settings</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  tabRow: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#007AFF' },
  tabText: { fontSize: 14, color: '#888' },
  tabTextActive: { color: '#007AFF', fontWeight: '700' },
  content: { padding: 16, paddingBottom: 40 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#222', marginTop: 16, marginBottom: 10 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '47%', backgroundColor: '#fff', borderRadius: 10, padding: 14, borderWidth: 1, borderColor: '#eee' },
  statLabel: { fontSize: 12, color: '#888', marginBottom: 6 },
  statValue: { fontSize: 18, fontWeight: 'bold' },
  statusRow: { flexDirection: 'row', gap: 10 },
  statusBox: { flex: 1, borderRadius: 10, padding: 14, alignItems: 'center' },
  statusNum: { fontSize: 24, fontWeight: 'bold' },
  statusLbl: { fontSize: 12, color: '#555', marginTop: 4 },
  loanRow: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#eee' },
  loanRowTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  loanName: { fontSize: 15, fontWeight: '600', color: '#222' },
  loanRowMid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  loanAmt: { fontSize: 13, color: '#666' },
  badge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  badgeActive: { backgroundColor: '#E8F5E9' },
  badgeDone: { backgroundColor: '#E3F2FD' },
  badgeBad: { backgroundColor: '#FFEBEE' },
  badgeText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  progressBar: { height: 6, backgroundColor: '#eee', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#34C759', borderRadius: 3 },
  progressText: { fontSize: 11, color: '#999', marginTop: 3, textAlign: 'right' },
  payRow: { backgroundColor: '#fff', borderRadius: 10, padding: 14, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderWidth: 1, borderColor: '#eee' },
  payName: { fontSize: 15, fontWeight: '600', color: '#222' },
  payDate: { fontSize: 12, color: '#999', marginTop: 2 },
  payAmt: { fontSize: 16, fontWeight: 'bold', color: '#2e7d32' },
  empty: { alignItems: 'center', paddingVertical: 50 },
  emptyIcon: { fontSize: 50, marginBottom: 10 },
  emptyText: { fontSize: 16, color: '#888' },
  bottomNav: { flexDirection: 'row', backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f0f0f0', paddingBottom: 20, paddingTop: 8 },
  navItem: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  navIcon: { fontSize: 22, marginBottom: 3 },
  navLabel: { fontSize: 11, color: '#666' },
  activeLabel: { color: '#007AFF', fontWeight: '600' },
});
