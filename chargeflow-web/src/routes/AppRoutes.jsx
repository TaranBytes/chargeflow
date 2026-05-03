import { Routes, Route, Navigate } from 'react-router-dom'
import AppLayout from '../layouts/AppLayout.jsx'
import ProtectedRoute from './ProtectedRoute.jsx'
import LoginPage from '../pages/LoginPage.jsx'
import SignupPage from '../pages/SignupPage.jsx'
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

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
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
      <Route path="/logout" element={<LogoutPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
