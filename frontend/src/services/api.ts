import apiClient from './apiClient';
import type {
  LoginRequest, RegisterRequest, AuthTokens, User,
  ApiResponse, ImageRecord, EnhancementParams, EnhancementResult,
  HarrisParams, HarrisResult, SIFTParams, SIFTResult, SIFTMatchResult,
  PCAParams, PCAResult, RecognitionResult, DashboardStats, AdminStats,
  RecognitionTrend, ObjectDistribution, RecentActivity, Notification,
  ObjectCategory, ActivityLog, SystemSettings, Report, PaginatedResponse,
  QueryParams
} from '../types';

// ─── Auth Services ─────────────────────────────────────────────────────────────
export const authService = {
  login: (data: LoginRequest) =>
    apiClient.post<ApiResponse<AuthTokens & { user: User }>>('/auth/login', data),

  register: (data: RegisterRequest) =>
    apiClient.post<ApiResponse<User>>('/auth/register', data),

  logout: () =>
    apiClient.post<ApiResponse>('/auth/logout'),

  refresh: (refreshToken: string) =>
    apiClient.post<ApiResponse<AuthTokens>>('/auth/refresh', { refresh_token: refreshToken }),

  forgotPassword: (email: string) =>
    apiClient.post<ApiResponse>('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    apiClient.post<ApiResponse>('/auth/reset-password', { token, password }),

  verifyEmail: (token: string) =>
    apiClient.post<ApiResponse>('/auth/verify-email', { token }),

  me: () =>
    apiClient.get<ApiResponse<User>>('/auth/me'),
};

// ─── Image Services ────────────────────────────────────────────────────────────
export const imageService = {
  upload: (file: File, onProgress?: (p: number) => void) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.post<ApiResponse<ImageRecord>>('/images/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    });
  },

  uploadMultiple: (files: File[], onProgress?: (p: number) => void) => {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    return apiClient.post<ApiResponse<ImageRecord[]>>('/images/upload-multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (onProgress && e.total) {
          onProgress(Math.round((e.loaded * 100) / e.total));
        }
      },
    });
  },

  getAll: (params?: QueryParams) =>
    apiClient.get<ApiResponse<PaginatedResponse<ImageRecord>>>('/images', { params }),

  getById: (id: string) =>
    apiClient.get<ApiResponse<ImageRecord>>(`/images/${id}`),

  delete: (id: string) =>
    apiClient.delete<ApiResponse>(`/images/${id}`),

  download: (id: string) =>
    apiClient.get(`/images/${id}/download`, { responseType: 'blob' }),

  getMetadata: (id: string) =>
    apiClient.get<ApiResponse>(`/images/${id}/metadata`),

  getThumbnail: (id: string) =>
    `${import.meta.env.VITE_API_BASE_URL}/api/v1/images/${id}/thumbnail`,

  getUrl: (filePath: string) =>
    `${import.meta.env.VITE_API_BASE_URL}/uploads/${filePath}`,
};

// ─── Enhancement Services ──────────────────────────────────────────────────────
export const enhancementService = {
  enhance: (imageId: string, params: EnhancementParams) =>
    apiClient.post<ApiResponse<EnhancementResult>>('/enhancement/enhance', {
      image_id: imageId,
      params,
    }),

  getHistory: (imageId: string) =>
    apiClient.get<ApiResponse<EnhancementResult[]>>(`/enhancement/history/${imageId}`),

  downloadEnhanced: (resultId: string) =>
    apiClient.get(`/enhancement/${resultId}/download`, { responseType: 'blob' }),
};

// ─── Harris Corner Services ────────────────────────────────────────────────────
export const harrisService = {
  detect: (imageId: string, params: HarrisParams) =>
    apiClient.post<ApiResponse<HarrisResult>>('/harris/detect', {
      image_id: imageId,
      params,
    }),

  getHistory: (imageId: string) =>
    apiClient.get<ApiResponse<HarrisResult[]>>(`/harris/history/${imageId}`),

  downloadResult: (resultId: string) =>
    apiClient.get(`/harris/${resultId}/download`, { responseType: 'blob' }),
};

// ─── SIFT Services ─────────────────────────────────────────────────────────────
export const siftService = {
  extract: (imageId: string, params: SIFTParams) =>
    apiClient.post<ApiResponse<SIFTResult>>('/sift/extract', {
      image_id: imageId,
      params,
    }),

  match: (image1Id: string, image2Id: string) =>
    apiClient.post<ApiResponse<SIFTMatchResult>>('/sift/match', {
      image1_id: image1Id,
      image2_id: image2Id,
    }),

  getHistory: (imageId: string) =>
    apiClient.get<ApiResponse<SIFTResult[]>>(`/sift/history/${imageId}`),
};

// ─── PCA Services ──────────────────────────────────────────────────────────────
export const pcaService = {
  optimize: (imageId: string, params: PCAParams) =>
    apiClient.post<ApiResponse<PCAResult>>('/pca/optimize', {
      image_id: imageId,
      params,
    }),

  getHistory: (imageId: string) =>
    apiClient.get<ApiResponse<PCAResult[]>>(`/pca/history/${imageId}`),
};

