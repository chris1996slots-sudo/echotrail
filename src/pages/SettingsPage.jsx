import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Mail,
  Lock,
  Bell,
  Shield,
  Trash2,
  LogOut,
  ChevronRight,
  Check,
  X,
  Eye,
  EyeOff,
  AlertTriangle,
  CreditCard,
  Crown,
  Coins,
  Sparkles,
  Zap,
  Star
} from 'lucide-react';
import { PageTransition, FadeIn } from '../components/PageTransition';
import { useApp } from '../context/AppContext';
import api from '../services/api';

export function SettingsPage({ onNavigate }) {
  const { user, setUser, resetAll } = useApp();
  const [activeSection, setActiveSection] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Form states
  const [profileForm, setProfileForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [notifications, setNotifications] = useState({
    emailUpdates: true,
    timeCapsuleReminders: true,
    weeklyDigest: false,
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showTokensModal, setShowTokensModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedTokens, setSelectedTokens] = useState(null);

  // Subscription plans
  const subscriptionPlans = [
    {
      id: 'FREE',
      name: 'Free',
      price: 0,
      features: [
        '2 Memory Anchors',
        '3 Time Capsules',
        'Basic Echo Sim',
        'Browser voice only',
      ],
      current: user?.subscription === 'FREE',
    },
    {
      id: 'STANDARD',
      name: 'Standard',
      price: 9.99,
      features: [
        '5 Memory Anchors',
        '10 Time Capsules',
        'Full Echo Sim',
        'Voice cloning (5 samples)',
        '100 AI tokens/month',
      ],
      current: user?.subscription === 'STANDARD',
      popular: true,
    },
    {
      id: 'PREMIUM',
      name: 'Premium',
      price: 24.99,
      features: [
        'Unlimited Memory Anchors',
        'Unlimited Time Capsules',
        'Priority Echo Sim',
        'Unlimited voice samples',
        'Unlimited AI tokens',
        'Priority support',
        'Custom avatar styles',
      ],
      current: user?.subscription === 'PREMIUM',
    },
  ];

  // Token packages
  const tokenPackages = [
    { id: 'small', tokens: 50, price: 4.99, popular: false },
    { id: 'medium', tokens: 150, price: 9.99, popular: true, bonus: '+25 bonus' },
    { id: 'large', tokens: 500, price: 24.99, popular: false, bonus: '+100 bonus' },
    { id: 'xl', tokens: 1000, price: 39.99, popular: false, bonus: '+250 bonus' },
  ];

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleUpdateProfile = async () => {
    if (!profileForm.firstName.trim() || !profileForm.lastName.trim()) {
      showMessage('Please fill in all fields', 'error');
      return;
    }

    setIsLoading(true);
    try {
      // API call would go here
      setUser(prev => ({
        ...prev,
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
      }));
      showMessage('Profile updated successfully');
      setActiveSection(null);
    } catch (error) {
      showMessage('Failed to update profile', 'error');
    }
    setIsLoading(false);
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      showMessage('Please fill in all password fields', 'error');
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showMessage('New passwords do not match', 'error');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      showMessage('Password must be at least 8 characters', 'error');
      return;
    }

    setIsLoading(true);
    try {
      // API call would go here
      showMessage('Password changed successfully');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setActiveSection(null);
    } catch (error) {
      showMessage('Failed to change password', 'error');
    }
    setIsLoading(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      showMessage('Please type DELETE to confirm', 'error');
      return;
    }

    setIsLoading(true);
    try {
      // API call would go here to delete account
      await api.logout();
      resetAll();
      onNavigate('landing');
    } catch (error) {
      showMessage('Failed to delete account', 'error');
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch (e) {
      // Ignore logout errors
    }
    resetAll();
    onNavigate('landing');
  };

  const settingsSections = [
    {
      id: 'subscription',
      icon: Crown,
      title: 'Subscription',
      description: `Current plan: ${user?.subscription || 'FREE'}`,
      highlight: true,
    },
    {
      id: 'tokens',
      icon: Coins,
      title: 'AI Tokens',
      description: 'Purchase tokens for AI features',
      highlight: true,
    },
    {
      id: 'profile',
      icon: User,
      title: 'Profile Information',
      description: 'Update your name and personal details',
    },
    {
      id: 'password',
      icon: Lock,
      title: 'Change Password',
      description: 'Update your account password',
    },
    {
      id: 'notifications',
      icon: Bell,
      title: 'Notifications',
      description: 'Manage email and notification preferences',
    },
    {
      id: 'privacy',
      icon: Shield,
      title: 'Privacy & Security',
      description: 'Control your data and privacy settings',
    },
    {
      id: 'delete',
      icon: Trash2,
      title: 'Delete Account',
      description: 'Permanently delete your account and data',
      danger: true,
    },
  ];

  return (
    <PageTransition className="min-h-screen bg-gradient-to-b from-navy via-navy to-navy-dark">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <FadeIn>
          <div className="mb-8">
            <h1 className="text-3xl font-serif text-cream mb-2">Settings</h1>
            <p className="text-cream/50">Manage your account and preferences</p>
          </div>
        </FadeIn>

        {/* Message Toast */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-lg shadow-lg ${
              message.type === 'error' ? 'bg-red-500/90' : 'bg-green-500/90'
            } text-white flex items-center gap-2`}
          >
            {message.type === 'error' ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            {message.text}
          </motion.div>
        )}

        {/* User Info Card */}
        <FadeIn delay={0.1}>
          <div className="glass-card p-6 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center">
                <span className="text-2xl font-serif text-navy">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
              <div>
                <h2 className="text-xl font-medium text-cream">
                  {user?.firstName} {user?.lastName}
                </h2>
                <p className="text-cream/50">{user?.email}</p>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Settings Sections */}
        <FadeIn delay={0.2}>
          <div className="space-y-3">
            {settingsSections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;

              return (
                <motion.div
                  key={section.id}
                  className={`glass-card overflow-hidden ${
                    section.danger ? 'border-red-500/30' : section.highlight ? 'border-gold/30' : ''
                  }`}
                >
                  <button
                    onClick={() => setActiveSection(isActive ? null : section.id)}
                    className={`w-full p-4 flex items-center justify-between transition-colors ${
                      section.danger
                        ? 'hover:bg-red-500/10'
                        : section.highlight
                        ? 'hover:bg-gold/10'
                        : 'hover:bg-navy-light/30'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        section.danger
                          ? 'bg-red-500/20 text-red-400'
                          : section.highlight
                          ? 'bg-gold/20 text-gold'
                          : 'bg-gold/10 text-gold'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <h3 className={`font-medium ${
                          section.danger ? 'text-red-400' : section.highlight ? 'text-gold' : 'text-cream'
                        }`}>
                          {section.title}
                        </h3>
                        <p className="text-sm text-cream/50">{section.description}</p>
                      </div>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-cream/40 transition-transform ${
                      isActive ? 'rotate-90' : ''
                    }`} />
                  </button>

                  {/* Expanded Content */}
                  {isActive && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-white/5 p-4"
                    >
                      {section.id === 'subscription' && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {subscriptionPlans.map((plan) => (
                              <motion.div
                                key={plan.id}
                                className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer ${
                                  plan.current
                                    ? 'border-gold bg-gold/10'
                                    : selectedPlan === plan.id
                                    ? 'border-gold/50 bg-gold/5'
                                    : 'border-gold/20 hover:border-gold/40'
                                }`}
                                onClick={() => !plan.current && setSelectedPlan(plan.id)}
                                whileHover={{ scale: plan.current ? 1 : 1.02 }}
                              >
                                {plan.popular && (
                                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-gold rounded-full">
                                    <span className="text-navy text-xs font-medium">Popular</span>
                                  </div>
                                )}
                                {plan.current && (
                                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-green-500 rounded-full">
                                    <span className="text-white text-xs font-medium">Current</span>
                                  </div>
                                )}
                                <div className="text-center mb-4 pt-2">
                                  <h4 className="text-lg font-medium text-cream">{plan.name}</h4>
                                  <div className="mt-2">
                                    <span className="text-3xl font-bold text-gold">${plan.price}</span>
                                    <span className="text-cream/50 text-sm">/month</span>
                                  </div>
                                </div>
                                <ul className="space-y-2">
                                  {plan.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-center gap-2 text-sm text-cream/70">
                                      <Check className="w-4 h-4 text-gold flex-shrink-0" />
                                      {feature}
                                    </li>
                                  ))}
                                </ul>
                              </motion.div>
                            ))}
                          </div>
                          {selectedPlan && selectedPlan !== user?.subscription && (
                            <motion.button
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="w-full btn-primary flex items-center justify-center gap-2"
                              onClick={() => {
                                showMessage('Payment integration coming soon!');
                                setSelectedPlan(null);
                              }}
                            >
                              <CreditCard className="w-4 h-4" />
                              Upgrade to {subscriptionPlans.find(p => p.id === selectedPlan)?.name}
                            </motion.button>
                          )}
                        </div>
                      )}

                      {section.id === 'tokens' && (
                        <div className="space-y-4">
                          <div className="p-4 rounded-xl bg-navy-dark/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center">
                                <Coins className="w-6 h-6 text-gold" />
                              </div>
                              <div>
                                <p className="text-cream/50 text-sm">Your Balance</p>
                                <p className="text-2xl font-bold text-gold">0 <span className="text-sm font-normal text-cream/50">tokens</span></p>
                              </div>
                            </div>
                            <Sparkles className="w-8 h-8 text-gold/30" />
                          </div>

                          <p className="text-cream/60 text-sm text-center">
                            AI tokens are used for voice cloning, avatar generation, and WisdomGPT conversations.
                          </p>

                          <div className="grid grid-cols-2 gap-3">
                            {tokenPackages.map((pkg) => (
                              <motion.div
                                key={pkg.id}
                                className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                                  selectedTokens === pkg.id
                                    ? 'border-gold bg-gold/10'
                                    : 'border-gold/20 hover:border-gold/40'
                                }`}
                                onClick={() => setSelectedTokens(pkg.id)}
                                whileHover={{ scale: 1.02 }}
                              >
                                {pkg.popular && (
                                  <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-gold rounded-full">
                                    <span className="text-navy text-xs font-medium">Best Value</span>
                                  </div>
                                )}
                                <div className="text-center">
                                  <div className="flex items-center justify-center gap-1 mb-1">
                                    <Zap className="w-5 h-5 text-gold" />
                                    <span className="text-2xl font-bold text-cream">{pkg.tokens}</span>
                                  </div>
                                  {pkg.bonus && (
                                    <span className="text-xs text-green-400">{pkg.bonus}</span>
                                  )}
                                  <p className="text-lg font-medium text-gold mt-2">${pkg.price}</p>
                                </div>
                              </motion.div>
                            ))}
                          </div>

                          {selectedTokens && (
                            <motion.button
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="w-full btn-primary flex items-center justify-center gap-2"
                              onClick={() => {
                                showMessage('Payment integration coming soon!');
                                setSelectedTokens(null);
                              }}
                            >
                              <CreditCard className="w-4 h-4" />
                              Buy {tokenPackages.find(p => p.id === selectedTokens)?.tokens} Tokens
                            </motion.button>
                          )}
                        </div>
                      )}

                      {section.id === 'profile' && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm text-cream/70 mb-2">First Name</label>
                            <input
                              type="text"
                              value={profileForm.firstName}
                              onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                              className="input-field w-full"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-cream/70 mb-2">Last Name</label>
                            <input
                              type="text"
                              value={profileForm.lastName}
                              onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                              className="input-field w-full"
                            />
                          </div>
                          <div>
                            <label className="block text-sm text-cream/70 mb-2">Email</label>
                            <input
                              type="email"
                              value={user?.email || ''}
                              disabled
                              className="input-field w-full opacity-50 cursor-not-allowed"
                            />
                            <p className="text-xs text-cream/40 mt-1">Email cannot be changed</p>
                          </div>
                          <button
                            onClick={handleUpdateProfile}
                            disabled={isLoading}
                            className="btn-primary w-full"
                          >
                            {isLoading ? 'Saving...' : 'Save Changes'}
                          </button>
                        </div>
                      )}

                      {section.id === 'password' && (
                        <div className="space-y-4">
                          <div className="relative">
                            <label className="block text-sm text-cream/70 mb-2">Current Password</label>
                            <input
                              type={showPasswords.current ? 'text' : 'password'}
                              value={passwordForm.currentPassword}
                              onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                              className="input-field w-full pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                              className="absolute right-3 top-9 text-cream/40 hover:text-cream/70"
                            >
                              {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          <div className="relative">
                            <label className="block text-sm text-cream/70 mb-2">New Password</label>
                            <input
                              type={showPasswords.new ? 'text' : 'password'}
                              value={passwordForm.newPassword}
                              onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                              className="input-field w-full pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                              className="absolute right-3 top-9 text-cream/40 hover:text-cream/70"
                            >
                              {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          <div className="relative">
                            <label className="block text-sm text-cream/70 mb-2">Confirm New Password</label>
                            <input
                              type={showPasswords.confirm ? 'text' : 'password'}
                              value={passwordForm.confirmPassword}
                              onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                              className="input-field w-full pr-10"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                              className="absolute right-3 top-9 text-cream/40 hover:text-cream/70"
                            >
                              {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                          <button
                            onClick={handleChangePassword}
                            disabled={isLoading}
                            className="btn-primary w-full"
                          >
                            {isLoading ? 'Changing...' : 'Change Password'}
                          </button>
                        </div>
                      )}

                      {section.id === 'notifications' && (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-cream">Email Updates</p>
                              <p className="text-sm text-cream/50">Receive updates about new features</p>
                            </div>
                            <button
                              onClick={() => setNotifications(prev => ({ ...prev, emailUpdates: !prev.emailUpdates }))}
                              className={`w-12 h-6 rounded-full transition-colors ${
                                notifications.emailUpdates ? 'bg-gold' : 'bg-navy-light'
                              }`}
                            >
                              <motion.div
                                className="w-5 h-5 bg-white rounded-full shadow"
                                animate={{ x: notifications.emailUpdates ? 26 : 2 }}
                              />
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-cream">Time Capsule Reminders</p>
                              <p className="text-sm text-cream/50">Get notified when capsules unlock</p>
                            </div>
                            <button
                              onClick={() => setNotifications(prev => ({ ...prev, timeCapsuleReminders: !prev.timeCapsuleReminders }))}
                              className={`w-12 h-6 rounded-full transition-colors ${
                                notifications.timeCapsuleReminders ? 'bg-gold' : 'bg-navy-light'
                              }`}
                            >
                              <motion.div
                                className="w-5 h-5 bg-white rounded-full shadow"
                                animate={{ x: notifications.timeCapsuleReminders ? 26 : 2 }}
                              />
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-cream">Weekly Digest</p>
                              <p className="text-sm text-cream/50">Receive a weekly summary email</p>
                            </div>
                            <button
                              onClick={() => setNotifications(prev => ({ ...prev, weeklyDigest: !prev.weeklyDigest }))}
                              className={`w-12 h-6 rounded-full transition-colors ${
                                notifications.weeklyDigest ? 'bg-gold' : 'bg-navy-light'
                              }`}
                            >
                              <motion.div
                                className="w-5 h-5 bg-white rounded-full shadow"
                                animate={{ x: notifications.weeklyDigest ? 26 : 2 }}
                              />
                            </button>
                          </div>
                        </div>
                      )}

                      {section.id === 'privacy' && (
                        <div className="space-y-4">
                          <div className="p-4 rounded-lg bg-navy-dark/50">
                            <h4 className="text-cream font-medium mb-2">Data Export</h4>
                            <p className="text-sm text-cream/50 mb-3">
                              Download all your data including persona, memories, and time capsules.
                            </p>
                            <button className="btn-secondary text-sm">
                              Request Data Export
                            </button>
                          </div>
                          <div className="p-4 rounded-lg bg-navy-dark/50">
                            <h4 className="text-cream font-medium mb-2">Two-Factor Authentication</h4>
                            <p className="text-sm text-cream/50 mb-3">
                              Add an extra layer of security to your account.
                            </p>
                            <button className="btn-secondary text-sm">
                              Enable 2FA
                            </button>
                          </div>
                        </div>
                      )}

                      {section.id === 'delete' && (
                        <div className="space-y-4">
                          {!showDeleteConfirm ? (
                            <>
                              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                                <div className="flex items-start gap-3">
                                  <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <h4 className="text-red-400 font-medium mb-1">Warning</h4>
                                    <p className="text-sm text-cream/70">
                                      This action cannot be undone. All your data including your persona,
                                      memories, time capsules, and chat history will be permanently deleted.
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <button
                                onClick={() => setShowDeleteConfirm(true)}
                                className="w-full py-3 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                              >
                                I understand, delete my account
                              </button>
                            </>
                          ) : (
                            <>
                              <p className="text-cream/70">
                                To confirm deletion, type <span className="text-red-400 font-mono">DELETE</span> below:
                              </p>
                              <input
                                type="text"
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                placeholder="Type DELETE"
                                className="input-field w-full border-red-500/30"
                              />
                              <div className="flex gap-3">
                                <button
                                  onClick={() => {
                                    setShowDeleteConfirm(false);
                                    setDeleteConfirmText('');
                                  }}
                                  className="flex-1 py-3 rounded-lg bg-navy-light text-cream/70 hover:text-cream transition-colors"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={handleDeleteAccount}
                                  disabled={isLoading || deleteConfirmText !== 'DELETE'}
                                  className="flex-1 py-3 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                                >
                                  {isLoading ? 'Deleting...' : 'Delete Account'}
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </FadeIn>

        {/* Logout Button */}
        <FadeIn delay={0.3}>
          <motion.button
            onClick={handleLogout}
            className="w-full mt-6 p-4 glass-card flex items-center justify-center gap-3 text-cream/70 hover:text-red-400 hover:bg-red-400/10 transition-colors"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </motion.button>
        </FadeIn>

        {/* Version Info */}
        <FadeIn delay={0.4}>
          <p className="text-center text-cream/30 text-xs mt-8">
            EchoTrail v1.0.0
          </p>
        </FadeIn>
      </div>
    </PageTransition>
  );
}
