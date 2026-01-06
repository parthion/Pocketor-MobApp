import { useCollections } from '@/context/CollectionsContext';
import { FrequencyType, InterestType } from '@/types';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const FREQUENCIES: FrequencyType[] = ['weekly', 'monthly', 'custom'];
const INTEREST_TYPES: InterestType[] = ['simple', 'compound'];

export default function CreateCollectionScreen() {
  const router = useRouter();
  const { addCollection } = useCollections();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [frequency, setFrequency] = useState<FrequencyType>('monthly');
  const [interestType, setInterestType] = useState<InterestType>('simple');
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Collection name is required');
      return;
    }

    if (!totalAmount.trim() || isNaN(Number(totalAmount)) || Number(totalAmount) <= 0) {
      Alert.alert('Error', 'Please enter a valid total amount (greater than 0)');
      return;
    }

    if (!interestRate.trim() || isNaN(Number(interestRate))) {
      Alert.alert('Error', 'Please enter a valid interest rate');
      return;
    }

    setIsCreating(true);
    try {
      const result = await addCollection({
        name: name.trim(),
        description: description.trim() || undefined,
        totalAmount: Number(totalAmount),
        interestRate: Number(interestRate),
        interestType,
        frequency,
        members: [],
        contributions: [],
        createdDate: new Date().toISOString().split('T')[0],
        status: 'active',
      });

      if (result.success) {
        Alert.alert('Success', 'Collection created successfully!', [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]);
      } else {
        Alert.alert('Error', result.message || 'Failed to create collection');
      }
    } catch (error) {
      console.error('Error creating collection:', error);
      Alert.alert('Error', 'Failed to create collection');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        <Text style={styles.title}>Create New Collection</Text>

        <View style={styles.section}>
          <Text style={styles.label}>Collection Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Monthly Savings Club"
            value={name}
            onChangeText={setName}
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Optional description"
            value={description}
            onChangeText={setDescription}
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Total Amount (₹) *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 10000"
            value={totalAmount}
            onChangeText={setTotalAmount}
            placeholderTextColor="#999"
            keyboardType="decimal-pad"
          />
          <Text style={styles.helper}>
            Total target amount for this collection
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Interest Rate (%) *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 5.5"
            value={interestRate}
            onChangeText={setInterestRate}
            placeholderTextColor="#999"
            keyboardType="decimal-pad"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Contribution Frequency *</Text>
          <View style={styles.buttonGroup}>
            {FREQUENCIES.map((freq) => (
              <TouchableOpacity
                key={freq}
                style={[
                  styles.frequencyButton,
                  frequency === freq && styles.frequencyButtonActive,
                ]}
                onPress={() => setFrequency(freq)}
              >
                <Text
                  style={[
                    styles.frequencyButtonText,
                    frequency === freq && styles.frequencyButtonTextActive,
                  ]}
                >
                  {freq.charAt(0).toUpperCase() + freq.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Interest Type *</Text>
          <View style={styles.buttonGroup}>
            {INTEREST_TYPES.map((type) => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.interestButton,
                  interestType === type && styles.interestButtonActive,
                ]}
                onPress={() => setInterestType(type)}
              >
                <Text
                  style={[
                    styles.interestButtonText,
                    interestType === type && styles.interestButtonTextActive,
                  ]}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.helper}>
            {interestType === 'simple'
              ? 'Simple interest is calculated on principal only'
              : 'Compound interest is calculated on principal + previous interest'}
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.createButton, isCreating && styles.createButtonDisabled]} 
          onPress={handleCreate}
          disabled={isCreating}
        >
          <Text style={styles.createButtonText}>
            {isCreating ? 'Creating...' : 'Create Collection'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#333',
  },
  section: {
    marginBottom: 25,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  textArea: {
    paddingVertical: 12,
    textAlignVertical: 'top',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  frequencyButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  frequencyButtonActive: {
    borderColor: '#007AFF',
    backgroundColor: '#E8F4FF',
  },
  frequencyButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  frequencyButtonTextActive: {
    color: '#007AFF',
  },
  interestButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  interestButtonActive: {
    borderColor: '#34C759',
    backgroundColor: '#E8F9F0',
  },
  interestButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  interestButtonTextActive: {
    color: '#34C759',
  },
  helper: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  createButtonDisabled: {
    backgroundColor: '#999',
    opacity: 0.6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
