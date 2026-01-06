import { Collection } from '@/types';
import { formatCurrency } from '@/utils/calculations';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Card from '../common/Card';

interface CollectionCardProps {
  collection: Collection;
  onPress?: () => void;
}

export default function CollectionCard({ collection, onPress }: CollectionCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#34C759';
      case 'completed':
        return '#007AFF';
      case 'paused':
        return '#FF9500';
      default:
        return '#999';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return '🟢';
      case 'completed':
        return '✅';
      case 'paused':
        return '⏸️';
      default:
        return '⚪';
    }
  };

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleContainer}>
          <Text style={styles.name} numberOfLines={1}>
            {collection.name}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(collection.status)}20` }]}>
            <Text style={styles.statusIcon}>{getStatusIcon(collection.status)}</Text>
            <Text style={[styles.statusText, { color: getStatusColor(collection.status) }]}>
              {collection.status.charAt(0).toUpperCase() + collection.status.slice(1)}
            </Text>
          </View>
        </View>
      </View>

      {collection.description && (
        <Text style={styles.description} numberOfLines={2}>
          {collection.description}
        </Text>
      )}

      <View style={styles.divider} />

      <View style={styles.details}>
        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Total Amount</Text>
          <Text style={styles.detailValue}>{formatCurrency(collection.totalAmount)}</Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Interest Rate</Text>
          <Text style={styles.detailValue}>{collection.interestRate}%</Text>
        </View>

        <View style={styles.detailItem}>
          <Text style={styles.detailLabel}>Frequency</Text>
          <Text style={styles.detailValue}>{collection.frequency}</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.date}>
          Created: {new Date(collection.createdDate).toLocaleDateString()}
        </Text>
        {onPress && (
          <TouchableOpacity onPress={onPress}>
            <Text style={styles.viewDetails}>View Details →</Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  header: {
    marginBottom: 12,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusIcon: {
    fontSize: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E5EA',
    marginVertical: 12,
  },
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  viewDetails: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
});
