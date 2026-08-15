import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import ProtectedRoute from './components/common/ProtectedRoute';
import LoadingSpinner from './components/common/LoadingSpinner';
import Login from './pages/Login';
import Register from './pages/Register';
import StudentDashboard from './pages/StudentDashboard';
import AdvisorDashboard from './pages/AdvisorDashboard';
import InstructorDashboard from './pages/InstructorDashboard';
import StudentProfile from './pages/StudentProfile';
import Alerts from './pages/Alerts';

function Home() {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner full />;
  if (!user) return <Navigate to="/login" replace />;

  if (user.role === 'student') return <StudentDashboard />;
  if (user.role === 'advisor') return <AdvisorDashboard />;
  if (user.role === 'instructor') return <InstructorDashboard />;
  return <AdvisorDashboard />;
}

export default function App() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen">
      <a href="#main-content" className="sr-only-focusable">
        Skip to main content
      </a>
      {user && <Navbar />}
      {/* tabIndex=-1 lets the skip link (and any programmatic focus) actually land here —
          without it, activating an in-page #hash link scrolls the target into view but
          leaves keyboard/screen-reader focus stuck on <body>. */}
      <main id="main-content" tabIndex={-1} className="focus:outline-none">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />
          <Route
            path="/students/:id"
            element={
              <ProtectedRoute roles={['advisor', 'instructor', 'admin']}>
                <StudentProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/alerts"
            element={
              <ProtectedRoute roles={['advisor', 'instructor', 'admin']}>
                <Alerts />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
