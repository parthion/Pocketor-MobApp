/**
 * Authentication Service
 * 
 * Handles all authentication-related API calls:
 * - User registration
 * - User login (email & phone)
 * - OTP verification
 * - Password reset
 * - Token management
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, getAuthHeaders, handleUnauthorized } from './config';
import { ApiResponse } from './types';

// Token management
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

/**
 * Helper function to make auth API calls
 */
async function authCall<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = await getAuthHeaders();

    const options: RequestInit = {
      method,
      headers,
      ...(body && { body: JSON.stringify(body) }),
    };

    const response = await fetch(url, options);
    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        await handleUnauthorized();
      }
      throw new Error(data.message || 'Auth API call failed');
    }

    return data;
  } catch (error) {
    console.error(`Auth Error [${method} ${endpoint}]:`, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============= REGISTRATION =============

/**
 * Register a new user with email, password, name, and phone
 */
export const registerUser = async (
  email: string,
  password: string,
  name: string,
  phone: string
) => {
  return authCall<{ userId: string; message: string }>('/auth/register', 'POST', {
    email,
    password,
    passwordConfirm: password, // Add password confirmation
    name,
    phone,
  });
};

/**
 * Check if user is already registered
 */
export const checkUserExists = async (email: string): Promise<boolean> => {
  const response = await authCall<{ exists: boolean }>('/auth/check-user', 'POST', {
    email,
  });
  return response.success && response.data?.exists ? true : false;
};

// ============= LOGIN =============

/**
 * Login user with email
 */
export const loginWithEmail = async (email: string, password: string) => {
  const response = await authCall<{ token: string; user: any }>(
    '/auth/login',
    'POST',
    { email, password, loginType: 'email' }
  );

  if (response.success && response.data) {
    await AsyncStorage.setItem(TOKEN_KEY, response.data.token);
  }

  return response;
};

/**
 * Login user with phone number
 */
export const loginWithPhone = async (phone: string, password: string) => {
  const response = await authCall<{ token: string; user: any }>(
    '/auth/login',
    'POST',
    { phone, password, loginType: 'phone' }
  );

  if (response.success && response.data) {
    await AsyncStorage.setItem(TOKEN_KEY, response.data.token);
  }

  return response;
};

// ============= OTP VERIFICATION =============

/**
 * Send OTP to email or phone
 */
export const sendOTP = async (email?: string, phone?: string) => {
  return authCall<{ otp?: string }>('/auth/send-otp', 'POST', {
    email,
    phone,
  });
};

/**
 * Verify OTP code
 */
export const verifyOTP = async (contact: string, otp: string, type: 'email' | 'phone') => {
  return authCall('/auth/verify-otp', 'POST', {
    contact,
    otp,
    type,
  });
};

// ============= PASSWORD MANAGEMENT =============

/**
 * Request password reset
 */
export const forgotPassword = async (email: string) => {
  return authCall<{ resetToken: string }>('/auth/forgot-password', 'POST', { email });
};

/**
 * Reset password with token
 */
export const resetPassword = async (email: string, token: string, newPassword: string) => {
  return authCall('/auth/reset-password', 'POST', {
    email,
    token,
    newPassword,
  });
};

// ============= SESSION MANAGEMENT =============

/**
 * Get current authenticated user
 */
export const getCurrentUser = async () => {
  return authCall<any>('/auth/me', 'GET');
};

/**
 * Refresh authentication token
 */
export const refreshAuthToken = async () => {
  const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);

  if (!refreshToken) {
    await handleUnauthorized();
    return { success: false, message: 'No refresh token available' };
  }

  const response = await authCall<{ token: string }>('/auth/refresh-token', 'POST', {
    refreshToken,
  });

  if (response.success && response.data) {
    await AsyncStorage.setItem(TOKEN_KEY, response.data.token);
  }

  return response;
};

/**
 * Logout user and clear tokens
 */
export const logoutUser = async () => {
  await authCall('/auth/logout', 'POST');
  await AsyncStorage.removeItem(TOKEN_KEY);
  await AsyncStorage.removeItem(REFRESH_TOKEN_KEY);
  return { success: true, message: 'Logged out successfully' };
};

// ============= TOKEN UTILITIES =============

/**
 * Get stored auth token
 */
export const getAuthToken = async (): Promise<string | null> => {
  return AsyncStorage.getItem(TOKEN_KEY);
};

/**
 * Get stored refresh token
 */
export const getRefreshToken = async (): Promise<string | null> => {
  return AsyncStorage.getItem(REFRESH_TOKEN_KEY);
};

/**
 * Clear all auth tokens
 */
export const clearAuthTokens = async () => {
  await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY]);
};
