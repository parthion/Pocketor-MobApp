import type { Area, Customer, Line } from '@/types/collection.types';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface AddLoanModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (loanData: any) => void;
  customers: Customer[];
  lines: Line[];
  areas: Area[];
}

export default function AddLoanModal({
  visible,
  onClose,
  onSave,
  customers,
  lines,
  areas,
}: AddLoanModalProps) {
  // Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [principalAmount, setPrincipalAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [numberOfInstallments, setNumberOfInstallments] = useState('');
  const [startDate, setStartDate] = useState(new Date().toLocaleDateString());
  const [notes, setNotes] = useState('');

  // Calculated Fields
  const [interestAmount, setInterestAmount] = useState('0');
  const [totalAmount, setTotalAmount] = useState('0');
  const [installmentAmount, setInstallmentAmount] = useState('0');
  const [dueDate, setDueDate] = useState('');

  // Picker State
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showLinePicker, setShowLinePicker] = useState(false);
  const [showAreaPicker, setShowAreaPicker] = useState(false);

  // Filter State
  const [selectedLineId, setSelectedLineId] = useState('');
  const [selectedAreaId, setSelectedAreaId] = useState('');

  // Filtered Data
  const [filteredAreas, setFilteredAreas] = useState<Area[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);

  // Get selected objects
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);
  const selectedLine = lines.find((l) => l.id === selectedLineId);
  const selectedArea = areas.find((a) => a.id === selectedAreaId);

  // Filter areas when line changes
  useEffect(() => {
    if (selectedLineId) {
      const filtered = areas.filter((area) => area.lineId === selectedLineId);
      setFilteredAreas(filtered);
      setSelectedAreaId('');
      setSelectedCustomerId('');
    } else {
      setFilteredAreas([]);
    }
  }, [selectedLineId, areas]);

  // Filter customers when area changes
  useEffect(() => {
    if (selectedAreaId && selectedLineId) {
      const filtered = customers.filter(
        (customer) =>
          customer.lineId === selectedLineId &&
          customer.areaId === selectedAreaId &&
          customer.status === 'active'
      );
      setFilteredCustomers(filtered);
      setSelectedCustomerId('');
    } else {
      setFilteredCustomers([]);
    }
  }, [selectedAreaId, selectedLineId, customers]);

  // Calculate interest and total
  useEffect(() => {
    if (principalAmount && interestRate) {
      const principal = parseFloat(principalAmount);
      const rate = parseFloat(interestRate);
      
      if (!isNaN(principal) && !isNaN(rate)) {
        const interest = (principal * rate) / 100;
        const total = principal + interest;
        
        setInterestAmount(interest.toFixed(2));
        setTotalAmount(total.toFixed(2));
        
        // Calculate installment amount
        if (numberOfInstallments) {
          const installments = parseInt(numberOfInstallments);
          if (!isNaN(installments) && installments > 0) {
            const installment = total / installments;
            setInstallmentAmount(installment.toFixed(2));
            
            // Calculate due date based on line type and installments
            if (selectedLine) {
              calculateDueDate(selectedLine.lineType, installments);
            }
          }
        }
      }
    } else {
      setInterestAmount('0');
      setTotalAmount('0');
      setInstallmentAmount('0');
    }
  }, [principalAmount, interestRate, numberOfInstallments, selectedLine]);

  const calculateDueDate = (lineType: string, installments: number) => {
    const start = new Date();
    let daysToAdd = 0;

    switch (lineType) {
      case 'Daily':
        daysToAdd = installments;
        break;
      case 'Weekly':
        daysToAdd = installments * 7;
        break;
      case 'Monthly':
      case 'Monthly(Interest)':
        daysToAdd = installments * 30;
        break;
      default:
        daysToAdd = installments * 30; // Default to monthly
    }

    const due = new Date(start);
    due.setDate(due.getDate() + daysToAdd);
    setDueDate(due.toLocaleDateString());
  };

  const handleSave = () => {
    // Validation
    if (!selectedCustomerId) {
      Alert.alert('Error', 'Please select a customer');
      return;
    }
    if (!principalAmount || parseFloat(principalAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid principal amount');
      return;
    }
    if (!interestRate || parseFloat(interestRate) < 0) {
      Alert.alert('Error', 'Please enter a valid interest rate');
      return;
    }
    if (!numberOfInstallments || parseInt(numberOfInstallments) <= 0) {
      Alert.alert('Error', 'Please enter valid number of installments');
      return;
    }

    const loanData = {
      customerId: selectedCustomerId,
      lineId: selectedLineId,
      areaId: selectedAreaId,
      principalAmount: parseFloat(principalAmount),
      interestRate: parseFloat(interestRate),
      interestAmount: parseFloat(interestAmount),
      totalAmount: parseFloat(totalAmount),
      noOfInstalls: parseInt(numberOfInstallments),
      installmentAmount: parseFloat(installmentAmount),
      startDate: new Date().toISOString().split('T')[0],
      dueDate,
      notes,
      status: 'active',
      paidAmount: 0,
      remainingAmount: parseFloat(totalAmount),
      paidInstallments: 0,
    };

    onSave(loanData);
    resetForm();
  };

  const resetForm = () => {
    setSelectedCustomerId('');
    setSelectedLineId('');
    setSelectedAreaId('');
    setPrincipalAmount('');
    setInterestRate('');
    setNumberOfInstallments('');
    setNotes('');
    setStartDate(new Date().toLocaleDateString());
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      transparent={false}
      presentationStyle="fullScreen"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Add New Loan</Text>
          <TouchableOpacity onPress={handleClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          {/* Line Selection */}
          <View style={styles.field}>
            <Text style={styles.label}>Line *</Text>
            <TouchableOpacity
              style={styles.picker}
              onPress={() => setShowLinePicker(true)}
            >
              <Text style={[styles.pickerText, !selectedLine && styles.placeholder]}>
                {selectedLine ? selectedLine.lineName : 'Select Line'}
              </Text>
              <Text style={styles.dropdownIcon}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* Area Selection */}
          <View style={styles.field}>
            <Text style={styles.label}>Area *</Text>
            <TouchableOpacity
              style={[styles.picker, !selectedLineId && styles.disabledPicker]}
              onPress={() => selectedLineId && setShowAreaPicker(true)}
              disabled={!selectedLineId}
            >
              <Text style={[styles.pickerText, !selectedArea && styles.placeholder]}>
                {selectedArea ? selectedArea.name : 'Select Area'}
              </Text>
              <Text style={styles.dropdownIcon}>▼</Text>
            </TouchableOpacity>
            {!selectedLineId && (
              <Text style={styles.hintText}>Select a line first</Text>
            )}
          </View>

          {/* Customer Selection */}
          <View style={styles.field}>
            <Text style={styles.label}>Customer *</Text>
            <TouchableOpacity
              style={[styles.picker, !selectedAreaId && styles.disabledPicker]}
              onPress={() => selectedAreaId && setShowCustomerPicker(true)}
              disabled={!selectedAreaId}
            >
              <Text style={[styles.pickerText, !selectedCustomer && styles.placeholder]}>
                {selectedCustomer ? selectedCustomer.name : 'Select Customer'}
              </Text>
              <Text style={styles.dropdownIcon}>▼</Text>
            </TouchableOpacity>
            {!selectedAreaId && (
              <Text style={styles.hintText}>Select an area first</Text>
            )}
          </View>

          {/* Show customer info */}
          {selectedCustomer && (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                📞 {selectedCustomer.phone} • 📍 {selectedCustomer.address}
              </Text>
            </View>
          )}

          {/* Principal Amount */}
          <View style={styles.field}>
            <Text style={styles.label}>Principal Amount *</Text>
            <TextInput
              style={styles.input}
              value={principalAmount}
              onChangeText={setPrincipalAmount}
              placeholder="Enter principal amount"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
            />
          </View>

          {/* Interest Rate */}
          <View style={styles.field}>
            <Text style={styles.label}>Interest Rate (%) *</Text>
            <TextInput
              style={styles.input}
              value={interestRate}
              onChangeText={setInterestRate}
              placeholder="Enter interest rate"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
            />
          </View>

          {/* Calculated Interest */}
          {parseFloat(interestAmount) > 0 && (
            <View style={styles.calculatedField}>
              <Text style={styles.calculatedLabel}>Interest Amount:</Text>
              <Text style={styles.calculatedValue}>₹ {interestAmount}</Text>
            </View>
          )}

          {/* Total Amount */}
          {parseFloat(totalAmount) > 0 && (
            <View style={styles.calculatedField}>
              <Text style={styles.calculatedLabel}>Total Amount:</Text>
              <Text style={[styles.calculatedValue, styles.totalAmount]}>
                ₹ {totalAmount}
              </Text>
            </View>
          )}

          {/* Number of Installments */}
          <View style={styles.field}>
            <Text style={styles.label}>Number of Installments *</Text>
            <TextInput
              style={styles.input}
              value={numberOfInstallments}
              onChangeText={setNumberOfInstallments}
              placeholder="Enter number of installments"
              placeholderTextColor="#999"
              keyboardType="number-pad"
            />
          </View>

          {/* Installment Amount */}
          {parseFloat(installmentAmount) > 0 && (
            <View style={styles.calculatedField}>
              <Text style={styles.calculatedLabel}>Per Installment:</Text>
              <Text style={styles.calculatedValue}>₹ {installmentAmount}</Text>
            </View>
          )}

          {/* Start Date */}
          <View style={styles.field}>
            <Text style={styles.label}>Start Date</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={startDate}
              editable={false}
            />
          </View>

          {/* Due Date */}
          {dueDate && (
            <View style={styles.field}>
              <Text style={styles.label}>Expected Due Date</Text>
              <TextInput
                style={[styles.input, styles.disabledInput]}
                value={dueDate}
                editable={false}
              />
            </View>
          )}

          {/* Notes */}
          <View style={styles.field}>
            <Text style={styles.label}>Notes (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Add any notes..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Save Button */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>CREATE LOAN</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Line Picker Modal */}
        <Modal visible={showLinePicker} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.pickerModal}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Select Line</Text>
                <TouchableOpacity onPress={() => setShowLinePicker(false)}>
                  <Text style={styles.pickerClose}>✕</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={lines}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.pickerItem}
                    onPress={() => {
                      setSelectedLineId(item.id);
                      setShowLinePicker(false);
                    }}
                  >
                    <Text style={styles.pickerItemText}>{item.lineName}</Text>
                    <Text style={styles.pickerItemSubtext}>{item.lineType}</Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>
        </Modal>

        {/* Area Picker Modal */}
        <Modal visible={showAreaPicker} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.pickerModal}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Select Area</Text>
                <TouchableOpacity onPress={() => setShowAreaPicker(false)}>
                  <Text style={styles.pickerClose}>✕</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={filteredAreas}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.pickerItem}
                    onPress={() => {
                      setSelectedAreaId(item.id);
                      setShowAreaPicker(false);
                    }}
                  >
                    <Text style={styles.pickerItemText}>{item.name}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>No areas in this line</Text>
                }
              />
            </View>
          </View>
        </Modal>

        {/* Customer Picker Modal */}
        <Modal visible={showCustomerPicker} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.pickerModal}>
              <View style={styles.pickerHeader}>
                <Text style={styles.pickerTitle}>Select Customer</Text>
                <TouchableOpacity onPress={() => setShowCustomerPicker(false)}>
                  <Text style={styles.pickerClose}>✕</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={filteredCustomers}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.pickerItem}
                    onPress={() => {
                      setSelectedCustomerId(item.id);
                      setShowCustomerPicker(false);
                    }}
                  >
                    <Text style={styles.pickerItemText}>{item.name}</Text>
                    <Text style={styles.pickerItemSubtext}>📞 {item.phone}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text style={styles.emptyText}>
                    No active customers in this area
                  </Text>
                }
              />
            </View>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  closeButton: {
    fontSize: 28,
    color: '#666',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: 12,
  },
  picker: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  disabledPicker: {
    backgroundColor: '#f5f5f5',
    borderColor: '#e0e0e0',
  },
  pickerText: {
    fontSize: 16,
    color: '#333',
  },
  placeholder: {
    color: '#999',
  },
  dropdownIcon: {
    fontSize: 12,
    color: '#999',
  },
  disabledInput: {
    backgroundColor: '#f5f5f5',
    color: '#666',
  },
  hintText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  infoBox: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  infoText: {
    fontSize: 13,
    color: '#1976D2',
  },
  calculatedField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  calculatedLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#555',
  },
  calculatedValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  totalAmount: {
    fontSize: 18,
    color: '#1565C0',
  },
  saveButton: {
    backgroundColor: '#34C759',
    height: 52,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerModal: {
    width: '85%',
    maxHeight: '70%',
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  pickerClose: {
    fontSize: 24,
    color: '#666',
  },
  pickerItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerItemText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  pickerItemSubtext: {
    fontSize: 13,
    color: '#999',
    marginTop: 4,
  },
  emptyText: {
    padding: 20,
    textAlign: 'center',
    color: '#999',
    fontSize: 14,
  },
});
