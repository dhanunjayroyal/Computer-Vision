import React, { Suspense, lazy, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AnimatePresence } from 'framer-motion';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useAuthStore, useUIStore } from './store';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import LoadingScreen from './components/ui/LoadingScreen';
import ProtectedRoute from './components/ui/ProtectedRoute';
import ErrorBoundary from './components/ui/ErrorBoundary';

// ─── Lazy Pages ────────────────────────────────────────────────────────────────
// Auth
const LoginPage        = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage     = lazy(() => import('./pages/auth/RegisterPage'));
const ForgotPassword   = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPassword    = lazy(() => import('./pages/auth/ResetPasswordPage'));

// Dashboard
const DashboardPage    = lazy(() => import('./pages/DashboardPage'));
const AdminDashboard   = lazy(() => import('./pages/admin/AdminDashboard'));

// Modules
const UploadPage       = lazy(() => import('./pages/modules/UploadPage'));
const EnhancementPage  = lazy(() => import('./pages/modules/EnhancementPage'));
const HarrisPage       = lazy(() => import('./pages/modules/HarrisPage'));
const SIFTPage         = lazy(() => import('./pages/modules/SIFTPage'));
const PCAPage          = lazy(() => import('./pages/modules/PCAPage'));
const RecognitionPage  = lazy(() => import('./pages/modules/RecognitionPage'));
const PipelinePage     = lazy(() => import('./pages/modules/PipelinePage'));

// User
const ProfilePage      = lazy(() => import('./pages/user/ProfilePage'));
const HistoryPage      = lazy(() => import('./pages/user/HistoryPage'));
const ReportsPage      = lazy(() => import('./pages/user/ReportsPage'));
const SettingsPage     = lazy(() => import('./pages/user/SettingsPage'));

// Admin
const UsersPage        = lazy(() => import('./pages/admin/UsersPage'));
const CategoriesPage   = lazy(() => import('./pages/admin/CategoriesPage'));
const LogsPage         = lazy(() => import('./pages/admin/LogsPage'));
const SystemSettings   = lazy(() => import('./pages/admin/SystemSettingsPage'));
const ImagesManagement = lazy(() => import('./pages/admin/ImagesManagementPage'));

// ─── Query Client ──────────────────────────────────────────────────────────────
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,     // 5 minutes
      gcTime: 1000 * 60 * 10,       // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// ─── App Component ─────────────────────────────────────────────────────────────
function App() {
  const { isAuthenticated, user } = useAuthStore();
  const { darkMode } = useUIStore();

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ErrorBoundary>
          <AnimatePresence mode="wait">
            <Suspense fallback={<LoadingScreen />}>
              <Routes>
                {/* ─── Auth Routes ─── */}
                <Route element={<AuthLayout />}>
                  <Route
                    path="/login"
                    element={
                      isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
                    }
                  />
                  <Route
                    path="/register"
                    element={
                      isAuthenticated ? <Navigate to="/dashboard" replace /> : <RegisterPage />
                    }
                  />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                </Route>

                {/* ─── Protected App Routes ─── */}
                <Route
                  element={
                    <ProtectedRoute>
                      <MainLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<DashboardPage />} />

                  {/* Modules */}
                  <Route path="/upload"      element={<UploadPage />} />
                  <Route path="/pipeline"    element={<PipelinePage />} />
                  <Route path="/enhancement" element={<EnhancementPage />} />
                  <Route path="/harris"      element={<HarrisPage />} />
                  <Route path="/sift"        element={<SIFTPage />} />
                  <Route path="/pca"         element={<PCAPage />} />
                  <Route path="/recognition" element={<RecognitionPage />} />

                  {/* User */}
                  <Route path="/profile"     element={<ProfilePage />} />
                  <Route path="/history"     element={<HistoryPage />} />
                  <Route path="/reports"     element={<ReportsPage />} />
                  <Route path="/settings"    element={<SettingsPage />} />

                  {/* Admin */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <AdminDashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/users"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <UsersPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/categories"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <CategoriesPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/images"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <ImagesManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/logs"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <LogsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/settings"
                    element={
                      <ProtectedRoute requiredRole="admin">
                        <SystemSettings />
                      </ProtectedRoute>
                    }
                  />
                </Route>

                {/* 404 */}
                <Route path="*" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />} />
              </Routes>
            </Suspense>
          </AnimatePresence>
        </ErrorBoundary>
      </BrowserRouter>

      {/* Global Toast Notifications */}
      <ToastContainer
        position="bottom-right"
        autoClose={4000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
        toastStyle={{
          background: 'rgba(15, 23, 42, 0.95)',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: '12px',
          backdropFilter: 'blur(20px)',
          color: '#f1f5f9',
        }}
      />
    </QueryClientProvider>
  );
}

export default App;
