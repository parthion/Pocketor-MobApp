/**
 * Service Layer Index
 * 
 * Central export point for all API services
 * Import from here instead of individual files
 */

// Export all authentication functions
export * from './auth.service';

// Export all collections functions
export * from './collections.service';

// Export all loan collection functions
export * from './loan-collection.service';

// Export all types
export * from './types';

// Export configuration
export { API_BASE_URL, getAuthHeaders, getPublicHeaders, handleUnauthorized } from './config';

/**
 * Service documentation:
 * 
 * Auth Service (auth.service.ts):
 *   - registerUser()
 *   - loginWithEmail()
 *   - loginWithPhone()
 *   - sendOTP()
 *   - verifyOTP()
 *   - forgotPassword()
 *   - resetPassword()
 *   - getCurrentUser()
 *   - refreshAuthToken()
 *   - logoutUser()
 *   - getAuthToken()
 *   - clearAuthTokens()
 * 
 * Collections Service (collections.service.ts):
 *   - getAllCollections()
 *   - getCollectionById()
 *   - createCollection()
 *   - updateCollection()
 *   - deleteCollection()
 *   - addMemberToCollection()
 *   - removeMemberFromCollection()
 *   - recordContribution()
 *   - getCollectionStats()
 *   - searchCollections()
 */
