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

interface AddAreaModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (areaData: any) => void;
  lines: any[];
}

export default function AddAreaModal({ visible, onClose, onSave, lines }: AddAreaModalProps) {
  const [areaName, setAreaName] = useState('');
  const [selectedLineId, setSelectedLineId] = useState('');
  const [showLinePicker, setShowLinePicker] = useState(false);

  const selectedLine = lines.find(line => line.id === selectedLineId);

  const handleSave = () => {
    if (!areaName.trim()) {
      Alert.alert('Error', 'Please enter Area Name');
      return;
    }

    if (!selectedLineId) {
      Alert.alert('Error', 'Please select a Line');
      return;
    }

    const areaData = {
      name: areaName.trim(),
      lineId: selectedLineId,
    };

    onSave(areaData);
    resetForm();
  };

  const resetForm = () => {
    setAreaName('');
    setSelectedLineId('');
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
          <Text style={styles.headerTitle}>Add Area</Text>
          <TouchableOpacity onPress={handleCancel}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Area Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Area Name *</Text>
            <TextInput
              style={styles.input}
              value={areaName}
              onChangeText={setAreaName}
              placeholder="Enter area name"
              placeholderTextColor="#999"
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

          {selectedLine && (
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Line Type:</Text>
              <Text style={styles.infoValue}>{selectedLine.lineType}</Text>
            </View>
          )}

          {/* Save Button */}
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>SAVE</Text>
          </TouchableOpacity>
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
                    <Text style={styles.emptySubtext}>Please create a line first</Text>
                  </View>
                }
              />
              <View style={styles.pickerButtons}>
                <TouchableOpacity
                  style={styles.pickerCancelButton}
                  onPress={() => setShowLinePicker(false)}
                >
                  <Text style={styles.pickerCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.pickerOkButton}
                  onPress={() => setShowLinePicker(false)}
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
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: 14,
    color: '#0066CC',
    fontWeight: '600',
    marginRight: 8,
  },
  infoValue: {
    fontSize: 14,
    color: '#0066CC',
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
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
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
