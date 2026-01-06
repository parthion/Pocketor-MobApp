/**
 * Collections Service
 * 
 * Handles all collection-related API calls:
 * - Create, read, update, delete collections
 * - Manage collection members
 * - Record contributions
 * - Get collection statistics
 */

import { API_BASE_URL, getAuthHeaders } from './config';
import { ApiResponse, Collection, Contribution, Member, PaginatedResponse } from './types';

/**
 * Helper function to make collections API calls
 */
async function collectionsCall<T>(
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
      throw new Error(data.message || 'Collections API call failed');
    }

    return data;
  } catch (error) {
    console.error(`Collections Error [${method} ${endpoint}]:`, error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'An error occurred',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============= COLLECTION CRUD =============

/**
 * Get all collections for current user with pagination
 */
export const getAllCollections = async (
  page: number = 1,
  limit: number = 10,
  status?: string
) => {
  let endpoint = `/collections?page=${page}&limit=${limit}`;
  if (status) {
    endpoint += `&status=${status}`;
  }
  return collectionsCall<PaginatedResponse<Collection>>(endpoint, 'GET');
};

/**
 * Get a specific collection by ID
 */
export const getCollectionById = async (id: string) => {
  return collectionsCall<Collection>(`/collections/${id}`, 'GET');
};

/**
 * Create a new collection
 */
export const createCollection = async (collectionData: {
  name: string;
  description?: string;
  frequency?: string;
  interestRate?: number;
  startDate?: string;
  totalAmount?: number;
}) => {
  // Ensure required fields are present
  const payload = {
    name: collectionData.name,
    description: collectionData.description || '',
    frequency: collectionData.frequency || 'monthly',
    interestRate: collectionData.interestRate || 0,
    startDate: collectionData.startDate || new Date().toISOString().split('T')[0],
    totalAmount: collectionData.totalAmount || 1000, // Default to 1000 if not provided
  };
  
  return collectionsCall<{ id: string }>('/collections', 'POST', payload);
};

/**
 * Update a collection
 */
export const updateCollection = async (
  id: string,
  collectionData: Partial<Collection>
) => {
  return collectionsCall(`/collections/${id}`, 'PUT', collectionData);
};

/**
 * Delete a collection
 */
export const deleteCollection = async (id: string) => {
  return collectionsCall(`/collections/${id}`, 'DELETE');
};

// ============= MEMBER MANAGEMENT =============

/**
 * Add member to collection
 */
export const addMemberToCollection = async (
  collectionId: string,
  memberData: {
    name: string;
    email?: string;
    phone?: string;
    role?: 'admin' | 'member';
  }
) => {
  return collectionsCall<{ memberId: string }>(
    `/collections/${collectionId}/members`,
    'POST',
    memberData
  );
};

/**
 * Remove member from collection
 */
export const removeMemberFromCollection = async (collectionId: string, memberId: string) => {
  return collectionsCall(
    `/collections/${collectionId}/members/${memberId}`,
    'DELETE'
  );
};

/**
 * Get collection members
 */
export const getCollectionMembers = async (collectionId: string) => {
  return collectionsCall<Member[]>(`/collections/${collectionId}/members`, 'GET');
};

/**
 * Update member role
 */
export const updateMemberRole = async (
  collectionId: string,
  memberId: string,
  role: 'admin' | 'member'
) => {
  return collectionsCall(
    `/collections/${collectionId}/members/${memberId}`,
    'PUT',
    { role }
  );
};

// ============= CONTRIBUTION MANAGEMENT =============

/**
 * Record a contribution
 */
export const recordContribution = async (
  collectionId: string,
  contributionData: {
    memberId: string;
    amount: number;
    date?: string;
    description?: string;
    type?: 'regular' | 'interest' | 'penalty';
  }
) => {
  return collectionsCall<{ contributionId: string }>(
    `/collections/${collectionId}/contributions`,
    'POST',
    contributionData
  );
};

/**
 * Get collection contributions
 */
export const getCollectionContributions = async (collectionId: string) => {
  return collectionsCall<Contribution[]>(
    `/collections/${collectionId}/contributions`,
    'GET'
  );
};

/**
 * Get member contributions
 */
export const getMemberContributions = async (collectionId: string, memberId: string) => {
  return collectionsCall<Contribution[]>(
    `/collections/${collectionId}/members/${memberId}/contributions`,
    'GET'
  );
};

/**
 * Delete a contribution
 */
export const deleteContribution = async (collectionId: string, contributionId: string) => {
  return collectionsCall(
    `/collections/${collectionId}/contributions/${contributionId}`,
    'DELETE'
  );
};

// ============= STATISTICS & ANALYTICS =============

/**
 * Get collection statistics
 */
export const getCollectionStats = async (collectionId: string) => {
  return collectionsCall<{
    totalMembers: number;
    totalContributions: number;
    totalAmount: number;
    averageContribution: number;
    lastContributionDate?: string;
    nextDueDate?: string;
  }>(`/collections/${collectionId}/stats`, 'GET');
};

/**
 * Get member statistics in a collection
 */
export const getMemberStats = async (collectionId: string, memberId: string) => {
  return collectionsCall<{
    totalContributed: number;
    contributionCount: number;
    averageContribution: number;
    lastContributionDate?: string;
  }>(`/collections/${collectionId}/members/${memberId}/stats`, 'GET');
};

// ============= COLLECTION SEARCH & FILTER =============

/**
 * Search collections by name
 */
export const searchCollections = async (query: string) => {
  return collectionsCall<Collection[]>(
    `/collections/search?q=${encodeURIComponent(query)}`,
    'GET'
  );
};

/**
 * Get collections by status
 */
export const getCollectionsByStatus = async (status: 'active' | 'inactive' | 'completed') => {
  return collectionsCall<Collection[]>(
    `/collections?status=${status}`,
    'GET'
  );
};
