import type { Area, Customer, Line } from '@/types/collection.types';
import { API_BASE_URL, getAuthHeaders, handleUnauthorized } from './config';
import { ApiResponse } from './types';

/**
 * Convert snake_case keys to camelCase
 */
function toCamelCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  } else if (obj !== null && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
      result[camelKey] = toCamelCase(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
}

/**
 * Helper function to make loan collection API calls
 */
async function apiCall<T>(
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
      throw new Error(data.message || 'API call failed');
    }

    // Transform snake_case to camelCase
    if (data.data) {
      data.data = toCamelCase(data.data);
    }

    return data;
  } catch (error) {
    console.error(`Loan Collection Error [${method} ${endpoint}]:`, error);
    throw error;
  }
}

// Line APIs
export const loanCollectionService = {
  // ===== LINES =====
  async createLine(lineData: Omit<Line, 'id' | 'createdAt' | 'updatedAt'>) {
    return apiCall<Line>('/loan-collections/lines', 'POST', lineData);
  },

  async getLines() {
    return apiCall<Line[]>('/loan-collections/lines', 'GET');
  },

  async getLineById(id: string) {
    return apiCall<Line>(`/loan-collections/lines/${id}`, 'GET');
  },

  async updateLine(id: string, lineData: Partial<Line>) {
    return apiCall<Line>(`/loan-collections/lines/${id}`, 'PUT', lineData);
  },

  async deleteLine(id: string) {
    return apiCall<{ success: boolean }>(`/loan-collections/lines/${id}`, 'DELETE');
  },

  // ===== AREAS =====
  async createArea(areaData: Omit<Area, 'id' | 'createdAt'>) {
    return apiCall<Area>('/loan-collections/areas', 'POST', areaData);
  },

  async getAreas() {
    return apiCall<Area[]>('/loan-collections/areas', 'GET');
  },

  async getAreasByLine(lineId: string) {
    return apiCall<Area[]>(`/loan-collections/areas/by-line/${lineId}`, 'GET');
  },

  async updateArea(id: string, areaData: Partial<Area>) {
    return apiCall<Area>(`/loan-collections/areas/${id}`, 'PUT', areaData);
  },

  async deleteArea(id: string) {
    return apiCall<{ success: boolean }>(`/loan-collections/areas/${id}`, 'DELETE');
  },

  // ===== CUSTOMERS =====
  async createCustomer(customerData: Omit<Customer, 'id' | 'createdAt'>) {
    return apiCall<Customer>('/loan-collections/customers', 'POST', customerData);
  },

  async getCustomers() {
    return apiCall<Customer[]>('/loan-collections/customers', 'GET');
  },

  async getCustomersByArea(areaId: string) {
    return apiCall<Customer[]>(`/loan-collections/customers/by-area/${areaId}`, 'GET');
  },

  async getCustomersByLine(lineId: string) {
    return apiCall<Customer[]>(`/loan-collections/customers/by-line/${lineId}`, 'GET');
  },

  async updateCustomer(id: string, customerData: Partial<Customer>) {
    return apiCall<Customer>(`/loan-collections/customers/${id}`, 'PUT', customerData);
  },

  async deleteCustomer(id: string) {
    return apiCall<{ success: boolean }>(`/loan-collections/customers/${id}`, 'DELETE');
  },

  // ===== LOANS =====
  async createLoan(loanData: any) {
    return apiCall<any>('/loan-collections/loans', 'POST', loanData);
  },

  async getLoans() {
    return apiCall<any[]>('/loan-collections/loans', 'GET');
  },

  async getLoanById(id: string) {
    return apiCall<any>(`/loan-collections/loans/${id}`, 'GET');
  },

  async getLoansByCustomer(customerId: string) {
    return apiCall<any[]>(`/loan-collections/loans/by-customer/${customerId}`, 'GET');
  },

  async updateLoan(id: string, loanData: any) {
    return apiCall<any>(`/loan-collections/loans/${id}`, 'PUT', loanData);
  },

  async deleteLoan(id: string) {
    return apiCall<{ success: boolean }>(`/loan-collections/loans/${id}`, 'DELETE');
  },

  // ===== PAYMENTS =====
  async recordPayment(paymentData: any) {
    return apiCall<any>('/loan-collections/payments', 'POST', paymentData);
  },

  async getPaymentsByLoan(loanId: string) {
    return apiCall<any[]>(`/loan-collections/payments/by-loan/${loanId}`, 'GET');
  },

  async getPaymentsByCustomer(customerId: string) {
    return apiCall<any[]>(`/loan-collections/payments/by-customer/${customerId}`, 'GET');
  },
};

export default loanCollectionService;
