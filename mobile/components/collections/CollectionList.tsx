import { Collection } from '@/types';
import React from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import ErrorMessage from '../common/ErrorMessage';
import Loading from '../common/Loading';
import CollectionCard from './CollectionCard';

interface CollectionListProps {
  collections: Collection[];
  onCollectionPress?: (collection: Collection) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
}

export default function CollectionList({
  collections,
  onCollectionPress,
  onRefresh,
  refreshing = false,
  loading = false,
  error,
  emptyMessage = 'No collections found',
}: CollectionListProps) {
  if (loading && collections.length === 0) {
    return <Loading text="Loading collections..." fullScreen />;
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <ErrorMessage
          message={error}
          title="Error Loading Collections"
          onRetry={onRefresh}
        />
      </View>
    );
  }

  if (collections.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📊</Text>
        <Text style={styles.emptyTitle}>No Collections Yet</Text>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={collections}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <CollectionCard
          collection={item}
          onPress={() => onCollectionPress?.(item)}
        />
      )}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#007AFF"
          />
        ) : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
});
