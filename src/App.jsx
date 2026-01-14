import { useState, useEffect } from 'react';
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
import { AdminDashboard } from './pages/AdminDashboard';
import { LoginPage } from './pages/LoginPage';
import { SupportChat } from './components/SupportChat';

function AppContent() {
  const { user } = useApp();
  const isAdmin = user?.role === 'ADMIN';
  const userPages = ['persona', 'echo-sim', 'memory-anchor', 'wisdom-gpt', 'time-capsule'];
  const adminPages = ['admin'];

  // Set initial page based on user state at mount time
  const [currentPage, setCurrentPage] = useState(() => {
    if (user) {
      return isAdmin ? 'admin' : 'persona';
    }
    return 'landing';
  });

  useEffect(() => {
    // Redirect when user logs in (from login/onboarding page)
    if (user && (currentPage === 'landing' || currentPage === 'login' || currentPage === 'onboarding')) {
      setCurrentPage(isAdmin ? 'admin' : 'persona');
    }
    // Redirect when user logs out
    if (!user && [...userPages, ...adminPages].includes(currentPage)) {
      setCurrentPage('landing');
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
