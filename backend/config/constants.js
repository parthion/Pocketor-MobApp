/**
 * Constants and Enums
 * All constant values used throughout the application
 */

module.exports = {
  // User Roles
  USER_ROLES: {
    ADMIN: 'admin',
    MEMBER: 'member',
  },

  // Collection Status
  COLLECTION_STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    COMPLETED: 'completed',
  },

  // Contribution Types
  CONTRIBUTION_TYPE: {
    REGULAR: 'regular',
    INTEREST: 'interest',
    PENALTY: 'penalty',
  },

  // OTP Types
  OTP_TYPE: {
    EMAIL: 'email',
    PHONE: 'phone',
  },

  // API Response Messages
  MESSAGES: {
    SUCCESS: 'Operation successful',
    ERROR: 'Something went wrong',
    INVALID_CREDENTIALS: 'Invalid email or password',
    USER_EXISTS: 'User with this email already exists',
    USER_NOT_FOUND: 'User not found',
    COLLECTION_NOT_FOUND: 'Collection not found',
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'You do not have permission to perform this action',
    INVALID_INPUT: 'Invalid input data',
    SERVER_ERROR: 'Internal server error',
  },

  // HTTP Status Codes
  STATUS_CODES: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    INTERNAL_ERROR: 500,
  },

  // Pagination
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
  },

  // JWT
  JWT: {
    EXPIRE: '24h',
    REFRESH_EXPIRE: '7d',
  },

  // OTP
  OTP: {
    EXPIRY_MINUTES: 10,
    MAX_ATTEMPTS: 5,
    CODE_LENGTH: 6,
  },

  // Product Config Status
  PRODUCT_CONFIG_STATUS: {
    DRAFT:    'draft',
    ACTIVE:   'active',
    ARCHIVED: 'archived',
  },

  // Gateway Payment Status
  GATEWAY_PAYMENT_STATUS: {
    INITIATED: 'initiated',
    PENDING:   'pending',
    SUCCESS:   'success',
    FAILED:    'failed',
    REFUNDED:  'refunded',
  },

  // Ledger Entry Types
  LEDGER_ENTRY_TYPE: {
    DEBIT:  'debit',
    CREDIT: 'credit',
  },

  // Feature Flags
  FEATURE_FLAGS: {
    PRODUCT_CONFIGS_ENABLED:  'product_configs_enabled',
    PAYMENT_GATEWAY_ENABLED:  'payment_gateway_enabled',
  },
};
