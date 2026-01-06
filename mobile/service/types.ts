/**
 * API Response Types
 * 
 * Standard types for all API responses
 */

/**
 * Standard API response format
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

/**
 * User type for authentication
 */
export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: string;
}

/**
 * Collection type
 */
export interface Collection {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'completed';
  startDate: string;
  endDate?: string;
  frequency: string;
  interestRate: number;
  totalAmount: number;
  members: Member[];
  contributions: Contribution[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Member type
 */
export interface Member {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role: 'admin' | 'member';
  joinedDate: string;
}

/**
 * Contribution type
 */
export interface Contribution {
  id: string;
  memberId: string;
  memberName: string;
  amount: number;
  date: string;
  description?: string;
  type: 'regular' | 'interest' | 'penalty';
}

/**
 * OTP Code type
 */
export interface OTPCode {
  id: string;
  contact: string;
  type: 'email' | 'phone';
  code: string;
  isVerified: boolean;
  expiresAt: string;
  createdAt: string;
}

/**
 * Login response type
 */
export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
}

/**
 * Registration response type
 */
export interface RegisterResponse {
  userId: string;
  message: string;
}

/**
 * Pagination info
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}
