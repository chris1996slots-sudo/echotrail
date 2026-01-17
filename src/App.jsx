import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AppProvider, useApp } from './context/AppContext';
import { Navigation } from './components/Navigation';
import { LandingPage } from './pages/LandingPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { PersonaPage } from './pages/PersonaPage';
import { FamilyTreePage } from './pages/FamilyTreePage';
import { EchoSimPage } from './pages/EchoSimPage';
import { MemoryAnchorPage } from './pages/MemoryAnchorPage';
import { WisdomGPTPage } from './pages/WisdomGPTPage';
import { TimeCapsulePage } from './pages/TimeCapsulePage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { LoginPage } from './pages/LoginPage';
import { VideoArchivePage } from './pages/VideoArchivePage';
import { SupportChat } from './components/SupportChat';

// Protected route wrapper for user pages
function UserRoute({ children }) {
  const { user } = useApp();
  const isAdmin = user?.role === 'ADMIN';

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return children;
}

// Protected route wrapper for admin pages
function AdminRoute({ children }) {
  const { user } = useApp();
  const isAdmin = user?.role === 'ADMIN';

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return <Navigate to="/persona" replace />;
  }

  return children;
}

// Guest only route (redirect if logged in)
function GuestRoute({ children }) {
  const { user } = useApp();
  const isAdmin = user?.role === 'ADMIN';

  if (user) {
    return <Navigate to={isAdmin ? '/admin' : '/persona'} replace />;
  }

  return children;
}

function AppContent() {
  const { user } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation handler for components that still use onNavigate
  const handleNavigate = (page, tab) => {
    const routes = {
      'landing': '/',
      'login': '/login',
      'onboarding': '/register',
      'persona': '/persona',
      'family-tree': '/family-tree',
      'echo-sim': '/echo-sim',
      'video-archive': '/video-archive',
      'memory-anchor': '/memories',
      'wisdom-gpt': '/wisdom',
      'time-capsule': '/time-capsule',
      'settings': '/settings',
      'admin': '/admin',
    };

    const route = routes[page] || '/';

    // If tab is provided, navigate with state
    if (tab) {
      navigate(route, { state: { tab } });
    } else {
      navigate(route);
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Get current page name from path for Navigation component
  const getCurrentPage = () => {
    const pathMap = {
      '/': 'landing',
      '/login': 'login',
      '/register': 'onboarding',
      '/persona': 'persona',
      '/family-tree': 'family-tree',
      '/echo-sim': 'echo-sim',
      '/video-archive': 'video-archive',
      '/memories': 'memory-anchor',
      '/wisdom': 'wisdom-gpt',
      '/time-capsule': 'time-capsule',
      '/settings': 'settings',
      '/admin': 'admin',
    };
    // Check for admin sub-routes
    if (location.pathname.startsWith('/admin')) {
      return 'admin';
    }
    return pathMap[location.pathname] || 'landing';
  };

  const currentPage = getCurrentPage();
  const showNavigation = !['/register', '/login'].includes(location.pathname);

  return (
    <div className="min-h-screen bg-navy">
      {showNavigation && (
        <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
      )}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          {/* Public routes */}
          <Route path="/" element={
            <GuestRoute>
              <LandingPage onNavigate={handleNavigate} />
            </GuestRoute>
          } />

          {/* Auth routes */}
          <Route path="/login" element={
            <GuestRoute>
              <LoginPage onNavigate={handleNavigate} />
            </GuestRoute>
          } />
          <Route path="/register" element={
            <GuestRoute>
              <OnboardingPage onNavigate={handleNavigate} />
            </GuestRoute>
          } />

          {/* User routes */}
          <Route path="/persona" element={
            <UserRoute>
              <PersonaPage onNavigate={handleNavigate} />
            </UserRoute>
          } />
          <Route path="/family-tree" element={
            <UserRoute>
              <FamilyTreePage onNavigate={handleNavigate} />
            </UserRoute>
          } />
          <Route path="/echo-sim" element={
            <UserRoute>
              <EchoSimPage onNavigate={handleNavigate} />
            </UserRoute>
          } />
          <Route path="/video-archive" element={
            <UserRoute>
              <VideoArchivePage />
            </UserRoute>
          } />
          <Route path="/memories" element={
            <UserRoute>
              <MemoryAnchorPage onNavigate={handleNavigate} />
            </UserRoute>
          } />
          <Route path="/wisdom" element={
            <UserRoute>
              <WisdomGPTPage onNavigate={handleNavigate} />
            </UserRoute>
          } />
          <Route path="/time-capsule" element={
            <UserRoute>
              <TimeCapsulePage onNavigate={handleNavigate} />
            </UserRoute>
          } />
          <Route path="/settings" element={
            <UserRoute>
              <SettingsPage onNavigate={handleNavigate} />
            </UserRoute>
          } />

          {/* Admin routes - with sub-routes for each tab */}
          <Route path="/admin" element={
            <AdminRoute>
              <AdminDashboard onNavigate={handleNavigate} />
            </AdminRoute>
          } />
          <Route path="/admin/:tab" element={
            <AdminRoute>
              <AdminDashboard onNavigate={handleNavigate} />
            </AdminRoute>
          } />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
      <SupportChat />
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
