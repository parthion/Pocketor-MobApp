import { DayOfWeek, LineType } from '@/types/collection.types';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

interface AddLineModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (lineData: any) => void;
  initialData?: any;
}

const LINE_TYPES: LineType[] = [
  'Daily',
  'Weekly',
  'Monthly',
  'Monthly(Interest)',
  'Enterprise',
  'Auto Finance',
  'Gold Loan',
];

const DAYS_OF_WEEK: DayOfWeek[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];

export default function AddLineModal({ visible, onClose, onSave, initialData }: AddLineModalProps) {
  const [lineName, setLineName] = useState('');
  const [lineType, setLineType] = useState<LineType>('Daily');
  const [day, setDay] = useState<DayOfWeek>('Monday');
  const [interestPerHundred, setInterestPerHundred] = useState('');
  const [billAmountPerHundred, setBillAmountPerHundred] = useState('');
  const [noOfInstall, setNoOfInstall] = useState('');
  const [badLoanDays, setBadLoanDays] = useState('');
  const [closeLoanManually, setCloseLoanManually] = useState(false);
  const [enablePenalty, setEnablePenalty] = useState(false);
  const [keepPaidCustomer, setKeepPaidCustomer] = useState(false);
  const [showLineTypePicker, setShowLineTypePicker] = useState(false);
  const [showDayPicker, setShowDayPicker] = useState(false);

  const isEditMode = !!initialData;

  useEffect(() => {
    if (visible && initialData) {
      setLineName(initialData.lineName || '');
      setLineType(initialData.lineType || 'Daily');
      setDay(initialData.day || 'Monday');
      setInterestPerHundred(String(initialData.interestPerHundred ?? ''));
      setBillAmountPerHundred(String(initialData.billAmountPerHundred ?? ''));
      setNoOfInstall(String(initialData.noOfInstalls ?? ''));
      setBadLoanDays(String(initialData.badLoanDays ?? ''));
      setCloseLoanManually(!!initialData.closeLoanManually);
      setEnablePenalty(!!initialData.enablePenalty);
      setKeepPaidCustomer(!!initialData.keepPaidCustomerInCompletedTab);
    } else if (visible && !initialData) {
      resetForm();
    }
  }, [visible, initialData]);

  const handleSave = () => {
    // Validation
    if (!lineName.trim()) {
      Alert.alert('Error', 'Please enter Line Name');
      return;
    }

    if (!interestPerHundred || parseFloat(interestPerHundred) < 0) {
      Alert.alert('Error', 'Please enter valid Interest Per Hundred');
      return;
    }

    if (!billAmountPerHundred || parseFloat(billAmountPerHundred) < 0) {
      Alert.alert('Error', 'Please enter valid Bill Amount Per Hundred');
      return;
    }

    if (!noOfInstall || parseInt(noOfInstall) < 1) {
      Alert.alert('Error', 'Please enter valid No Of Install');
      return;
    }

    if (!badLoanDays || parseInt(badLoanDays) < 0) {
      Alert.alert('Error', 'Please enter valid Bad Loan Days');
      return;
    }

    const lineData = {
      lineName: lineName.trim(),
      lineType,
      day: lineType === 'Weekly' ? day : undefined,
      interestPerHundred: parseFloat(interestPerHundred),
      billAmountPerHundred: parseFloat(billAmountPerHundred),
      noOfInstalls: parseInt(noOfInstall),
      badLoanDays: parseInt(badLoanDays),
      closeLoanManually,
      enablePenalty,
      keepPaidCustomerInCompletedTab: keepPaidCustomer,
    };

    onSave(lineData);
    resetForm();
  };

  const resetForm = () => {
    setLineName('');
    setLineType('Daily');
    setDay('Monday');
    setInterestPerHundred('');
    setBillAmountPerHundred('');
    setNoOfInstall('');
    setBadLoanDays('');
    setCloseLoanManually(false);
    setEnablePenalty(false);
    setKeepPaidCustomer(false);
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      onRequestClose={onClose}
      presentationStyle="fullScreen"
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{isEditMode ? 'Edit Line' : 'Add Line'}</Text>
          <TouchableOpacity onPress={handleCancel}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Line Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Line Name</Text>
            <TextInput
              style={styles.input}
              value={lineName}
              onChangeText={setLineName}
              placeholder="Enter line name"
              placeholderTextColor="#999"
            />
          </View>

          {/* Line Type */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Line Type</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowLineTypePicker(true)}
            >
              <Text style={styles.pickerButtonText}>{lineType}</Text>
              <Text style={styles.pickerIcon}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* Day - Only show for Weekly type */}
          {lineType === 'Weekly' && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Day</Text>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => setShowDayPicker(true)}
              >
                <Text style={styles.pickerButtonText}>{day}</Text>
                <Text style={styles.pickerIcon}>▼</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Interest Per Hundred */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Interest Per Hundred</Text>
            <TextInput
              style={styles.input}
              value={interestPerHundred}
              onChangeText={setInterestPerHundred}
              placeholder="0.00"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
            />
          </View>

          {/* Bill Amount Per Hundred */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bill Amount Per Hundred</Text>
            <TextInput
              style={styles.input}
              value={billAmountPerHundred}
              onChangeText={setBillAmountPerHundred}
              placeholder="0.00"
              placeholderTextColor="#999"
              keyboardType="decimal-pad"
            />
          </View>

          {/* No Of Install */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>No Of Install</Text>
            <TextInput
              style={styles.input}
              value={noOfInstall}
              onChangeText={setNoOfInstall}
              placeholder="0"
              placeholderTextColor="#999"
              keyboardType="number-pad"
            />
          </View>

          {/* Bad Loan Days */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Bad Loan Days</Text>
            <TextInput
              style={styles.input}
              value={badLoanDays}
              onChangeText={setBadLoanDays}
              placeholder="0"
              placeholderTextColor="#999"
              keyboardType="number-pad"
            />
          </View>

          {/* Close Loan Manually */}
          <View style={styles.switchGroup}>
            <Text style={styles.label}>Close Loan Manually</Text>
            <Switch
              value={closeLoanManually}
              onValueChange={setCloseLoanManually}
              trackColor={{ false: '#ddd', true: '#007AFF' }}
              thumbColor="#fff"
            />
          </View>

          {/* Enable Penalty */}
          <View style={styles.switchGroup}>
            <Text style={styles.label}>Enable Penalty</Text>
            <Switch
              value={enablePenalty}
              onValueChange={setEnablePenalty}
              trackColor={{ false: '#ddd', true: '#007AFF' }}
              thumbColor="#fff"
            />
          </View>

          {/* Keep Paid Customer in Completed Tab */}
          <View style={styles.switchGroup}>
            <Text style={styles.label}>Keep Paid Customer in Completed Tab?</Text>
            <Switch
              value={keepPaidCustomer}
              onValueChange={setKeepPaidCustomer}
              trackColor={{ false: '#ddd', true: '#007AFF' }}
              thumbColor="#fff"
            />
          </View>

          {/* UPI QR Code - Expandable (placeholder for now) */}
          <TouchableOpacity style={styles.expandableSection}>
            <Text style={styles.label}>UPI QR Code</Text>
            <Text style={styles.expandIcon}>○</Text>
          </TouchableOpacity>

          {/* Save Button */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>{isEditMode ? 'UPDATE' : 'SAVE'}</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Line Type Picker Modal */}
        <Modal
          visible={showLineTypePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowLineTypePicker(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowLineTypePicker(false)}
          >
            <View style={styles.pickerModal}>
              <Text style={styles.pickerTitle}>Line Type</Text>
              <ScrollView>
                {LINE_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={styles.pickerOption}
                    onPress={() => {
                      setLineType(type);
                      setShowLineTypePicker(false);
                    }}
                  >
                    <Text style={styles.pickerOptionText}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={styles.pickerButtons}>
                <TouchableOpacity
                  style={styles.pickerCancelButton}
                  onPress={() => setShowLineTypePicker(false)}
                >
                  <Text style={styles.pickerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.pickerOkButton}
                  onPress={() => setShowLineTypePicker(false)}
                >
                  <Text style={styles.pickerOkText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Day Picker Modal */}
        <Modal
          visible={showDayPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowDayPicker(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowDayPicker(false)}
          >
            <View style={styles.pickerModal}>
              <Text style={styles.pickerTitle}>Day</Text>
              <ScrollView>
                {DAYS_OF_WEEK.map((dayOption) => (
                  <TouchableOpacity
                    key={dayOption}
                    style={styles.pickerOption}
                    onPress={() => {
                      setDay(dayOption);
                      setShowDayPicker(false);
                    }}
                  >
                    <Text style={styles.pickerOptionText}>{dayOption}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <View style={styles.pickerButtons}>
                <TouchableOpacity
                  style={styles.pickerCancelButton}
                  onPress={() => setShowDayPicker(false)}
                >
                  <Text style={styles.pickerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.pickerOkButton}
                  onPress={() => setShowDayPicker(false)}
                >
                  <Text style={styles.pickerOkText}>OK</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </Modal>
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
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    flex: 1,
  },
  cancelButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    paddingLeft: 10,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  pickerButton: {
    height: 48,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#333',
  },
  pickerIcon: {
    fontSize: 12,
    color: '#666',
  },
  switchGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginBottom: 8,
  },
  expandableSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginBottom: 20,
  },
  expandIcon: {
    fontSize: 20,
    color: '#666',
  },
  saveButton: {
    height: 50,
    backgroundColor: '#5DADE2',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
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
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '80%',
    maxHeight: '60%',
    overflow: 'hidden',
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  pickerOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#333',
  },
  pickerButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  pickerCancelButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: '#ddd',
  },
  pickerCancelText: {
    fontSize: 16,
    color: '#007AFF',
  },
  pickerOkButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
  },
  pickerOkText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
});
