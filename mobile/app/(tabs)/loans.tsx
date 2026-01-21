import AddLoanModal from '@/components/collections/AddLoanModal';
import Header from '@/components/layout/Header';
import { useLoanCollection } from '@/context/LoanCollectionContext';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    FlatList,
    SafeAreaView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function LoansScreen() {
  const router = useRouter();
  const { loans, addLoan, customers, lines, areas } = useLoanCollection();
  const [showAddLoanModal, setShowAddLoanModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'defaulted'>('all');

  const handleAddLoan = () => {
    if (customers.length === 0) {
      Alert.alert('No Customers', 'Please add customers first before creating loans');
      return;
    }
    setShowAddLoanModal(true);
  };

  const handleSaveLoan = (loanData: any) => {
    const newLoan = {
      id: Date.now().toString(),
      ...loanData,
      createdAt: new Date(),
    };

    addLoan(newLoan);
    setShowAddLoanModal(false);
    Alert.alert('Success', 'Loan created successfully!');
  };

  const getFilteredLoans = () => {
    let filtered = loans;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter((loan) => loan.status === filterStatus);
    }

    // Filter by search
    if (searchQuery) {
      filtered = filtered.filter((loan) => {
        const customer = customers.find((c) => c.id === loan.customerId);
        return (
          customer?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          customer?.phone.includes(searchQuery) ||
          loan.id.includes(searchQuery)
        );
      });
    }

    return filtered;
  };

  const renderLoanItem = ({ item }: { item: any }) => {
    const customer = customers.find((c) => c.id === item.customerId);
    const line = lines.find((l) => l.id === item.lineId);
    const progressPercentage = parseFloat(((item.paidAmount / item.totalAmount) * 100).toFixed(1));

    return (
      <TouchableOpacity style={styles.loanCard}>
        <View style={styles.loanHeader}>
          <View style={styles.loanTitleContainer}>
            <Text style={styles.loanId}>#{item.id.slice(-6)}</Text>
            <Text style={styles.customerName}>{customer?.name || 'Unknown'}</Text>
          </View>
          <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.loanAmounts}>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Principal:</Text>
            <Text style={styles.amountValue}>₹ {item.principalAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Interest ({item.interestRate}%):</Text>
            <Text style={styles.amountValue}>₹ {item.interestAmount.toFixed(2)}</Text>
          </View>
          <View style={[styles.amountRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Amount:</Text>
            <Text style={styles.totalValue}>₹ {item.totalAmount.toFixed(2)}</Text>
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercentage}%` as any }]} />
          </View>
          <Text style={styles.progressText}>{progressPercentage.toFixed(1)}% paid</Text>
        </View>

        {/* Installment Info */}
        <View style={styles.installmentInfo}>
          <View style={styles.installmentItem}>
            <Text style={styles.installmentLabel}>Paid</Text>
            <Text style={styles.installmentValue}>
              {item.paidInstallments}/{item.numberOfInstallments}
            </Text>
          </View>
          <View style={styles.installmentDivider} />
          <View style={styles.installmentItem}>
            <Text style={styles.installmentLabel}>Per Installment</Text>
            <Text style={styles.installmentValue}>₹ {item.installmentAmount.toFixed(2)}</Text>
          </View>
          <View style={styles.installmentDivider} />
          <View style={styles.installmentItem}>
            <Text style={styles.installmentLabel}>Remaining</Text>
            <Text style={[styles.installmentValue, styles.remainingAmount]}>
              ₹ {item.remainingAmount.toFixed(2)}
            </Text>
          </View>
        </View>

        {/* Dates */}
        <View style={styles.dateInfo}>
          <Text style={styles.dateText}>Started: {item.startDate}</Text>
          <Text style={styles.dateSeparator}>•</Text>
          <Text style={styles.dateText}>Due: {item.dueDate}</Text>
        </View>

        {line && (
          <View style={styles.lineInfo}>
            <Text style={styles.lineText}>Line: {line.lineName} ({line.lineType})</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const getStatusStyle = (status: string) => {
    const statusStyles: any = {
      active: styles.statusActive,
      completed: styles.statusCompleted,
      defaulted: styles.statusDefaulted,
    };
    return statusStyles[status] || styles.statusActive;
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Header 
        title="Loans" 
        showBack={true}
        onBackPress={() => router.replace('/')}
        rightAction={{
          icon: '+',
          onPress: handleAddLoan
        }}
      />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by customer or loan ID..."
          placeholderTextColor="#999"
        />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[styles.filterTab, filterStatus === 'all' && styles.activeFilterTab]}
          onPress={() => setFilterStatus('all')}
        >
          <Text style={[styles.filterTabText, filterStatus === 'all' && styles.activeFilterTabText]}>
            All ({loans.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filterStatus === 'active' && styles.activeFilterTab]}
          onPress={() => setFilterStatus('active')}
        >
          <Text style={[styles.filterTabText, filterStatus === 'active' && styles.activeFilterTabText]}>
            Active ({loans.filter(l => l.status === 'active').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filterStatus === 'completed' && styles.activeFilterTab]}
          onPress={() => setFilterStatus('completed')}
        >
          <Text style={[styles.filterTabText, filterStatus === 'completed' && styles.activeFilterTabText]}>
            Completed ({loans.filter(l => l.status === 'completed').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filterStatus === 'defaulted' && styles.activeFilterTab]}
          onPress={() => setFilterStatus('defaulted')}
        >
          <Text style={[styles.filterTabText, filterStatus === 'defaulted' && styles.activeFilterTabText]}>
            Defaulted ({loans.filter(l => l.status === 'defaulted').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Loan List */}
      <FlatList
        data={getFilteredLoans()}
        renderItem={renderLoanItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>💰</Text>
            <Text style={styles.emptyText}>No loans yet</Text>
            <Text style={styles.emptySubtext}>
              Tap the + button to create your first loan
            </Text>
          </View>
        }
      />

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/(tabs)/collection')}
        >
          <Text style={styles.navIcon}>💰</Text>
          <Text style={styles.navLabel}>Collection</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>💳</Text>
          <Text style={styles.navLabel}>Expense</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/(tabs)/customer')}
        >
          <Text style={styles.navIcon}>👥</Text>
          <Text style={styles.navLabel}>Customer</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>📊</Text>
          <Text style={styles.navLabel}>Reports</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/')}
        >
          <Text style={styles.navIcon}>⚙️</Text>
          <Text style={styles.navLabel}>Settings</Text>
        </TouchableOpacity>
      </View>

      {/* Add Loan Modal */}
      <AddLoanModal
        visible={showAddLoanModal}
        onClose={() => setShowAddLoanModal(false)}
        onSave={handleSaveLoan}
        customers={customers}
        lines={lines}
        areas={areas}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#34C759',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#333',
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 4,
    marginHorizontal: 4,
    borderRadius: 6,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  activeFilterTab: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  filterTabText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  activeFilterTabText: {
    color: '#fff',
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
  },
  loanCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  loanTitleContainer: {
    flex: 1,
  },
  loanId: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: '#D1F2EB',
  },
  statusCompleted: {
    backgroundColor: '#D4EDDA',
  },
  statusDefaulted: {
    backgroundColor: '#F8D7DA',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  loanAmounts: {
    backgroundColor: '#F9F9F9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
  },
  amountValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  totalRow: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginBottom: 0,
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1565C0',
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  installmentInfo: {
    flexDirection: 'row',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  installmentItem: {
    flex: 1,
    alignItems: 'center',
  },
  installmentDivider: {
    width: 1,
    backgroundColor: '#ddd',
    marginHorizontal: 8,
  },
  installmentLabel: {
    fontSize: 11,
    color: '#999',
    marginBottom: 4,
  },
  installmentValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  remainingAmount: {
    color: '#FF3B30',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#666',
  },
  dateSeparator: {
    marginHorizontal: 8,
    color: '#ccc',
  },
  lineInfo: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  lineText: {
    fontSize: 12,
    color: '#999',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingBottom: 20,
    paddingTop: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  navLabel: {
    fontSize: 11,
    color: '#666',
  },
});