// ─── Recognition Services ──────────────────────────────────────────────────────
export const recognitionService = {
  recognize: (imageId: string) =>
    apiClient.post<ApiResponse<RecognitionResult>>('/recognition/recognize', {
      image_id: imageId,
    }),

  recognizeFull: (imageId: string) =>
    apiClient.post<ApiResponse<RecognitionResult>>('/recognition/recognize-full-pipeline', {
      image_id: imageId,
    }),

  getAll: (params?: QueryParams) =>
    apiClient.get<ApiResponse<PaginatedResponse<RecognitionResult>>>('/recognition', { params }),

  getById: (id: string) =>
    apiClient.get<ApiResponse<RecognitionResult>>(`/recognition/${id}`),

  getHistory: () =>
    apiClient.get<ApiResponse<RecognitionResult[]>>('/recognition/history'),
};

// ─── Analytics Services ────────────────────────────────────────────────────────
export const analyticsService = {
  getDashboardStats: () =>
    apiClient.get<ApiResponse<DashboardStats>>('/analytics/dashboard'),

  getAdminStats: () =>
    apiClient.get<ApiResponse<AdminStats>>('/analytics/admin'),

  getTrends: (days = 30) =>
    apiClient.get<ApiResponse<RecognitionTrend[]>>(`/analytics/trends?days=${days}`),

  getObjectDistribution: () =>
    apiClient.get<ApiResponse<ObjectDistribution[]>>('/analytics/object-distribution'),

  getRecentActivity: (limit = 10) =>
    apiClient.get<ApiResponse<RecentActivity[]>>(`/analytics/recent-activity?limit=${limit}`),

  getAccuracyMetrics: () =>
    apiClient.get<ApiResponse>('/analytics/accuracy'),

  getProcessingMetrics: () =>
    apiClient.get<ApiResponse>('/analytics/processing'),
};

// ─── Report Services ───────────────────────────────────────────────────────────
export const reportService = {
  generate: (type: Report['type'], format: Report['format'], params?: Record<string, unknown>) =>
    apiClient.post<ApiResponse<Report>>('/reports/generate', { type, format, params }),

  getAll: () =>
    apiClient.get<ApiResponse<Report[]>>('/reports'),

  download: (reportId: string) =>
    apiClient.get(`/reports/${reportId}/download`, { responseType: 'blob' }),

  delete: (reportId: string) =>
    apiClient.delete<ApiResponse>(`/reports/${reportId}`),
};

// ─── Notification Services ─────────────────────────────────────────────────────
export const notificationService = {
  getAll: () =>
    apiClient.get<ApiResponse<Notification[]>>('/notifications'),

  markRead: (id: string) =>
    apiClient.put<ApiResponse>(`/notifications/${id}/read`),

  markAllRead: () =>
    apiClient.put<ApiResponse>('/notifications/read-all'),

  delete: (id: string) =>
    apiClient.delete<ApiResponse>(`/notifications/${id}`),
};

// ─── Admin Services ────────────────────────────────────────────────────────────
export const adminService = {
  getUsers: (params?: QueryParams) =>
    apiClient.get<ApiResponse<PaginatedResponse<User>>>('/admin/users', { params }),

  getUserById: (id: string) =>
    apiClient.get<ApiResponse<User>>(`/admin/users/${id}`),

  updateUser: (id: string, data: Partial<User>) =>
    apiClient.put<ApiResponse<User>>(`/admin/users/${id}`, data),

  deleteUser: (id: string) =>
    apiClient.delete<ApiResponse>(`/admin/users/${id}`),

  updateUserRole: (id: string, role: string) =>
    apiClient.put<ApiResponse>(`/admin/users/${id}/role`, { role }),

  toggleUserStatus: (id: string) =>
    apiClient.put<ApiResponse>(`/admin/users/${id}/toggle-status`),

  getCategories: () =>
    apiClient.get<ApiResponse<ObjectCategory[]>>('/admin/categories'),

  createCategory: (data: Partial<ObjectCategory>) =>
    apiClient.post<ApiResponse<ObjectCategory>>('/admin/categories', data),

  updateCategory: (id: string, data: Partial<ObjectCategory>) =>
    apiClient.put<ApiResponse<ObjectCategory>>(`/admin/categories/${id}`, data),

  deleteCategory: (id: string) =>
    apiClient.delete<ApiResponse>(`/admin/categories/${id}`),

  getActivityLogs: (params?: QueryParams) =>
    apiClient.get<ApiResponse<PaginatedResponse<ActivityLog>>>('/admin/logs', { params }),

  getSystemSettings: () =>
    apiClient.get<ApiResponse<SystemSettings>>('/admin/settings'),

  updateSystemSettings: (settings: Partial<SystemSettings>) =>
    apiClient.put<ApiResponse<SystemSettings>>('/admin/settings', settings),

  getSystemHealth: () =>
    apiClient.get<ApiResponse>('/health'),

  exportData: (type: string, format: string) =>
    apiClient.get(`/admin/export?type=${type}&format=${format}`, { responseType: 'blob' }),
};

// ─── User Services ─────────────────────────────────────────────────────────────
export const userService = {
  getProfile: () =>
    apiClient.get<ApiResponse<User>>('/users/profile'),

  updateProfile: (data: Partial<User>) =>
    apiClient.put<ApiResponse<User>>('/users/profile', data),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.put<ApiResponse>('/users/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    }),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiClient.post<ApiResponse<{ avatar_url: string }>>('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteAvatar: () =>
    apiClient.delete<ApiResponse>('/users/avatar'),

  getActivityTimeline: () =>
    apiClient.get<ApiResponse<ActivityLog[]>>('/users/activity'),

  updateSettings: (settings: Record<string, unknown>) =>
    apiClient.put<ApiResponse>('/users/settings', settings),
};
