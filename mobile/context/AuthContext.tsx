import * as AuthService from '@/service/auth.service';
import { OTPCode } from '@/types';
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
  logout: () => void;
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
const USERS_STORAGE_KEY = 'app_users';
const OTP_STORAGE_KEY = 'app_otps';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing auth token on mount
  useEffect(() => {
    checkAuthStatus();
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

  // Get all registered users from storage
  const getRegisteredUsers = async (): Promise<User[]> => {
    try {
      const data = await AsyncStorage.getItem(USERS_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading users from storage:', error);
      return [];
    }
  };

  // Save users to storage
  const saveUsers = async (users: User[]): Promise<void> => {
    try {
      await AsyncStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
    } catch (error) {
      console.error('Error saving users to storage:', error);
    }
  };

  // Get all OTP codes from storage
  const getOTPCodes = async (): Promise<OTPCode[]> => {
    try {
      const data = await AsyncStorage.getItem(OTP_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error reading OTPs from storage:', error);
      return [];
    }
  };

  // Save OTP codes to storage
  const saveOTPCodes = async (otps: OTPCode[]): Promise<void> => {
    try {
      await AsyncStorage.setItem(OTP_STORAGE_KEY, JSON.stringify(otps));
    } catch (error) {
      console.error('Error saving OTPs to storage:', error);
    }
  };

  // Generate random OTP (6 digits)
  const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  // Check if user is registered
  const isUserRegistered = async (email: string): Promise<boolean> => {
    const users = await getRegisteredUsers();
    return users.some((u) => u.email.toLowerCase() === email.toLowerCase());
  };

  // Send OTP to email or phone
  const sendOTP = async (email?: string, phone?: string): Promise<{ success: boolean; message: string; otp?: string }> => {
    try {
      const contact = email || phone;
      if (!contact) {
        return { success: false, message: 'Email or phone is required' };
      }

      if (email && !validateEmail(email)) {
        return { success: false, message: 'Invalid email format' };
      }

      if (phone && !validatePhone(phone)) {
        return { success: false, message: 'Invalid phone format' };
      }

      const otp = generateOTP();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + 10 * 60000); // 10 minutes expiry

      // Get existing OTPs
      const otps = await getOTPCodes();

      // Remove old OTPs for this contact
      const filteredOTPs = otps.filter((o) => {
        if (email) return o.email !== email;
        if (phone) return o.phone !== phone;
        return true;
      });

      // Add new OTP
      const newOTP: OTPCode = {
        ...(email && { email }),
        ...(phone && { phone }),
        code: otp,
        createdAt: now.toISOString(),
        expiresAt: expiresAt.toISOString(),
        attempts: 0,
        verified: false,
      };

      filteredOTPs.push(newOTP);
      await saveOTPCodes(filteredOTPs);

      // In production, send OTP via email or SMS
      console.log(`OTP sent to ${contact}: ${otp}`);

      return { success: true, message: `OTP sent to ${contact}`, otp };
    } catch (error) {
      return { success: false, message: 'Failed to send OTP' };
    }
  };

  // Verify OTP
  const verifyOTP = async (contact: string, otp: string): Promise<{ success: boolean; message: string }> => {
    try {
      const otps = await getOTPCodes();
      const otpRecord = otps.find((o) => (o.email === contact || o.phone === contact) && !o.verified);

      if (!otpRecord) {
        return { success: false, message: 'No OTP found. Please request a new one.' };
      }

      // Check if OTP expired
      if (new Date(otpRecord.expiresAt) < new Date()) {
        return { success: false, message: 'OTP has expired. Please request a new one.' };
      }

      // Check max attempts
      if (otpRecord.attempts >= 3) {
        return { success: false, message: 'Too many incorrect attempts. Please request a new OTP.' };
      }

      // Verify OTP
      if (otpRecord.code !== otp) {
        otpRecord.attempts += 1;
        await saveOTPCodes(otps);
        const remaining = 3 - otpRecord.attempts;
        return { success: false, message: `Incorrect OTP. ${remaining} attempts remaining.` };
      }

      // Mark as verified
      otpRecord.verified = true;
      await saveOTPCodes(otps);

      return { success: true, message: 'OTP verified successfully' };
    } catch (error) {
      return { success: false, message: 'OTP verification failed' };
    }
  };

  // Forgot password - TODO: Integrate with backend API
  const forgotPassword = async (email: string): Promise<{ success: boolean; message: string }> => {
    try {
      if (!validateEmail(email)) {
        return { success: false, message: 'Invalid email format' };
      }

      // TODO: Call backend API for password reset
      return { success: true, message: 'If an account exists, a password reset link will be sent to your email.' };
    } catch (error) {
      return { success: false, message: 'Failed to process password reset request' };
    }
  };

  // Reset password with token - TODO: Integrate with backend API
  const resetPassword = async (email: string, token: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    try {
      if (!validateEmail(email)) {
        return { success: false, message: 'Invalid email format' };
      }

      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.valid) {
        return { success: false, message: passwordValidation.errors.join('\n') };
      }

      // TODO: Call backend API for password reset confirmation
      return { success: true, message: 'Password reset successfully. Please login with your new password.' };
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
    // Clear auth data from AsyncStorage
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('refresh_token');
    await AsyncStorage.removeItem('user_data');
    
    setIsLoggedIn(false);
    setUser(null);
    console.log('User logged out');
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
