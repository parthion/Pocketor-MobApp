import { API_BASE_URL, getAuthHeaders, handleUnauthorized } from './config';

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  note: string;
  expenseDate: string; // ISO yyyy-mm-dd
  createdAt?: string;
}

export interface ExpenseInput {
  title: string;
  amount: number;
  category: string;
  note?: string;
  expenseDate?: string; // ISO yyyy-mm-dd, defaults to today
}

async function apiCall<T>(
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  body?: any
): Promise<{ success: boolean; data?: T; total?: number; message?: string }> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = await getAuthHeaders();
  const response = await fetch(url, {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const json = await response.json();
  if (response.status === 401) {
    await handleUnauthorized();
    throw new Error('Unauthorized');
  }
  if (!response.ok) throw new Error(json.message || 'Request failed');
  return json;
}

export const expenseService = {
  async getAll(opts: { category?: string; startDate?: string; endDate?: string } = {}) {
    const params = new URLSearchParams();
    if (opts.category && opts.category !== 'All') params.set('category', opts.category);
    if (opts.startDate) params.set('startDate', opts.startDate);
    if (opts.endDate)   params.set('endDate',   opts.endDate);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiCall<Expense[]>(`/expenses${qs}`);
  },

  async create(data: ExpenseInput) {
    return apiCall<Expense>('/expenses', 'POST', {
      ...data,
      expenseDate: data.expenseDate || new Date().toISOString().split('T')[0],
    });
  },

  async update(id: string, data: Partial<ExpenseInput>) {
    return apiCall<Expense>(`/expenses/${id}`, 'PUT', data);
  },

  async delete(id: string) {
    return apiCall<null>(`/expenses/${id}`, 'DELETE');
  },

  async getSummary(opts: { startDate?: string; endDate?: string } = {}) {
    const params = new URLSearchParams();
    if (opts.startDate) params.set('startDate', opts.startDate);
    if (opts.endDate)   params.set('endDate',   opts.endDate);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return apiCall<{ category: string; total: number; count: number }[]>(`/expenses/summary${qs}`);
  },
};
