/**
 * Ledger API client --- communicates with the .NET 8 Financial Ledger backend.
 * Base URL: /api (proxied via Vite in dev / vercel.json in prod)
 */
import axios, { AxiosInstance } from 'axios';

// --- Types ------------------------------------------------------------------
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
    /** Maps to backend RegisterRequestDto.FullName */
  fullName: string;
    email: string;
    password: string;
    /** One of: Admin | Accountant | Viewer. Defaults to "Viewer". */
  role?: string;
}

export interface ForgotPasswordDto {
    email: string;
}

export interface ResetPasswordDto {
    token: string;
    newPassword: string;
}

export interface MessageResponse {
    message: string;
}

/** Login response from POST /api/auth/login. */
export interface LoginResponse {
    token: string;
    email: string;
    fullName: string;
    role: string;
    expiresAt: string;
}

/**
 * Register response from POST /api/auth/register (201 Created).
 * Note: backend does NOT return a token on register --- caller must log in.
 */
export interface RegisterResponse {
    id: string;
    fullName: string;
    email: string;
    role: string;
}

/** Profile response from GET /api/auth/me. */
export interface MeResponse {
    id: string;
    fullName: string;
    email: string;
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

/**
 * Pull the most useful human-readable error message out of an axios error.
 * Tries response.data.message, response.data.title, then falls back.
 */
export function extractApiErrorMessage(err: unknown, fallback: string): string {
    if (axios.isAxiosError(err)) {
          const data = err.response?.data as { message?: string; title?: string } | string | undefined;
          if (typeof data === 'string' && data.trim()) return data;
          if (data && typeof data === 'object') {
                  if (typeof data.message === 'string' && data.message.trim()) return data.message;
                  if (typeof data.title === 'string' && data.title.trim()) return data.title;
          }
          if (err.response?.status) return `${fallback} (HTTP ${err.response.status})`;
    }
    return fallback;
}

// --- API Client -------------------------------------------------------------
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

  // Auto-logout on 401 (but only for authenticated calls --- never on login/register/reset)
  client.interceptors.response.use(
        (res) => res,
        (err) => {
                const url: string = err.config?.url ?? '';
                const isAuthEndpoint = url.startsWith('/auth/');
                if (err.response?.status === 401 && !isAuthEndpoint) {
                          localStorage.removeItem(TOKEN_KEY);
                          window.location.href = '/login';
                }
                return Promise.reject(err);
        }
      );

  return client;
}

const api = createClient();

// --- Auth -------------------------------------------------------------------
export const authApi = {
    login: (data: LoginDto) =>
          api.post<LoginResponse>('/auth/login', data).then((r) => r.data),

    register: (data: RegisterDto) =>
          api
        .post<RegisterResponse>('/auth/register', {
                  fullName: data.fullName,
                  email: data.email,
                  password: data.password,
                  role: data.role ?? 'Viewer',
        })
        .then((r) => r.data),

    me: () => api.get<MeResponse>('/auth/me').then((r) => r.data),

    forgotPassword: (data: ForgotPasswordDto) =>
          api.post<MessageResponse>('/auth/forgot-password', data).then((r) => r.data),

    resetPassword: (data: ResetPasswordDto) =>
          api.post<MessageResponse>('/auth/reset-password', data).then((r) => r.data),

    saveToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
    getToken: () => localStorage.getItem(TOKEN_KEY),
    clearToken: () => localStorage.removeItem(TOKEN_KEY),
    isLoggedIn: () => !!localStorage.getItem(TOKEN_KEY),
};

// --- Accounts ---------------------------------------------------------------
export const accountsApi = {
    list: () => api.get<Account[]>('/accounts').then((r) => r.data),
    get: (id: number) => api.get<Account>(`/accounts/${id}`).then((r) => r.data),
    create: (data: CreateAccountDto) =>
          api.post<Account>('/accounts', data).then((r) => r.data),
    update: (id: number, data: Partial<CreateAccountDto>) =>
          api.put<Account>(`/accounts/${id}`, data).then((r) => r.data),
};

// --- Transactions -----------------------------------------------------------
export const transactionsApi = {
    list: (params?: { page?: number; pageSize?: number; accountId?: number }) =>
          api.get<Transaction[]>('/transactions', { params }).then((r) => r.data),
    get: (id: number) => api.get<Transaction>(`/transactions/${id}`).then((r) => r.data),
    create: (data: CreateTransactionDto) =>
          api.post<Transaction>('/transactions', data).then((r) => r.data),
    void: (id: number) =>
          api.delete<Transaction>(`/transactions/${id}`).then((r) => r.data),
};

// --- Dashboard --------------------------------------------------------------
export const dashboardApi = {
    summary: () => api.get<DashboardSummary>('/dashboard/summary').then((r) => r.data),
};
