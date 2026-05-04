import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'
import LoginPage from '../pages/LoginPage.jsx'
import LogoutPage from '../pages/LogoutPage.jsx'
import ForgotPasswordPage from '../pages/ForgotPasswordPage.jsx'
import ResetPasswordPage from '../pages/ResetPasswordPage.jsx'
import MapPage from '../pages/MapPage.jsx'
import StationDetailPage from '../pages/StationDetailPage.jsx'
import BookingPage from '../pages/BookingPage.jsx'
import ActiveSessionPage from '../pages/ActiveSessionPage.jsx'
import BookingsPage from '../pages/BookingsPage.jsx'
import NotificationsPage from '../pages/NotificationsPage.jsx'
import ProfilePage from '../pages/ProfilePage.jsx'
import AdminLoginPage from '../pages/AdminLoginPage.jsx'
import AdminDashboardPage from '../pages/AdminDashboardPage.jsx'
import AdminStationsPage from '../pages/AdminStationsPage.jsx'
import AdminChargersPage from '../pages/AdminChargersPage.jsx'
import AdminSessionsPage from '../pages/AdminSessionsPage.jsx'
import AdminUsersPage from '../pages/AdminUsersPage.jsx'
import AdminRevenuePage from '../pages/AdminRevenuePage.jsx'
import AdminAlertsPage from '../pages/AdminAlertsPage.jsx'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<LoginPage initialAuthOpen initialAuthMode="signup" />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<MapPage />} />
        <Route path="/station/:id" element={<StationDetailPage />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/booking/:chargerId" element={<BookingPage />} />
        <Route path="/session" element={<ActiveSessionPage />} />
        <Route path="/bookings" element={<BookingsPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>
      <Route
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/admin/stations" element={<AdminStationsPage />} />
        <Route path="/admin/chargers" element={<AdminChargersPage />} />
        <Route path="/admin/sessions" element={<AdminSessionsPage />} />
        <Route path="/admin/users" element={<AdminUsersPage />} />
        <Route path="/admin/revenue" element={<AdminRevenuePage />} />
        <Route path="/admin/alerts" element={<AdminAlertsPage />} />
      </Route>
      <Route path="/logout" element={<LogoutPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
