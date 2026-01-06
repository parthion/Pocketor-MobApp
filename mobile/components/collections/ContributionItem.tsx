import { Contribution as BaseContribution } from '@/types';
import { formatCurrency } from '@/utils/calculations';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Card from '../common/Card';

// Extended type for contribution display
interface DisplayContribution extends BaseContribution {
  memberName?: string;
  contributionType?: 'regular' | 'interest' | 'penalty';
  description?: string;
}

interface ContributionItemProps {
  contribution: DisplayContribution;
  onPress?: () => void;
}

export default function ContributionItem({
  contribution,
  onPress,
}: ContributionItemProps) {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'regular':
        return '💰';
      case 'interest':
        return '📈';
      case 'penalty':
        return '⚠️';
      default:
        return '💵';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'regular':
        return '#34C759';
      case 'interest':
        return '#007AFF';
      case 'penalty':
        return '#FF9500';
      default:
        return '#666';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'regular':
        return 'Regular';
      case 'interest':
        return 'Interest';
      case 'penalty':
        return 'Penalty';
      default:
        return type;
    }
  };

  return (
    <Card onPress={onPress} style={styles.card} variant="outlined">
      <View style={styles.container}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>{getTypeIcon(contribution.contributionType || 'regular')}</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.memberName} numberOfLines={1}>
              {contribution.memberName || 'Unknown'}
            </Text>
            <Text style={[styles.amount, { color: getTypeColor(contribution.contributionType || 'regular') }]}>
              {formatCurrency(contribution.amount)}
            </Text>
          </View>

          <View style={styles.metadata}>
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: `${getTypeColor(contribution.contributionType || 'regular')}15` },
              ]}
            >
              <Text style={[styles.typeText, { color: getTypeColor(contribution.contributionType || 'regular') }]}>
                {getTypeLabel(contribution.contributionType || 'regular')}
              </Text>
            </View>

            <Text style={styles.date}>
              {new Date(contribution.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>

          {contribution.description && (
            <Text style={styles.description} numberOfLines={2}>
              {contribution.description}
            </Text>
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
    padding: 12,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
    flex: 1,
    marginRight: 8,
  },
  amount: {
    fontSize: 16,
    fontWeight: '700',
  },
  metadata: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  description: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    marginTop: 4,
  },
});
