import { motion } from 'framer-motion';
import {
  Home,
  User,
  Sparkles,
  MessageCircle,
  Clock,
  Image,
  Shield,
  Settings,
  LogIn,
  LogOut,
  Menu,
  X,
  Film,
  Users
} from 'lucide-react';
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import api from '../services/api';

const navItems = [
  { id: 'landing', label: 'Home', icon: Home, requiresAuth: false, guestOnly: true },
  { id: 'persona', label: 'My Persona', icon: User, requiresAuth: true, userOnly: true },
  { id: 'family-tree', label: 'Family Tree', icon: Users, requiresAuth: true, userOnly: true },
  { id: 'echo-sim', label: 'Echo Sim', icon: Sparkles, requiresAuth: true, userOnly: true },
  { id: 'memory-anchor', label: 'Memories', icon: Image, requiresAuth: true, userOnly: true },
  { id: 'wisdom-gpt', label: 'Wisdom GPT', icon: MessageCircle, requiresAuth: true, userOnly: true },
  { id: 'time-capsule', label: 'Time Capsule', icon: Clock, requiresAuth: true, userOnly: true },
  { id: 'settings', label: 'Settings', icon: Settings, requiresAuth: true, userOnly: true },
  { id: 'admin', label: 'Dashboard', icon: Shield, requiresAuth: true, adminOnly: true },
];

export function Navigation({ currentPage, onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, resetAll } = useApp();

  const isAdmin = user?.role === 'ADMIN';

  const filteredItems = navItems.filter(item => {
    // Guest-only items - hide when logged in
    if (item.guestOnly && user) return false;
    // Admin-only items - only show to admins
    if (item.adminOnly && !isAdmin) return false;
    // User-only items - hide from admins
    if (item.userOnly && isAdmin) return false;
    // Auth required items
    if (item.requiresAuth && !user) return false;
    return true;
  });

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // Ignore logout errors
    }
    // Close mobile menu immediately
    setIsOpen(false);
    // Reset state first, then navigate to avoid GuestRoute redirect conflicts
    resetAll();
    // Small delay to ensure state is cleared before navigation
    setTimeout(() => {
      onNavigate('landing');
    }, 50);
  };

  return (
    <>
      <motion.nav
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="fixed top-0 left-0 right-0 z-50 bg-navy/90 backdrop-blur-lg border-b border-gold/10"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <motion.div
              className="flex items-center cursor-pointer"
              onClick={() => onNavigate('landing')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-navy" />
              </div>
              <span className="ml-3 text-xl font-serif text-cream">EchoTrail</span>
            </motion.div>

            <div className="hidden md:flex items-center space-x-1">
              {filteredItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPage === item.id;
                return (
                  <motion.button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-gold/20 text-gold'
                        : item.adminOnly
                        ? 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/10'
                        : 'text-cream/70 hover:text-cream hover:bg-navy-light/50'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </motion.button>
                );
              })}

              {!user ? (
                <motion.button
                  onClick={() => onNavigate('login')}
                  className="flex items-center px-4 py-2 rounded-lg text-sm font-medium text-gold hover:bg-gold/10 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <LogIn className="w-4 h-4 mr-2" />
                  Sign In
                </motion.button>
              ) : (
                <motion.button
                  onClick={handleLogout}
                  className="flex items-center px-4 py-2 rounded-lg text-sm font-medium text-cream/50 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </motion.button>
              )}
            </div>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden p-2 text-cream/70 hover:text-cream"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </motion.nav>

      <motion.div
        initial={false}
        animate={{
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0
        }}
        className="fixed top-16 left-0 right-0 z-40 bg-navy/95 backdrop-blur-lg md:hidden overflow-hidden"
      >
        <div className="px-4 py-4 space-y-2">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onNavigate(item.id);
                  setIsOpen(false);
                }}
                className={`flex items-center w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-gold/20 text-gold'
                    : item.adminOnly
                    ? 'text-purple-400 hover:text-purple-300 hover:bg-purple-500/10'
                    : 'text-cream/70 hover:text-cream hover:bg-navy-light/50'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </button>
            );
          })}

          {!user ? (
            <button
              onClick={() => {
                onNavigate('login');
                setIsOpen(false);
              }}
              className="flex items-center w-full px-4 py-3 rounded-lg text-sm font-medium text-gold hover:bg-gold/10 transition-colors"
            >
              <LogIn className="w-5 h-5 mr-3" />
              Sign In
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-3 rounded-lg text-sm font-medium text-cream/50 hover:text-red-400 hover:bg-red-400/10 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Logout
            </button>
          )}
        </div>
      </motion.div>

      <div className="h-16" />
    </>
  );
}
