import * as AuthService from '@/service/auth.service';
import { setUnauthorizedCallback } from '@/service/config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: 'admin' | 'agent';
  createdBy?: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
}

interface AuthContextType {
  isLoggedIn: boolean;
  isLoading: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; message: string; isRegistered: boolean }>;
  loginWithPhone: (phone: string, password: string) => Promise<{ success: boolean; message: string; isRegistered: boolean }>;
  register: (email: string, password: string, name: string, phone: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  validateEmail: (email: string) => boolean;
  validatePhone: (phone: string) => boolean;
  validatePassword: (password: string) => { valid: boolean; errors: string[] };
  isUserRegistered: (email: string) => Promise<boolean>;
  sendOTP: (email?: string, phone?: string) => Promise<{ success: boolean; message: string; otp?: string }>;
  verifyOTP: (contact: string, otp: string) => Promise<{ success: boolean; message: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
  resetPassword: (email: string, token: string, newPassword: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing auth token on mount
  useEffect(() => {
    checkAuthStatus();
    // Register callback so API layer can trigger logout on 401
    setUnauthorizedCallback(() => {
      setIsLoggedIn(false);
      setUser(null);
    });
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      const userData = await AsyncStorage.getItem('user_data');
      
      if (token && userData) {
        console.log('Found existing auth session, restoring...');
        setIsLoggedIn(true);
        setUser(JSON.parse(userData));
      } else {
        console.log('No existing auth session found');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Validate email format
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate phone number format (10 digits for most countries)
  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^[0-9]{10}$/;
    return phoneRegex.test(phone.replace(/[^0-9]/g, ''));
  };

  // Validate password strength
  const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  };

  // Check if user is registered
  const isUserRegistered = async (email: string): Promise<boolean> => {
    return AuthService.checkUserExists(email);
  };

  // Send OTP to email or phone
  const sendOTP = async (email?: string, phone?: string): Promise<{ success: boolean; message: string; otp?: string }> => {
    try {
      const response = await AuthService.sendOTP(email, phone);
      return {
        success: response.success,
        message: response.message || 'OTP sent',
        otp: response.data?.otp,
      };
    } catch (error) {
      return { success: false, message: 'Failed to send OTP' };
    }
  };

  // Verify OTP
  const verifyOTP = async (contact: string, otp: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await AuthService.verifyOTP(contact, otp, 'email');
      return { success: response.success, message: response.message || 'OTP verified' };
    } catch (error) {
      return { success: false, message: 'OTP verification failed' };
    }
  };

  // Forgot password
  const forgotPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      if (!validateEmail(email)) {
        return { success: false, message: 'Invalid email format' };
      }
      const response = await AuthService.forgotPassword(email);
      return { success: response.success, message: response.message || 'Reset link sent' };
    } catch (error) {
      return { success: false, message: 'Failed to process password reset request' };
    }
  };

  // Reset password with token
  const resetPassword = async (email: string, token: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    try {
      if (!validateEmail(email)) {
        return { success: false, message: 'Invalid email format' };
      }
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.valid) {
        return { success: false, message: passwordValidation.errors.join('\n') };
      }
      const response = await AuthService.resetPassword(email, token, newPassword);
      return { success: response.success, message: response.message || 'Password reset successfully' };
    } catch (error) {
      return { success: false, message: 'Failed to reset password' };
    }
  };

  const login = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; message: string; isRegistered: boolean }> => {
    // Validate inputs
    if (!email.trim() || !password.trim()) {
      return {
        success: false,
        message: 'Email and password are required',
        isRegistered: false,
      };
    }

    if (!validateEmail(email)) {
      return {
        success: false,
        message: 'Please enter a valid email address',
        isRegistered: false,
      };
    }

    try {
      const response = await AuthService.loginWithEmail(email, password);

      if (response.success && response.data) {
        // Successful login
        const userData: User = {
          id: response.data.user.id,
          email: response.data.user.email,
          name: response.data.user.name,
          phone: response.data.user.phone || '',
          role: response.data.user.role || 'agent',
          createdBy: response.data.user.createdBy || null,
          emailVerified: response.data.user.emailVerified || false,
          phoneVerified: response.data.user.phoneVerified || false,
          createdAt: response.data.user.createdAt || new Date().toISOString(),
        };
        
        // Save user data to AsyncStorage for persistence
        await AsyncStorage.setItem('user_data', JSON.stringify(userData));
        
        setIsLoggedIn(true);
        setUser(userData);

        return {
          success: true,
          message: response.message || 'Login successful',
          isRegistered: true,
        };
      } else {
        // Login failed
        return {
          success: false,
          message: response.message || 'Login failed',
          isRegistered: true, // Assume registered if we got a response
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred during login',
        isRegistered: false,
      };
    }
  };

  // Login with phone number
  const loginWithPhone = async (
    phone: string,
    password: string
  ): Promise<{ success: boolean; message: string; isRegistered: boolean }> => {
    // Validate inputs
    if (!phone.trim() || !password.trim()) {
      return {
        success: false,
        message: 'Phone and password are required',
        isRegistered: false,
      };
    }

    if (!validatePhone(phone)) {
      return {
        success: false,
        message: 'Please enter a valid phone number',
        isRegistered: false,
      };
    }

    try {
      const response = await AuthService.loginWithPhone(phone, password);

      if (response.success && response.data) {
        // Successful login
        const userData: User = {
          id: response.data.user.id,
          email: response.data.user.email,
          name: response.data.user.name,
          phone: response.data.user.phone || '',
          role: response.data.user.role || 'agent',
          createdBy: response.data.user.createdBy || null,
          emailVerified: response.data.user.emailVerified || false,
          phoneVerified: response.data.user.phoneVerified || false,
          createdAt: response.data.user.createdAt || new Date().toISOString(),
        };

        // Save user data to AsyncStorage for persistence
        await AsyncStorage.setItem('user_data', JSON.stringify(userData));

        setIsLoggedIn(true);
        setUser(userData);

        return {
          success: true,
          message: response.message || 'Login successful',
          isRegistered: true,
        };
      } else {
        // Login failed
        return {
          success: false,
          message: response.message || 'Login failed',
          isRegistered: true,
        };
      }
    } catch (error) {
      console.error('Login with phone error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred during login',
        isRegistered: false,
      };
    }
  };

  // Register function
  const register = async (
    email: string,
    password: string,
    name: string,
    phone: string
  ): Promise<{ success: boolean; message: string }> => {
    // Validate inputs
    if (!email.trim() || !password.trim() || !name.trim() || !phone.trim()) {
      return {
        success: false,
        message: 'All fields are required',
      };
    }

    if (!validateEmail(email)) {
      return {
        success: false,
        message: 'Please enter a valid email address',
      };
    }

    if (!validatePhone(phone)) {
      return {
        success: false,
        message: 'Please enter a valid phone number',
      };
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return {
        success: false,
        message: passwordValidation.errors.join('\n'),
      };
    }

    try {
      const response = await AuthService.registerUser(email, password, name, phone);

      if (response.success) {
        // Registration successful
        return {
          success: true,
          message: response.message || 'Registration successful! Please verify your email and phone.',
        };
      } else {
        // Registration failed
        return {
          success: false,
          message: response.message || 'Registration failed',
        };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'An error occurred during registration',
      };
    }
  };

  const logout = async () => {
    setIsLoggedIn(false);
    setUser(null);
    await AsyncStorage.multiRemove(['auth_token', 'refresh_token', 'user_data']);
  };

  return (
    <AuthContext.Provider
      value={{
        isLoggedIn,
        isLoading,
        user,
        login,
        loginWithPhone,
        register,
        logout,
        validateEmail,
        validatePhone,
        validatePassword,
        isUserRegistered,
        sendOTP,
        verifyOTP,
        forgotPassword,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
