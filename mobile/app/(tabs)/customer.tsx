import AddCustomerModal from '@/components/collections/AddCustomerModal';
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

export default function CustomerScreen() {
  const router = useRouter();
  const { customers, addCustomer, lines, areas } = useLoanCollection();
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleAddCustomer = () => {
    if (lines.length === 0) {
      Alert.alert('No Lines', 'Please create a line first before adding customers');
      return;
    }
    if (areas.length === 0) {
      Alert.alert('No Areas', 'Please create an area first before adding customers');
      return;
    }
    setShowAddCustomerModal(true);
  };

  const handleSaveCustomer = (customerData: any) => {
    const newCustomer = {
      id: Date.now().toString(),
      ...customerData,
      createdAt: new Date(),
    };

    addCustomer(newCustomer);
    setShowAddCustomerModal(false);
    Alert.alert('Success', 'Customer added successfully!');
  };

  const filteredCustomers = customers.filter((customer) =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.phone.includes(searchQuery)
  );

  const renderCustomerItem = ({ item }: { item: any }) => {
    const line = lines.find((l) => l.id === item.lineId);
    const area = areas.find((a) => a.id === item.areaId);

    const getStatusStyle = (status: string) => {
      const statusStyles: any = {
        active: styles.statusactive,
        completed: styles.statuscompleted,
        defaulted: styles.statusdefaulted,
      };
      return statusStyles[status] || styles.statusactive;
    };

    return (
      <TouchableOpacity style={styles.customerCard}>
        <View style={styles.customerHeader}>
          <Text style={styles.customerName}>{item.name}</Text>
          <View style={[styles.statusBadge, getStatusStyle(item.status)]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        
        <View style={styles.customerInfo}>
          <Text style={styles.customerPhone}>📞 {item.phone}</Text>
          <Text style={styles.customerAddress}>📍 {item.address}</Text>
        </View>

        {line && area && (
          <View style={styles.customerMeta}>
            <Text style={styles.metaText}>Line: {line.lineName}</Text>
            <Text style={styles.metaSeparator}>•</Text>
            <Text style={styles.metaText}>Area: {area.name}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Header 
        title="Customers" 
        showBack={true}
        onBackPress={() => router.replace('/')}
        rightAction={{
          icon: '+',
          onPress: handleAddCustomer
        }}
      />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by name or phone..."
          placeholderTextColor="#999"
        />
      </View>

      {/* Customer List */}
      <FlatList
        data={filteredCustomers}
        renderItem={renderCustomerItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyText}>No customers yet</Text>
            <Text style={styles.emptySubtext}>
              Tap the + button to add your first customer
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
        <TouchableOpacity style={styles.navItem}>
          <Text style={[styles.navIcon, styles.activeNavIcon]}>👥</Text>
          <Text style={[styles.navLabel, styles.activeNavLabel]}>Customer</Text>
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

      {/* Add Customer Modal */}
      <AddCustomerModal
        visible={showAddCustomerModal}
        onClose={() => setShowAddCustomerModal(false)}
        onSave={handleSaveCustomer}
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
  listContainer: {
    padding: 16,
    paddingTop: 0,
  },
  customerCard: {
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
  customerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  customerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusactive: {
    backgroundColor: '#D1F2EB',
  },
  statuscompleted: {
    backgroundColor: '#D4EDDA',
  },
  statusdefaulted: {
    backgroundColor: '#F8D7DA',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  customerInfo: {
    marginBottom: 12,
  },
  customerPhone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  customerAddress: {
    fontSize: 14,
    color: '#666',
  },
  customerMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  metaText: {
    fontSize: 12,
    color: '#999',
  },
  metaSeparator: {
    marginHorizontal: 8,
    color: '#ccc',
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
  activeNavIcon: {
    opacity: 1,
  },
  activeNavLabel: {
    color: '#007AFF',
    fontWeight: '600',
  },
});
