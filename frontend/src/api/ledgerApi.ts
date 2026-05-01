/**
 * Ledger API client — communicates with the .NET 8 Financial Ledger backend.
 * Base URL: https://localhost:5001/api (proxied via Vite in dev)
 */

import axios, { AxiosInstance } from 'axios';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AccountType = 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';

export interface Account {
  id: number;
  accountNumber: string;
  accountName: string;
  accountType: AccountType;
  balance: number;
  currency: string;
  isActive: boolean;
  createdAt: string;
}

export interface TransactionLine {
  accountId: number;
  accountName: string;
  amount: number;
  type: 'Debit' | 'Credit';
}

export interface Transaction {
  id: number;
  referenceNumber: string;
  description: string;
  amount: number;
  currency: string;
  debitAccountId: number;
  creditAccountId: number;
  debitAccountName: string;
  creditAccountName: string;
  status: 'Pending' | 'Posted' | 'Voided';
  transactionDate: string;
  createdAt: string;
  createdBy: string;
}

export interface CreateTransactionDto {
  debitAccountId: number;
  creditAccountId: number;
  amount: number;
  description: string;
  currency?: string;
}

export interface CreateAccountDto {
  accountNumber: string;
  accountName: string;
  accountType: AccountType;
  currency?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  username: string;
  role?: string;
}

export interface AuthResponse {
  token: string;
  email: string;
  username: string;
  role: string;
}

export interface DashboardSummary {
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  totalRevenue: number;
  totalExpenses: number;
  transactionCount: number;
  recentTransactions: Transaction[];
}

// ─── API Client ───────────────────────────────────────────────────────────────

const TOKEN_KEY = 'ledger_token';

function createClient(): AxiosInstance {
  const client = axios.create({
    baseURL: '/api',
    timeout: 15_000,
    headers: { 'Content-Type': 'application/json' },
  });

  // Attach JWT on every request
  client.interceptors.request.use((config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  // Auto-logout on 401
  client.interceptors.response.use(
    (res) => res,
    (err) => {
      if (err.response?.status === 401) {
        localStorage.removeItem(TOKEN_KEY);
        window.location.href = '/login';
      }
      return Promise.reject(err);
    }
  );

  return client;
}

const api = createClient();

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  login: (data: LoginDto) =>
    api.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  register: (data: RegisterDto) =>
    api.post<AuthResponse>('/auth/register', data).then((r) => r.data),

  me: () => api.get<AuthResponse>('/auth/me').then((r) => r.data),

  saveToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  getToken: () => localStorage.getItem(TOKEN_KEY),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
  isLoggedIn: () => !!localStorage.getItem(TOKEN_KEY),
};

// ─── Accounts ─────────────────────────────────────────────────────────────────

export const accountsApi = {
  list: () => api.get<Account[]>('/accounts').then((r) => r.data),
  get: (id: number) => api.get<Account>(`/accounts/${id}`).then((r) => r.data),
  create: (data: CreateAccountDto) =>
    api.post<Account>('/accounts', data).then((r) => r.data),
  update: (id: number, data: Partial<CreateAccountDto>) =>
    api.put<Account>(`/accounts/${id}`, data).then((r) => r.data),
};

// ─── Transactions ─────────────────────────────────────────────────────────────

export const transactionsApi = {
  list: (params?: { page?: number; pageSize?: number; accountId?: number }) =>
    api.get<Transaction[]>('/transactions', { params }).then((r) => r.data),

  get: (id: number) =>
    api.get<Transaction>(`/transactions/${id}`).then((r) => r.data),

  create: (data: CreateTransactionDto) =>
    api.post<Transaction>('/transactions', data).then((r) => r.data),

  void: (id: number) =>
    api.delete<Transaction>(`/transactions/${id}`).then((r) => r.data),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────

export const dashboardApi = {
  summary: () => api.get<DashboardSummary>('/dashboard/summary').then((r) => r.data),
};
