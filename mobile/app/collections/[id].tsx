import { useCollections } from '@/context/CollectionsContext';
import { calculateInterest, formatCurrency, getFrequencyText, getMonthsBetweenDates } from '@/utils/calculations';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

export default function CollectionDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { getCollection, addContribution, addMember } = useCollections();
  const [showAddMember, setShowAddMember] = useState(false);
  const [showAddContribution, setShowAddContribution] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [contributionAmount, setContributionAmount] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');

  const collection = getCollection(id as string);

  if (!collection) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Collection not found</Text>
      </View>
    );
  }

  const handleAddMember = () => {
    if (!memberName.trim()) {
      Alert.alert('Error', 'Member name is required');
      return;
    }

    addMember(collection.id, {
      name: memberName.trim(),
      joinedDate: new Date().toISOString().split('T')[0],
    });

    setMemberName('');
    setShowAddMember(false);
    Alert.alert('Success', 'Member added successfully!');
  };

  const handleAddContribution = () => {
    if (!selectedMemberId) {
      Alert.alert('Error', 'Please select a member');
      return;
    }

    if (!contributionAmount.trim() || isNaN(Number(contributionAmount))) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    addContribution(collection.id, {
      memberId: selectedMemberId,
      amount: Number(contributionAmount),
      date: new Date().toISOString().split('T')[0],
      frequency: collection.frequency,
    });

    setContributionAmount('');
    setSelectedMemberId('');
    setShowAddContribution(false);
    Alert.alert('Success', 'Contribution recorded successfully!');
  };

  // Calculate interest
  const monthsActive = getMonthsBetweenDates(collection.createdDate, new Date().toISOString().split('T')[0]);
  const interestData = calculateInterest(
    collection.totalAmount,
    collection.interestRate,
    monthsActive,
    collection.interestType,
    collection.frequency
  );

  // Get member contributions
  const memberStats = collection.members.map((member) => {
    const memberContributions = collection.contributions.filter((c) => c.memberId === member.id);
    const totalContributed = memberContributions.reduce((sum, c) => sum + c.amount, 0);
    const memberInterest = (totalContributed * collection.interestRate * monthsActive) / (100 * 12);

    return {
      ...member,
      totalContributed,
      memberInterest: Math.round(memberInterest * 100) / 100,
      count: memberContributions.length,
    };
  });

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Card */}
      <View style={styles.headerCard}>
        <Text style={styles.collectionName}>{collection.name}</Text>
        <Text style={styles.status}>{collection.status.toUpperCase()}</Text>
      </View>

      {/* Summary Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Amount</Text>
          <Text style={styles.statValue}>{formatCurrency(collection.totalAmount)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Interest</Text>
          <Text style={styles.statValue}>{formatCurrency(interestData.interest)}</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total with Interest</Text>
          <Text style={styles.statValue}>{formatCurrency(interestData.total)}</Text>
        </View>
      </View>

      {/* Collection Details */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Collection Details</Text>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Interest Rate:</Text>
          <Text style={styles.detailValue}>{collection.interestRate}% ({collection.interestType})</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Frequency:</Text>
          <Text style={styles.detailValue}>{getFrequencyText(collection.frequency)}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Created:</Text>
          <Text style={styles.detailValue}>{collection.createdDate}</Text>
        </View>
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Duration:</Text>
          <Text style={styles.detailValue}>{monthsActive} month(s)</Text>
        </View>
      </View>

      {/* Members Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Members ({collection.members.length})</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddMember(true)}
          >
            <Text style={styles.addButtonText}>+ Add</Text>
          </TouchableOpacity>
        </View>

        {memberStats.length === 0 ? (
          <Text style={styles.emptyText}>No members added yet</Text>
        ) : (
          memberStats.map((member) => (
            <View key={member.id} style={styles.memberCard}>
              <View>
                <Text style={styles.memberName}>{member.name}</Text>
                <Text style={styles.memberInfo}>
                  {member.count} contribution(s)
                </Text>
              </View>
              <View style={styles.memberStats}>
                <Text style={styles.memberStatValue}>
                  {formatCurrency(member.totalContributed)}
                </Text>
                <Text style={styles.memberStatLabel}>
                  +{formatCurrency(member.memberInterest)} interest
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Contributions Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Contributions ({collection.contributions.length})</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddContribution(true)}
          >
            <Text style={styles.addButtonText}>+ Record</Text>
          </TouchableOpacity>
        </View>

        {collection.contributions.length === 0 ? (
          <Text style={styles.emptyText}>No contributions yet</Text>
        ) : (
          collection.contributions.map((contribution) => {
            const member = collection.members.find((m) => m.id === contribution.memberId);
            return (
              <View key={contribution.id} style={styles.contributionItem}>
                <View>
                  <Text style={styles.contributionName}>{member?.name}</Text>
                  <Text style={styles.contributionDate}>{contribution.date}</Text>
                </View>
                <Text style={styles.contributionAmount}>
                  {formatCurrency(contribution.amount)}
                </Text>
              </View>
            );
          })
        )}
      </View>

      {/* Add Member Modal */}
      <Modal
        visible={showAddMember}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Member</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Member Name"
              value={memberName}
              onChangeText={setMemberName}
              placeholderTextColor="#999"
            />

            <View style={styles.modalButtonGroup}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowAddMember(false);
                  setMemberName('');
                }}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSubmit]}
                onPress={handleAddMember}
              >
                <Text style={styles.modalButtonText}>Add Member</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Contribution Modal */}
      <Modal
        visible={showAddContribution}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Record Contribution</Text>

            <Text style={styles.modalLabel}>Select Member</Text>
            <View style={styles.memberSelectContainer}>
              {collection.members.map((member) => (
                <TouchableOpacity
                  key={member.id}
                  style={[
                    styles.memberSelectOption,
                    selectedMemberId === member.id && styles.memberSelectOptionActive,
                  ]}
                  onPress={() => setSelectedMemberId(member.id)}
                >
                  <Text
                    style={[
                      styles.memberSelectText,
                      selectedMemberId === member.id && styles.memberSelectTextActive,
                    ]}
                  >
                    {member.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Amount</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Contribution Amount"
              value={contributionAmount}
              onChangeText={setContributionAmount}
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
            />

            <View style={styles.modalButtonGroup}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowAddContribution(false);
                  setContributionAmount('');
                  setSelectedMemberId('');
                }}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSubmit]}
                onPress={handleAddContribution}
              >
                <Text style={styles.modalButtonText}>Record</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#999',
  },
  headerCard: {
    backgroundColor: '#007AFF',
    padding: 20,
    marginBottom: 20,
  },
  collectionName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  addButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  detailLabel: {
    fontSize: 13,
    color: '#666',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  memberCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  memberInfo: {
    fontSize: 12,
    color: '#999',
  },
  memberStats: {
    alignItems: 'flex-end',
  },
  memberStatValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#34C759',
  },
  memberStatLabel: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    paddingVertical: 20,
    fontSize: 14,
  },
  contributionItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  contributionName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  contributionDate: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  contributionAmount: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    marginTop: 10,
  },
  modalInput: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    marginBottom: 10,
  },
  memberSelectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 10,
  },
  memberSelectOption: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  memberSelectOptionActive: {
    backgroundColor: '#E8F4FF',
    borderColor: '#007AFF',
  },
  memberSelectText: {
    fontSize: 13,
    color: '#666',
  },
  memberSelectTextActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
  modalButtonGroup: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f5f5f5',
  },
  modalButtonSubmit: {
    backgroundColor: '#007AFF',
  },
  modalButtonTextCancel: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
