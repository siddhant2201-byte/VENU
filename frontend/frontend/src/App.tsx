import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';
import { SmoothScroll } from './components/SmoothScroll';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Events } from './pages/Events';
import { EventDetails } from './pages/EventDetails';
import { CreateEvent } from './pages/CreateEvent';
import { MyBookings } from './pages/MyBookings';
import { OrganizerAnalytics } from './pages/OrganizerAnalytics';
import { Dashboard } from './pages/Dashboard';
import { AnnouncementsFeedback } from './pages/AnnouncementsFeedback';
import { ShieldAlert } from 'lucide-react';

function App() {
  return (
    <AuthProvider>
      <SmoothScroll>
        <BrowserRouter>
          <div className="min-h-screen bg-[#0A0A0C] text-[#e5e1e4] flex flex-col font-['Plus_Jakarta_Sans']">
            <Navbar />
            <main className="flex-1">
            <Routes>
              <Route path="/" element={<Navigate to="/events" replace />} />
              <Route path="/events" element={<Events />} />
              <Route
                path="/events/:id"
                element={
                  <ProtectedRoute>
                    <EventDetails />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/events/create"
                element={
                  <ProtectedRoute allowedRoles={['ROLE_ORGANIZER', 'ROLE_ADMIN', 'ORGANIZER', 'ADMIN']}>
                    <CreateEvent />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bookings"
                element={
                  <ProtectedRoute>
                    <MyBookings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute allowedRoles={['ROLE_ORGANIZER', 'ROLE_ADMIN', 'ORGANIZER', 'ADMIN']}>
                    <OrganizerAnalytics />
                  </ProtectedRoute>
                }
              />
              <Route path="/announcements" element={<AnnouncementsFeedback />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/unauthorized"
                element={
                  <div className="flex h-[calc(100vh-80px)] items-center justify-center text-center px-4 bg-[#0A0A0C] bg-ambient-radial">
                    <div className="glass-card p-10 max-w-md border border-white/10">
                      <ShieldAlert className="h-10 w-10 text-[#FF3366] mx-auto mb-4" />
                      <h2 className="font-['Outfit'] text-2xl font-bold tracking-tight text-white">
                        Access Denied
                      </h2>
                      <p className="mt-2 font-['Plus_Jakarta_Sans'] text-sm text-[#958ea0]">
                        You do not have permission to view this page.
                      </p>
                    </div>
                  </div>
                }
              />
              <Route path="*" element={<Navigate to="/events" replace />} />
            </Routes>
          </main>
          <Footer />
          </div>
        </BrowserRouter>
      </SmoothScroll>
    </AuthProvider>
  );
}

export default App;
