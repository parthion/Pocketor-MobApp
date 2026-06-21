import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBackPress?: () => void;
  rightAction?: { icon: string; onPress: () => void; };
  subtitle?: string;
  style?: ViewStyle;
  transparent?: boolean;
}

export default function Header({
  title, showBack = false, onBackPress, rightAction, subtitle, style, transparent = false,
}: HeaderProps) {
  const router   = useRouter();
  const insets   = useSafeAreaInsets();

  const handleBackPress = () => {
    if (onBackPress) onBackPress();
    else router.back();
  };

  return (
    <View style={[
      styles.container,
      transparent && styles.transparent,
      { paddingTop: insets.top },
      style,
    ]}>
      <View style={styles.content}>
        {showBack ? (
          <TouchableOpacity style={styles.sideBtn} onPress={handleBackPress}>
            <Text style={[styles.backIcon, transparent && styles.iconLight]}>←</Text>
          </TouchableOpacity>
        ) : <View style={styles.sideBtn} />}

        <View style={styles.titleContainer}>
          <Text style={[styles.title, transparent && styles.titleLight]} numberOfLines={1}>{title}</Text>
          {subtitle && <Text style={[styles.subtitle, transparent && styles.titleLight]} numberOfLines={1}>{subtitle}</Text>}
        </View>

        {rightAction ? (
          <TouchableOpacity style={styles.sideBtn} onPress={rightAction.onPress}>
            <Text style={[styles.actionIcon, transparent && styles.iconLight]}>{rightAction.icon}</Text>
          </TouchableOpacity>
        ) : <View style={styles.sideBtn} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EBEBEB',
  },
  transparent: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: 52,
  },
  sideBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    fontSize: 22,
    color: '#1B4F72',
    fontWeight: '700',
  },
  iconLight: {
    color: '#fff',
  },
  titleContainer: {
    flex: 1,
    marginHorizontal: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B4F72',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  titleLight: {
    color: '#fff',
  },
  subtitle: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 1,
  },
  actionIcon: {
    fontSize: 22,
    color: '#1B4F72',
    fontWeight: '700',
    textAlign: 'center',
  },
});
