/**
 * API Configuration
 * 
 * Centralized configuration for all API services
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// API Base URL - Update this with your backend server URL
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

/**
 * Get authorization headers with JWT token
 */
export const getAuthHeaders = async () => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
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

/**
 * Handle unauthorized access
 */
export const handleUnauthorized = async () => {
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  // You can emit an event or navigate to login here if needed
  console.warn('User unauthorized - tokens cleared');
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
