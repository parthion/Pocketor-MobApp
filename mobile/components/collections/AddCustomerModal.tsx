import React, { useState } from 'react';
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

interface AddCustomerModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (customerData: any) => void;
  lines: any[];
  areas: any[];
}

export default function AddCustomerModal({
  visible,
  onClose,
  onSave,
  lines,
  areas,
}: AddCustomerModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [selectedLineId, setSelectedLineId] = useState('');
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [showLinePicker, setShowLinePicker] = useState(false);
  const [showAreaPicker, setShowAreaPicker] = useState(false);

  const selectedLine = lines.find((line) => line.id === selectedLineId);
  const selectedArea = areas.find((area) => area.id === selectedAreaId);
  const filteredAreas = selectedLineId
    ? areas.filter((area) => area.lineId === selectedLineId)
    : areas;

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter Customer Name');
      return;
    }

    if (!phone.trim()) {
      Alert.alert('Error', 'Please enter Phone Number');
      return;
    }

    if (phone.length !== 10) {
      Alert.alert('Error', 'Phone number must be 10 digits');
      return;
    }

    if (!address.trim()) {
      Alert.alert('Error', 'Please enter Address');
      return;
    }

    if (!selectedLineId) {
      Alert.alert('Error', 'Please select a Line');
      return;
    }

    if (!selectedAreaId) {
      Alert.alert('Error', 'Please select an Area');
      return;
    }

    const customerData = {
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim(),
      lineId: selectedLineId,
      areaId: selectedAreaId,
      status: 'active',
    };

    onSave(customerData);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setPhone('');
    setAddress('');
    setSelectedLineId('');
    setSelectedAreaId('');
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
          <Text style={styles.headerTitle}>Add Customer</Text>
          <TouchableOpacity onPress={handleCancel}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Customer Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Customer Name *</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter customer name"
              placeholderTextColor="#999"
              autoCapitalize="words"
            />
          </View>

          {/* Phone Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number *</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={(text) => {
                const cleaned = text.replace(/[^0-9]/g, '');
                setPhone(cleaned);
              }}
              placeholder="Enter 10-digit phone number"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              maxLength={10}
            />
          </View>

          {/* Address */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address *</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={address}
              onChangeText={setAddress}
              placeholder="Enter address"
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Line Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Select Line *</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowLinePicker(true)}
            >
              <Text style={[styles.pickerButtonText, !selectedLine && styles.placeholder]}>
                {selectedLine ? selectedLine.lineName : 'Select a line'}
              </Text>
              <Text style={styles.pickerIcon}>▼</Text>
            </TouchableOpacity>
          </View>

          {/* Area Selection */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Select Area *</Text>
            <TouchableOpacity
              style={[styles.pickerButton, !selectedLineId && styles.pickerDisabled]}
              onPress={() => selectedLineId && setShowAreaPicker(true)}
              disabled={!selectedLineId}
            >
              <Text style={[styles.pickerButtonText, !selectedArea && styles.placeholder]}>
                {selectedArea ? selectedArea.name : selectedLineId ? 'Select an area' : 'Select line first'}
              </Text>
              <Text style={styles.pickerIcon}>▼</Text>
            </TouchableOpacity>
          </View>

          {selectedLine && selectedArea && (
            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                📍 {selectedArea.name} - {selectedLine.lineName} ({selectedLine.lineType})
              </Text>
            </View>
          )}

          {/* Save Button */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>SAVE CUSTOMER</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>

        {/* Line Picker Modal */}
        <Modal
          visible={showLinePicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowLinePicker(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowLinePicker(false)}
          >
            <View style={styles.pickerModal}>
              <Text style={styles.pickerTitle}>Select Line</Text>
              <FlatList
                data={lines}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.pickerOption}
                    onPress={() => {
                      setSelectedLineId(item.id);
                      setSelectedAreaId(''); // Reset area when line changes
                      setShowLinePicker(false);
                    }}
                  >
                    <Text style={styles.pickerOptionText}>{item.lineName}</Text>
                    <Text style={styles.pickerOptionSubtext}>{item.lineType}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyList}>
                    <Text style={styles.emptyText}>No lines available</Text>
                  </View>
                }
              />
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowLinePicker(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Area Picker Modal */}
        <Modal
          visible={showAreaPicker}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAreaPicker(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowAreaPicker(false)}
          >
            <View style={styles.pickerModal}>
              <Text style={styles.pickerTitle}>Select Area</Text>
              <FlatList
                data={filteredAreas}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.pickerOption}
                    onPress={() => {
                      setSelectedAreaId(item.id);
                      setShowAreaPicker(false);
                    }}
                  >
                    <Text style={styles.pickerOptionText}>{item.name}</Text>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <View style={styles.emptyList}>
                    <Text style={styles.emptyText}>No areas available for this line</Text>
                  </View>
                }
              />
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowAreaPicker(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
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
  },
  cancelButton: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
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
    fontWeight: '600',
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
  textArea: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
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
  pickerDisabled: {
    backgroundColor: '#f5f5f5',
  },
  pickerButtonText: {
    fontSize: 16,
    color: '#333',
  },
  placeholder: {
    color: '#999',
  },
  pickerIcon: {
    fontSize: 12,
    color: '#666',
  },
  infoBox: {
    backgroundColor: '#E8F4FF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#0066CC',
  },
  saveButton: {
    height: 50,
    backgroundColor: '#34C759',
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
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  pickerOptionText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  pickerOptionSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  emptyList: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
  },
  closeButton: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
});
