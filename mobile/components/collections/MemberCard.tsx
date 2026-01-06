import { formatCurrency } from '@/utils/calculations';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Card from '../common/Card';

export interface Member {
  id: string;
  collectionId: string;
  userId?: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'admin' | 'member';
  joinedDate: string;
  totalContributions?: number;
}

interface MemberCardProps {
  member: Member;
  onPress?: () => void;
  onRemove?: () => void;
  showActions?: boolean;
}

export default function MemberCard({
  member,
  onPress,
  onRemove,
  showActions = false,
}: MemberCardProps) {
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const getRoleColor = (role: string) => {
    return role === 'admin' ? '#FF9500' : '#007AFF';
  };

  return (
    <Card onPress={onPress} style={styles.card}>
      <View style={styles.container}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(member.name)}</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.name} numberOfLines={1}>
              {member.name}
            </Text>
            <View style={[styles.roleBadge, { backgroundColor: `${getRoleColor(member.role || 'member')}20` }]}>
              <Text style={[styles.roleText, { color: getRoleColor(member.role || 'member') }]}>
                {member.role === 'admin' ? '👑 Admin' : '👤 Member'}
              </Text>
            </View>
          </View>

          <View style={styles.details}>
            {member.email && (
              <Text style={styles.detailText} numberOfLines={1}>
                📧 {member.email}
              </Text>
            )}
            {member.phone && (
              <Text style={styles.detailText} numberOfLines={1}>
                📱 {member.phone}
              </Text>
            )}
          </View>

          {member.totalContributions !== undefined && (
            <View style={styles.contribution}>
              <Text style={styles.contributionLabel}>Total Contributions:</Text>
              <Text style={styles.contributionValue}>
                {formatCurrency(member.totalContributions)}
              </Text>
            </View>
          )}

          <Text style={styles.joinedDate}>
            Joined: {new Date(member.joinedDate).toLocaleDateString()}
          </Text>
        </View>
      </View>

      {showActions && onRemove && member.role !== 'admin' && (
        <TouchableOpacity
          style={styles.removeButton}
          onPress={onRemove}
        >
          <Text style={styles.removeText}>Remove</Text>
        </TouchableOpacity>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    padding: 12,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    flex: 1,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
  },
  details: {
    marginBottom: 6,
  },
  detailText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  contribution: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  contributionLabel: {
    fontSize: 13,
    color: '#666',
    marginRight: 6,
  },
  contributionValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#34C759',
  },
  joinedDate: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  removeButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#FFF5F5',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    alignSelf: 'flex-start',
  },
  removeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#DC2626',
  },
});
