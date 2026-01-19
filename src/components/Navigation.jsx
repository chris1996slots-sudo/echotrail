import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  User,
  Sparkles,
  Clock,
  Image,
  Shield,
  Settings,
  LogIn,
  LogOut,
  Menu,
  X,
  Users,
  ChevronDown,
  Target,
  Video,
  Zap,
  Gamepad2
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import { NotificationBell } from './NotificationBell';

const navItems = [
  { id: 'landing', label: 'Home', icon: Home, requiresAuth: false, guestOnly: true },
  { id: 'persona', label: 'My Persona', icon: User, requiresAuth: true, userOnly: true },
  { id: 'echo-sim', label: 'Echo Sim', icon: Sparkles, requiresAuth: true, userOnly: true },
  {
    id: 'experiences',
    label: 'Experiences',
    icon: Zap,
    requiresAuth: true,
    userOnly: true,
    isDropdown: true,
    children: [
      { id: 'memory-anchor', label: 'Memories', icon: Image },
      { id: 'echo-timeline', label: 'Echo Timeline', icon: Target },
      { id: 'echo-duet', label: 'Echo Duet', icon: Video },
      { id: 'wisdom-cards', label: 'Wisdom Cards', icon: Sparkles },
      { id: 'echo-games', label: 'Echo Games', icon: Gamepad2 },
    ]
  },
  { id: 'family-tree', label: 'Family Tree', icon: Users, requiresAuth: true, userOnly: true },
  { id: 'time-capsule', label: 'Time Capsule', icon: Clock, requiresAuth: true, userOnly: true },
  { id: 'settings', label: 'Settings', icon: Settings, requiresAuth: true, userOnly: true },
  { id: 'admin', label: 'Dashboard', icon: Shield, requiresAuth: true, adminOnly: true },
];

export function Navigation({ currentPage, onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);
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

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const isChildActive = (item) => {
    if (!item.children) return false;
    return item.children.some(child => child.id === currentPage);
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
                const isActive = currentPage === item.id || isChildActive(item);

                // Dropdown item
                if (item.isDropdown) {
                  return (
                    <div key={item.id} className="relative" ref={dropdownRef}>
                      <motion.button
                        onClick={() => setOpenDropdown(openDropdown === item.id ? null : item.id)}
                        className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-gold/20 text-gold'
                            : 'text-cream/70 hover:text-cream hover:bg-navy-light/50'
                        }`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        {item.label}
                        <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${
                          openDropdown === item.id ? 'rotate-180' : ''
                        }`} />
                      </motion.button>

                      {/* Dropdown Menu */}
                      <AnimatePresence>
                        {openDropdown === item.id && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="absolute top-full mt-2 right-0 w-56 bg-navy-dark/95 backdrop-blur-lg border border-gold/20 rounded-xl shadow-2xl overflow-hidden"
                          >
                            {item.children.map((child) => {
                              const ChildIcon = child.icon;
                              const isChildPageActive = currentPage === child.id;
                              return (
                                <motion.button
                                  key={child.id}
                                  onClick={() => {
                                    onNavigate(child.id);
                                    setOpenDropdown(null);
                                  }}
                                  className={`flex items-center w-full px-4 py-3 text-sm font-medium transition-colors ${
                                    isChildPageActive
                                      ? 'bg-gold/20 text-gold'
                                      : 'text-cream/70 hover:text-cream hover:bg-navy-light/50'
                                  }`}
                                  whileHover={{ x: 4 }}
                                >
                                  <ChildIcon className="w-4 h-4 mr-3" />
                                  {child.label}
                                </motion.button>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                }

                // Regular item
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

              {/* Notification Bell - Only for logged in users */}
              {user && <NotificationBell />}

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

      {/* Mobile Menu */}
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
            const isActive = currentPage === item.id || isChildActive(item);

            // Dropdown item for mobile
            if (item.isDropdown) {
              return (
                <div key={item.id}>
                  <button
                    onClick={() => setOpenDropdown(openDropdown === item.id ? null : item.id)}
                    className={`flex items-center justify-between w-full px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-gold/20 text-gold'
                        : 'text-cream/70 hover:text-cream hover:bg-navy-light/50'
                    }`}
                  >
                    <div className="flex items-center">
                      <Icon className="w-5 h-5 mr-3" />
                      {item.label}
                    </div>
                    <ChevronDown className={`w-4 h-4 transition-transform ${
                      openDropdown === item.id ? 'rotate-180' : ''
                    }`} />
                  </button>

                  {/* Mobile Dropdown Content */}
                  <AnimatePresence>
                    {openDropdown === item.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="ml-4 mt-2 space-y-1 overflow-hidden"
                      >
                        {item.children.map((child) => {
                          const ChildIcon = child.icon;
                          const isChildPageActive = currentPage === child.id;
                          return (
                            <button
                              key={child.id}
                              onClick={() => {
                                onNavigate(child.id);
                                setIsOpen(false);
                                setOpenDropdown(null);
                              }}
                              className={`flex items-center w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                isChildPageActive
                                  ? 'bg-gold/20 text-gold'
                                  : 'text-cream/60 hover:text-cream hover:bg-navy-light/30'
                              }`}
                            >
                              <ChildIcon className="w-4 h-4 mr-3" />
                              {child.label}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            }

            // Regular item for mobile
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
