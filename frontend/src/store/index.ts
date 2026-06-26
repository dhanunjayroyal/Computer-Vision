import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, AuthTokens, Notification, DashboardStats } from '../types';

// ─── Auth Store ────────────────────────────────────────────────────────────────
interface AuthStore {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setTokens: (tokens: AuthTokens | null) => void;
  login: (user: User, tokens: AuthTokens) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setTokens: (tokens) => {
        if (tokens) {
          localStorage.setItem('access_token', tokens.access_token);
          localStorage.setItem('refresh_token', tokens.refresh_token);
        } else {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
        set({ tokens });
      },
      login: (user, tokens) => {
        localStorage.setItem('access_token', tokens.access_token);
        localStorage.setItem('refresh_token', tokens.refresh_token);
        set({ user, tokens, isAuthenticated: true });
      },
      logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, tokens: null, isAuthenticated: false });
      },
      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: 'smartvision-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// ─── UI Store ──────────────────────────────────────────────────────────────────
interface UIStore {
  darkMode: boolean;
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  notifications: Notification[];
  unreadCount: number;
  globalLoading: boolean;
  loadingMessage: string;
  toggleDarkMode: () => void;
  toggleSidebar: () => void;
  toggleSidebarCollapsed: () => void;
  setSidebarOpen: (open: boolean) => void;
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markNotificationRead: (id: string) => void;
  setGlobalLoading: (loading: boolean, message?: string) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set, get) => ({
      darkMode: true,
      sidebarOpen: true,
      sidebarCollapsed: false,
      notifications: [],
      unreadCount: 0,
      globalLoading: false,
      loadingMessage: '',

      toggleDarkMode: () => {
        const newMode = !get().darkMode;
        if (newMode) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
        set({ darkMode: newMode });
      },
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      toggleSidebarCollapsed: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),

      setNotifications: (notifications) =>
        set({
          notifications,
          unreadCount: notifications.filter(n => !n.is_read).length,
        }),
      addNotification: (notification) =>
        set((s) => ({
          notifications: [notification, ...s.notifications],
          unreadCount: s.unreadCount + (notification.is_read ? 0 : 1),
        })),
      markNotificationRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map(n =>
            n.id === id ? { ...n, is_read: true } : n
          ),
          unreadCount: Math.max(0, s.unreadCount - 1),
        })),

      setGlobalLoading: (loading, message = '') =>
        set({ globalLoading: loading, loadingMessage: message }),
    }),
    {
      name: 'smartvision-ui',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        darkMode: state.darkMode,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);

// ─── Dashboard Store ───────────────────────────────────────────────────────────
interface DashboardStore {
  stats: DashboardStats | null;
  lastUpdated: string | null;
  setStats: (stats: DashboardStats) => void;
  refreshStats: () => void;
}

export const useDashboardStore = create<DashboardStore>()((set) => ({
  stats: null,
  lastUpdated: null,
  setStats: (stats) => set({ stats, lastUpdated: new Date().toISOString() }),
  refreshStats: () => set({ stats: null }),
}));

// ─── Upload Store ──────────────────────────────────────────────────────────────
interface UploadStore {
  pendingFiles: File[];
  uploadProgress: number;
  isUploading: boolean;
  uploadedImages: Array<{ id: string; filename: string; url: string }>;
  setPendingFiles: (files: File[]) => void;
  addPendingFile: (file: File) => void;
  removePendingFile: (index: number) => void;
  clearPendingFiles: () => void;
  setUploadProgress: (progress: number) => void;
  setIsUploading: (uploading: boolean) => void;
  addUploadedImage: (image: { id: string; filename: string; url: string }) => void;
  clearUploadedImages: () => void;
}

export const useUploadStore = create<UploadStore>()((set) => ({
  pendingFiles: [],
  uploadProgress: 0,
  isUploading: false,
  uploadedImages: [],

  setPendingFiles: (files) => set({ pendingFiles: files }),
  addPendingFile: (file) =>
    set((s) => ({ pendingFiles: [...s.pendingFiles, file] })),
  removePendingFile: (index) =>
    set((s) => ({ pendingFiles: s.pendingFiles.filter((_, i) => i !== index) })),
  clearPendingFiles: () => set({ pendingFiles: [] }),
  setUploadProgress: (progress) => set({ uploadProgress: progress }),
  setIsUploading: (uploading) => set({ isUploading: uploading }),
  addUploadedImage: (image) =>
    set((s) => ({ uploadedImages: [image, ...s.uploadedImages] })),
  clearUploadedImages: () => set({ uploadedImages: [] }),
}));

// ─── Pipeline Store ────────────────────────────────────────────────────────────
export type PipelineStepStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface PipelineStepState {
  id: string;
  name: string;
  description: string;
  status: PipelineStepStatus;
  duration_ms?: number;
  result?: string;
  error?: string;
}

interface PipelineStore {
  currentImageId: string | null;
  steps: PipelineStepState[];
  isRunning: boolean;
  isComplete: boolean;
  hasError: boolean;
  overallProgress: number;
  setCurrentImageId: (id: string | null) => void;
  setSteps: (steps: PipelineStepState[]) => void;
  updateStep: (id: string, updates: Partial<PipelineStepState>) => void;
  startPipeline: () => void;
  completePipeline: () => void;
  failPipeline: (error: string) => void;
  resetPipeline: () => void;
}

const defaultSteps: PipelineStepState[] = [
  { id: 'upload', name: 'Image Upload', description: 'Upload and validate image', status: 'pending' },
  { id: 'enhance', name: 'Enhancement', description: 'Apply image enhancements', status: 'pending' },
  { id: 'preprocess', name: 'Preprocessing', description: 'Noise removal & normalization', status: 'pending' },
  { id: 'harris', name: 'Harris Corner', description: 'Detect corner features', status: 'pending' },
  { id: 'sift', name: 'SIFT Extraction', description: 'Extract SIFT features', status: 'pending' },
  { id: 'pca', name: 'PCA Optimization', description: 'Reduce feature dimensions', status: 'pending' },
  { id: 'recognize', name: 'Recognition', description: 'Classify and recognize objects', status: 'pending' },
];

export const usePipelineStore = create<PipelineStore>()((set, get) => ({
  currentImageId: null,
  steps: defaultSteps,
  isRunning: false,
  isComplete: false,
  hasError: false,
  overallProgress: 0,

  setCurrentImageId: (id) => set({ currentImageId: id }),
  setSteps: (steps) => set({ steps }),
  updateStep: (id, updates) =>
    set((s) => {
      const steps = s.steps.map(step => step.id === id ? { ...step, ...updates } : step);
      const completed = steps.filter(s => s.status === 'completed').length;
      const overallProgress = Math.round((completed / steps.length) * 100);
      return { steps, overallProgress };
    }),
  startPipeline: () =>
    set({
      isRunning: true,
      isComplete: false,
      hasError: false,
      overallProgress: 0,
      steps: get().steps.map(s => ({ ...s, status: 'pending' })),
    }),
  completePipeline: () => set({ isRunning: false, isComplete: true, overallProgress: 100 }),
  failPipeline: () => set({ isRunning: false, hasError: true }),
  resetPipeline: () =>
    set({
      currentImageId: null,
      steps: defaultSteps,
      isRunning: false,
      isComplete: false,
      hasError: false,
      overallProgress: 0,
    }),
}));
