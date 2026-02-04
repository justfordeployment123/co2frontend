import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Toaster } from 'react-hot-toast';
import ToastProvider from './components/common/Toast';
import MainLayout from './components/layout/MainLayout';
import OnboardingGuard from './components/layout/OnboardingGuard';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ActivitiesListPage from './pages/ActivitiesListPage';
import AddActivityPage from './pages/AddActivityPage';
import ActivityDetailsPage from './pages/ActivityDetailsPage';
import CompanySettingsPage from './pages/CompanySettingsPage';
import UserManagementPage from './pages/UserManagementPage';
import ProfileSettingsPage from './pages/ProfileSettingsPage';
import ReportsListPage from './pages/ReportsListPage';
import GenerateReportPage from './pages/GenerateReportPage';
import ReportViewerPage from './pages/ReportViewerPage';
import UnauthorizedPage from './pages/errors/UnauthorizedPage';
import HelpPage from './pages/HelpPage';
import ReportHistoryPage from './pages/reports/ReportHistoryPage';
import BoundaryQuestionsWizard from './pages/BoundaryQuestionsWizard';
import BoundarySettingsPage from './pages/settings/BoundarySettingsPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import ReportingPeriodsPage from './pages/ReportingPeriodsPage';
import ActivitiesChecklistPage from './pages/ActivitiesChecklistPage';
import Loading from './components/common/Loading';
import RBAC from './components/RBAC';
import SettingsDashboard from './pages/settings/SettingsDashboard.jsx';

/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading size="lg" text="Loading..." />
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

/**
 * Public Route Component
 * Redirects to dashboard if user is already authenticated
 */
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading size="lg" text="Loading..." />
      </div>
    );
  }

  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
};

/**
 * Main App Component
 * Sets up routing and authentication
 */

// Smooth scroll for anchor links
if (typeof window !== 'undefined') {
  window.__aurixonScrollBehaviorSet = window.__aurixonScrollBehaviorSet || false;
  if (!window.__aurixonScrollBehaviorSet) {
    window.__aurixonScrollBehaviorSet = true;
    document.documentElement.style.scrollBehavior = 'smooth';
  }
}


import { CSSTransition, TransitionGroup } from 'react-transition-group';
import './pageTransitions.css';
import React, { useRef } from 'react';

function AnimatedRoutes() {
  const location = useLocation();
  const nodeRef = useRef(null);
  return (
    <TransitionGroup component={null}>
      <CSSTransition
        key={location.pathname}
        classNames="fade-slide"
        timeout={350}
        nodeRef={nodeRef}
      >
        <div ref={nodeRef} className="page-transition-wrapper">
          <Routes location={location}>
            {/* Public Routes */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              }
            />
            <Route
              path="/forgot-password"
              element={
                <PublicRoute>
                  <ForgotPasswordPage />
                </PublicRoute>
              }
            />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <MainLayout>
                      <DashboardPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            {/* Activities Routes */}
            <Route
              path="/reports/:periodId/activities"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <ActivitiesChecklistPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/activities"
              element={<Navigate to="/reporting-periods" replace />}
            />
            <Route
              path="/reports/:periodId/activities/:activityType"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <ActivitiesListPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/activities/:activityType/add"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <AddActivityPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/activities/:activityType/:activityId"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <ActivityDetailsPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/activities/:activityType/:activityId/edit"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <AddActivityPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            {/* Reports Routes */}
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <ReportsListPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/history"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <ReportHistoryPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/generate"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <GenerateReportPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports/:reportId"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <ReportViewerPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            {/* Settings Routes */}
            <Route
              path="/setup"
              element={
                <ProtectedRoute>
                  <BoundaryQuestionsWizard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/*"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <SettingsDashboard />
                  </MainLayout>
                </ProtectedRoute>
              }
            >
              <Route path="company" element={<CompanySettingsPage />} />
              <Route path="users" element={<UserManagementPage />} />
              <Route path="profile" element={<ProfileSettingsPage />} />
              {/* More settings subroutes will be added here */}
            </Route>
            <Route
              path="/settings/boundary"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <BoundarySettingsPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/reporting-periods"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <ReportingPeriodsPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            <Route
              path="/settings/boundary/:periodId"
              element={
                <ProtectedRoute>
                  <BoundaryQuestionsWizard />
                </ProtectedRoute>
              }
            />
            
            {/* Help Page */}
            <Route
              path="/help"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <HelpPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            {/* Admin Dashboard */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <AdminDashboardPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            {/* Error Routes */}
            <Route
              path="/unauthorized"
              element={
                <MainLayout>
                  <UnauthorizedPage />
                </MainLayout>
              }
            />

            {/* Public Landing Page */}
            <Route
              path="/"
              element={
                <PublicRoute>
                  <LandingPage />
                </PublicRoute>
              }
            />

            {/* 404 Route */}
            <Route
              path="*"
              element={
                <MainLayout>
                  <div className="container-custom py-16 text-center">
                    <h1 className="text-4xl font-bold text-midnight-navy mb-4">404</h1>
                    <p className="text-gray-600 mb-8">Page not found</p>
                    <a href="/" className="btn-primary">
                      Go Home
                    </a>
                  </div>
                </MainLayout>
              }
            />
          </Routes>
        </div>
      </CSSTransition>
    </TransitionGroup>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1f2937',
              color: '#f9fafb',
              border: '1px solid #374151',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#f9fafb',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#f9fafb',
              },
            },
          }}
        />
        <ToastProvider>
          <AnimatedRoutes />
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

