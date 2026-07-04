/**
 * API Configuration
 * 
 * Centralized configuration for all API services
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// API Base URL - Automatically use localhost for web, network IP for mobile
const getApiBaseUrl = () => {
  if (Platform.OS === 'web') {
    // Use localhost for web browsers
    console.log('[API Config] Using localhost for web platform');
    return 'http://localhost:3000/api';
  }
  // Use network IP for mobile devices (or localhost if not set)
  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';
  console.log('[API Config] Using network IP for mobile platform:', apiUrl);
  return apiUrl;
};

export const API_BASE_URL = getApiBaseUrl();

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

/**
 * Get authorization headers with JWT token
 */
export const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  console.log('[API Config] Getting auth headers, token exists:', !!token);
  if (token) {
    console.log('[API Config] Token preview:', token.substring(0, 20) + '...');
  } else {
    console.warn('[API Config] No authentication token found!');
  }
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

/**
 * Get headers without authentication (for public endpoints)
 */
export const getPublicHeaders = () => {
  return {
    'Content-Type': 'application/json',
  };
};

// Callback invoked when any API call receives a 401 (e.g., expired token)
let _unauthorizedCallback: (() => void) | null = null;

/**
 * Register a callback to be called when the user's session expires.
 * Call this from your AuthContext to hook logout into the API layer.
 */
export const setUnauthorizedCallback = (cb: () => void): void => {
  _unauthorizedCallback = cb;
};

/**
 * Handle unauthorized access
 */
export const handleUnauthorized = async () => {
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  console.warn('User unauthorized - tokens cleared');
  if (_unauthorizedCallback) {
    _unauthorizedCallback();
  }
};

/**
 * Default request timeout (milliseconds)
 */
export const API_TIMEOUT = parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '10000');

/**
 * Retry configuration
 */
export const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // milliseconds
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};
