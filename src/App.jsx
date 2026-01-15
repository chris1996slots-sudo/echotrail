import { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { AppProvider, useApp } from './context/AppContext';
import { Navigation } from './components/Navigation';
import { LandingPage } from './pages/LandingPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { PersonaPage } from './pages/PersonaPage';
import { EchoSimPage } from './pages/EchoSimPage';
import { MemoryAnchorPage } from './pages/MemoryAnchorPage';
import { WisdomGPTPage } from './pages/WisdomGPTPage';
import { TimeCapsulePage } from './pages/TimeCapsulePage';
import { SettingsPage } from './pages/SettingsPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { LoginPage } from './pages/LoginPage';
import { SupportChat } from './components/SupportChat';

function AppContent() {
  const { user } = useApp();
  const isAdmin = user?.role === 'ADMIN';
  const userPages = ['persona', 'echo-sim', 'memory-anchor', 'wisdom-gpt', 'time-capsule', 'settings'];
  const adminPages = ['admin'];

  // Set initial page based on user state at mount time
  const [currentPage, setCurrentPage] = useState(() => {
    if (user) {
      return isAdmin ? 'admin' : 'persona';
    }
    return 'landing';
  });

  // Track previous user state to detect login/logout
  const prevUserRef = useRef(user);

  useEffect(() => {
    const prevUser = prevUserRef.current;
    prevUserRef.current = user;

    // User just logged in (was null, now has value)
    if (!prevUser && user) {
      // Use setTimeout to defer state update and avoid React render conflict
      setTimeout(() => {
        setCurrentPage(isAdmin ? 'admin' : 'persona');
      }, 0);
      return;
    }

    // User just logged out (had value, now null)
    if (prevUser && !user) {
      setTimeout(() => {
        setCurrentPage('landing');
      }, 0);
      return;
    }
  }, [user, isAdmin]);

  const handleNavigate = (page) => {
    const authRequiredPages = [...userPages, ...adminPages];

    // Not logged in - redirect to appropriate auth page
    if (authRequiredPages.includes(page) && !user) {
      setCurrentPage('onboarding');
      return;
    }

    // Admin trying to access user pages - redirect to admin
    if (userPages.includes(page) && isAdmin) {
      setCurrentPage('admin');
      return;
    }

    // Non-admin trying to access admin pages - redirect to persona
    if (adminPages.includes(page) && !isAdmin) {
      setCurrentPage('persona');
      return;
    }

    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'landing':
        return <LandingPage onNavigate={handleNavigate} />;
      case 'onboarding':
        return <OnboardingPage onNavigate={handleNavigate} />;
      case 'login':
        return <LoginPage onNavigate={handleNavigate} />;
      case 'persona':
        return <PersonaPage onNavigate={handleNavigate} />;
      case 'echo-sim':
        return <EchoSimPage onNavigate={handleNavigate} />;
      case 'memory-anchor':
        return <MemoryAnchorPage onNavigate={handleNavigate} />;
      case 'wisdom-gpt':
        return <WisdomGPTPage onNavigate={handleNavigate} />;
      case 'time-capsule':
        return <TimeCapsulePage onNavigate={handleNavigate} />;
      case 'settings':
        return <SettingsPage onNavigate={handleNavigate} />;
      case 'admin':
        return <AdminDashboard onNavigate={handleNavigate} />;
      default:
        return <LandingPage onNavigate={handleNavigate} />;
    }
  };

  const showNavigation = !['onboarding', 'login'].includes(currentPage);

  return (
    <div className="min-h-screen bg-navy">
      {showNavigation && (
        <Navigation currentPage={currentPage} onNavigate={handleNavigate} />
      )}
      <AnimatePresence mode="wait">
        <div key={currentPage}>
          {renderPage()}
        </div>
      </AnimatePresence>
      <SupportChat />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
