import AddAreaModal from '@/components/collections/AddAreaModal';
import AddLineModal from '@/components/collections/AddLineModal';
import Header from '@/components/layout/Header';
import { useLoanCollection } from '@/context/LoanCollectionContext';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    Alert,
    FlatList,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

export default function CollectionScreen() {
  const router = useRouter();
  const { lines, addLine, areas, addArea, refreshLines, refreshAreas } = useLoanCollection();
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedLineId, setSelectedLineId] = useState('');
  const [selectedAreaId, setSelectedAreaId] = useState('');
  const [showAddLineModal, setShowAddLineModal] = useState(false);
  const [showAddAreaModal, setShowAddAreaModal] = useState(false);
  const [showLinePicker, setShowLinePicker] = useState(false);
  const [showAreaPicker, setShowAreaPicker] = useState(false);

  const selectedLine = lines.find(l => l.id === selectedLineId);
  const selectedArea = areas.find(a => a.id === selectedAreaId);
  const filteredAreas = selectedLineId 
    ? areas.filter(a => a.lineId === selectedLineId) 
    : [];

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleAddLine = () => {
    setShowAddLineModal(true);
  };

  const handleSaveLine = async (lineData: any) => {
    try {
      await addLine(lineData);
      setShowAddLineModal(false);
      Alert.alert('Success', 'Line created successfully!');
    } catch (error) {
      console.error('Error saving line:', error);
      Alert.alert('Error', 'Failed to create line. Please try again.');
    }
  };

  const handleSaveArea = async (areaData: any) => {
    try {
      await addArea(areaData);
      setShowAddAreaModal(false);
      Alert.alert('Success', 'Area created successfully!');
    } catch (error) {
      console.error('Error saving area:', error);
      Alert.alert('Error', 'Failed to create area. Please try again.');
    }
  };

  const handleSearchArea = () => {
    if (lines.length === 0) {
      Alert.alert('No Lines', 'Please create a line first');
      return;
    }
    setShowAddAreaModal(true);
  };

  const handleSubmit = () => {
    if (!selectedLineId) {
      Alert.alert('Error', 'Please select a Line');
      return;
    }
    
    if (!selectedAreaId) {
      Alert.alert('Error', 'Please select an Area');
      return;
    }

    const formattedDate = date.toLocaleDateString('en-GB');
    Alert.alert('Success', `Collection submitted for ${formattedDate}\nLine: ${selectedLine?.lineName}\nArea: ${selectedArea?.name}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <Header 
        title="Collection" 
        showBack={true}
        onBackPress={() => router.replace('/')}
        rightAction={{
          icon: '🔔',
          onPress: () => Alert.alert('Notifications', 'No new notifications')
        }}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Date Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Date</Text>
            <TouchableOpacity 
              style={styles.calendarIcon}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.icon}>📅</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.dateText}>{date.toLocaleDateString('en-GB')}</Text>
        </View>

        {/* Line Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Line ({lines.length})</Text>
            <View style={styles.lineActions}>
              <TouchableOpacity 
                style={styles.dropdownIcon}
                onPress={() => setShowLinePicker(true)}
              >
                <Text style={styles.icon}>▼</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addButton} onPress={handleAddLine}>
                <Text style={styles.addButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          {selectedLine ? (
            <Text style={styles.selectedText}>{selectedLine.lineName}</Text>
          ) : (
            <Text style={styles.placeholderText}>Select a line</Text>
          )}
        </View>

        {/* Area Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>Area</Text>
            <View style={styles.lineActions}>
              <TouchableOpacity 
                style={styles.dropdownIcon}
                onPress={() => {
                  if (!selectedLineId) {
                    Alert.alert('Select Line', 'Please select a line first');
                    return;
                  }
                  setShowAreaPicker(true);
                }}
              >
                <Text style={styles.icon}>▼</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.addButton} onPress={handleSearchArea}>
                <Text style={styles.addButtonText}>+</Text>
              </TouchableOpacity>
            </View>
          </View>
          {selectedArea ? (
            <Text style={styles.selectedText}>{selectedArea.name}</Text>
          ) : (
            <Text style={styles.placeholderText}>Select an area</Text>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>SUBMIT</Text>
        </TouchableOpacity>

        {/* Debug: Show Lines */}
        {lines.length > 0 && (
          <View style={styles.debugSection}>
            <Text style={styles.debugTitle}>Created Lines ({lines.length})</Text>
            {lines.map((line) => (
              <TouchableOpacity
                key={line.id}
                style={styles.lineItem}
                onPress={() => setSelectedLineId(line.id)}
              >
                <Text style={styles.lineItemName}>{line.lineName}</Text>
                <Text style={styles.lineItemType}>{line.lineType}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
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
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => router.push('/(tabs)/loans')}
        >
          <Text style={styles.navIcon}>�</Text>
          <Text style={styles.navLabel}>Loans</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Text style={styles.navIcon}>📊</Text>
          <Text style={styles.navLabel}>Reports</Text>
        </TouchableOpacity>
      </View>

      {/* Add Line Modal */}
      <AddLineModal
        visible={showAddLineModal}
        onClose={() => setShowAddLineModal(false)}
        onSave={handleSaveLine}
      />

      {/* Add Area Modal */}
      <AddAreaModal
        visible={showAddAreaModal}
        onClose={() => setShowAddAreaModal(false)}
        onSave={handleSaveArea}
        lines={lines}
      />

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

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
                    setSelectedAreaId(''); // Reset area when line changes
                    setShowLinePicker(false);
                  }}
                >
                  <Text style={styles.pickerItemText}>{item.lineName}</Text>
                  <Text style={styles.pickerItemSubtext}>{item.lineType}</Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No lines created yet</Text>
              }
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
                <Text style={styles.emptyText}>
                  {selectedLineId 
                    ? 'No areas in this line. Use the search icon to add one.' 
                    : 'Please select a line first'}
                </Text>
              }
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  icon: {
    fontSize: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  calendarIcon: {
    padding: 4,
  },
  lineActions: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  dropdownIcon: {
    padding: 4,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchButton: {
    padding: 4,
  },
  searchIcon: {
    fontSize: 20,
  },
  dateText: {
    fontSize: 20,
    color: '#000',
    fontWeight: '500',
  },
  selectedText: {
    fontSize: 18,
    color: '#000',
  },
  placeholderText: {
    fontSize: 18,
    color: '#999',
  },
  submitButton: {
    height: 50,
    backgroundColor: '#5DADE2',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  debugSection: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
  },
  lineItem: {
    padding: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  lineItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 4,
  },
  lineItemType: {
    fontSize: 14,
    color: '#666',
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
