import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';

interface ErrorMessageProps {
  message: string;
  title?: string;
  onRetry?: () => void;
  type?: 'error' | 'warning' | 'info';
  style?: ViewStyle;
}

export default function ErrorMessage({
  message,
  title,
  onRetry,
  type = 'error',
  style,
}: ErrorMessageProps) {
  const getIcon = () => {
    switch (type) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '❌';
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'error':
        return '#FFF5F5';
      case 'warning':
        return '#FFFBEB';
      case 'info':
        return '#EFF6FF';
      default:
        return '#FFF5F5';
    }
  };

  const getBorderColor = () => {
    switch (type) {
      case 'error':
        return '#FEE2E2';
      case 'warning':
        return '#FEF3C7';
      case 'info':
        return '#DBEAFE';
      default:
        return '#FEE2E2';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'error':
        return '#DC2626';
      case 'warning':
        return '#D97706';
      case 'info':
        return '#2563EB';
      default:
        return '#DC2626';
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
        },
        style,
      ]}
    >
      <View style={styles.content}>
        <Text style={styles.icon}>{getIcon()}</Text>
        <View style={styles.textContainer}>
          {title && (
            <Text style={[styles.title, { color: getTextColor() }]}>
              {title}
            </Text>
          )}
          <Text style={[styles.message, { color: getTextColor() }]}>
            {message}
          </Text>
        </View>
      </View>
      
      {onRetry && (
        <TouchableOpacity
          style={[styles.retryButton, { borderColor: getTextColor() }]}
          onPress={onRetry}
        >
          <Text style={[styles.retryText, { color: getTextColor() }]}>
            Retry
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginVertical: 8,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  icon: {
    fontSize: 20,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  retryButton: {
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    alignSelf: 'flex-start',
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
