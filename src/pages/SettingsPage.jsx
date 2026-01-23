import { useState, useEffect } from 'react';
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
  Star,
  Gift,
  Users,
  Copy,
  Share2,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Link,
  Globe,
  Languages
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
    phoneNumber: user?.phoneNumber || '',
    telegramUsername: user?.telegramUsername || '',
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
    // Notification channels
    emailChannel: true,
    whatsappChannel: false,
    telegramChannel: false,
  });

  // Language state
  const [selectedLanguage, setSelectedLanguage] = useState(user?.language || 'en');
  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
  ];

  // Load language from user when available
  useEffect(() => {
    if (user?.language) {
      setSelectedLanguage(user.language);
    }
  }, [user]);

  // Load profile data when user changes
  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        phoneNumber: user.phoneNumber || '',
        telegramUsername: user.telegramUsername || '',
      });
    }
  }, [user]);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [showTokensModal, setShowTokensModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [selectedTokens, setSelectedTokens] = useState(null);

  // Referral state
  const [referralLoading, setReferralLoading] = useState(false);
  const [referralData, setReferralData] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [copied, setCopied] = useState(false);

  // Subscription plans
  const subscriptionPlans = [
    {
      id: 'FREE',
      name: 'Free',
      price: 0,
      features: [
        '2 Memory Anchors',
        '3 Time Capsules',
        'Basic Live Avatar',
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
        'Full Live Avatar',
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
        'Priority Live Avatar',
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

  // Load referral data when section is opened
  const loadReferralData = async () => {
    if (referralData) return; // Already loaded
    try {
      setReferralLoading(true);
      const [myReferral, myReferrals] = await Promise.all([
        api.getMyReferral(),
        api.getMyReferrals()
      ]);
      setReferralData(myReferral);
      setReferrals(myReferrals);
    } catch (error) {
      console.error('Failed to load referral data:', error);
    } finally {
      setReferralLoading(false);
    }
  };

  const copyReferralLink = async () => {
    if (!referralData?.referralCode) return;
    const link = `${window.location.origin}/register?ref=${referralData.referralCode}`;
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleLanguageChange = async (languageCode) => {
    try {
      setIsLoading(true);
      setMessage(null);

      const response = await api.updateLanguage(languageCode);
      setSelectedLanguage(languageCode);
      setUser(response.user);

      setMessage({ type: 'success', text: 'Language updated successfully' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error('Failed to update language:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to update language' });
    } finally {
      setIsLoading(false);
    }
  };

  const shareReferral = async () => {
    if (!referralData?.referralCode) return;
    const link = `${window.location.origin}/register?ref=${referralData.referralCode}`;
    const text = `Join EchoTrail and preserve your legacy! Use my referral link to get bonus tokens: ${link}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Join EchoTrail', text, url: link });
      } catch (error) {
        if (error.name !== 'AbortError') copyReferralLink();
      }
    } else {
      copyReferralLink();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'pending': return 'text-yellow-400';
      case 'expired': return 'text-red-400';
      default: return 'text-cream/50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'pending': return Clock;
      case 'expired': return XCircle;
      default: return Clock;
    }
  };

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
      const response = await api.updateProfile({
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        phoneNumber: profileForm.phoneNumber,
        telegramUsername: profileForm.telegramUsername,
      });
      setUser(response.user);
      showMessage('Profile updated successfully');
      setActiveSection(null);
    } catch (error) {
      showMessage(error.message || 'Failed to update profile', 'error');
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

  // Grouped settings sections
  const settingsGroups = [
    {
      id: 'billing',
      title: 'Billing & Rewards',
      icon: CreditCard,
      color: 'gold',
      sections: [
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
          id: 'referral',
          icon: Gift,
          title: 'Referral Program',
          description: 'Invite friends and earn rewards',
          highlight: true,
        },
      ],
    },
    {
      id: 'account',
      title: 'Account',
      icon: User,
      color: 'blue',
      sections: [
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
      ],
    },
    {
      id: 'preferences',
      title: 'Preferences',
      icon: Bell,
      color: 'purple',
      sections: [
        {
          id: 'notifications',
          icon: Bell,
          title: 'Notifications',
          description: 'Manage email and notification preferences',
        },
        {
          id: 'language',
          icon: Globe,
          title: 'Language',
          description: 'Change the app language',
          disabled: true,
        },
      ],
    },
    {
      id: 'security',
      title: 'Security & Privacy',
      icon: Shield,
      color: 'green',
      sections: [
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
      ],
    },
  ];

  // Flat list for backwards compatibility
  const settingsSections = settingsGroups.flatMap(g => g.sections);

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

        {/* Settings Sections - Grouped */}
        <FadeIn delay={0.2}>
          <div className="space-y-6">
            {settingsGroups.map((group, groupIndex) => {
              const GroupIcon = group.icon;
              const colorClasses = {
                gold: 'text-gold border-gold/30 bg-gold/5',
                blue: 'text-blue-400 border-blue-500/30 bg-blue-500/5',
                purple: 'text-purple-400 border-purple-500/30 bg-purple-500/5',
                green: 'text-green-400 border-green-500/30 bg-green-500/5',
              };

              return (
                <div key={group.id}>
                  {/* Group Header */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${colorClasses[group.color]}`}>
                      <GroupIcon className="w-4 h-4" />
                    </div>
                    <h2 className={`text-sm font-medium uppercase tracking-wider ${colorClasses[group.color].split(' ')[0]}`}>
                      {group.title}
                    </h2>
                  </div>

                  {/* Group Items */}
                  <div className="space-y-2">
                    {group.sections.map((section) => {
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
                            onClick={() => {
                              if (section.disabled) return;
                              const newSection = isActive ? null : section.id;
                              setActiveSection(newSection);
                              if (newSection === 'referral') loadReferralData();
                            }}
                            className={`w-full p-4 flex items-center justify-between transition-colors ${
                              section.disabled
                                ? 'cursor-not-allowed opacity-60'
                                : section.danger
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
                                  : 'bg-cream/10 text-cream/70'
                              }`}>
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="text-left">
                                <div className="flex items-center gap-2">
                                  <h3 className={`font-medium ${
                                    section.danger ? 'text-red-400' : section.highlight ? 'text-gold' : 'text-cream'
                                  }`}>
                                    {section.title}
                                  </h3>
                                  {section.disabled && (
                                    <span className="px-2 py-0.5 rounded-full bg-cream/10 text-cream/50 text-xs">
                                      Coming Soon
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-cream/50">{section.description}</p>
                              </div>
                            </div>
                            {!section.disabled && (
                              <ChevronRight className={`w-5 h-5 text-cream/40 transition-transform ${
                                isActive ? 'rotate-90' : ''
                              }`} />
                            )}
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

                      {section.id === 'referral' && (
                        <div className="space-y-4">
                          {referralLoading ? (
                            <div className="flex items-center justify-center py-8">
                              <Loader2 className="w-6 h-6 text-gold animate-spin" />
                            </div>
                          ) : (
                            <>
                              {/* Stats */}
                              <div className="grid grid-cols-3 gap-3">
                                <div className="p-3 rounded-xl bg-navy-dark/50 text-center">
                                  <Users className="w-5 h-5 text-gold mx-auto mb-1" />
                                  <p className="text-lg font-bold text-cream">{referralData?.stats?.total || 0}</p>
                                  <p className="text-xs text-cream/50">Total</p>
                                </div>
                                <div className="p-3 rounded-xl bg-navy-dark/50 text-center">
                                  <CheckCircle className="w-5 h-5 text-green-400 mx-auto mb-1" />
                                  <p className="text-lg font-bold text-green-400">{referralData?.stats?.successful || 0}</p>
                                  <p className="text-xs text-cream/50">Successful</p>
                                </div>
                                <div className="p-3 rounded-xl bg-navy-dark/50 text-center">
                                  <Coins className="w-5 h-5 text-gold mx-auto mb-1" />
                                  <p className="text-lg font-bold text-gold">{referralData?.stats?.totalEarned?.toFixed(2) || '0.00'}€</p>
                                  <p className="text-xs text-cream/50">Earned</p>
                                </div>
                              </div>

                              {/* Referral Link */}
                              <div className="p-4 rounded-xl bg-navy-dark/50">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-cream/70 text-sm">Your Code</span>
                                  <span className="px-3 py-1 rounded-full bg-gold/20 text-gold text-sm font-medium">
                                    {referralData?.referralCode || '...'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 p-3 rounded-lg bg-navy/50 mb-3">
                                  <Link className="w-4 h-4 text-gold flex-shrink-0" />
                                  <code className="flex-1 text-cream/70 text-xs break-all">
                                    {referralData?.referralCode
                                      ? `${window.location.origin}/register?ref=${referralData.referralCode}`
                                      : 'Loading...'
                                    }
                                  </code>
                                </div>
                                <div className="flex gap-2">
                                  <motion.button
                                    onClick={copyReferralLink}
                                    className="flex-1 btn-primary text-sm flex items-center justify-center gap-2"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                  >
                                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    {copied ? 'Copied!' : 'Copy'}
                                  </motion.button>
                                  <motion.button
                                    onClick={shareReferral}
                                    className="flex-1 btn-secondary text-sm flex items-center justify-center gap-2"
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                  >
                                    <Share2 className="w-4 h-4" />
                                    Share
                                  </motion.button>
                                </div>
                              </div>

                              {/* How it works */}
                              <div className="p-4 rounded-xl bg-gold/10 border border-gold/20">
                                <div className="flex items-center gap-2 mb-2">
                                  <Star className="w-4 h-4 text-gold" />
                                  <span className="text-cream font-medium text-sm">How it works</span>
                                </div>
                                <p className="text-cream/70 text-xs">
                                  Share your link → Friend signs up → They purchase 20€+ → You both get <span className="text-gold font-bold">5.00€</span> in tokens!
                                </p>
                              </div>

                              {/* Recent Referrals */}
                              {referrals.length > 0 && (
                                <div>
                                  <h4 className="text-cream/70 text-sm mb-2">Recent Referrals</h4>
                                  <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {referrals.slice(0, 5).map((referral) => {
                                      const StatusIcon = getStatusIcon(referral.status);
                                      return (
                                        <div
                                          key={referral.id}
                                          className="flex items-center justify-between p-2 rounded-lg bg-navy-dark/30"
                                        >
                                          <div className="flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-cream/40" />
                                            <span className="text-cream text-sm truncate max-w-[150px]">
                                              {referral.refereeEmail || 'Pending'}
                                            </span>
                                          </div>
                                          <div className={`flex items-center gap-1 ${getStatusColor(referral.status)}`}>
                                            <StatusIcon className="w-3 h-3" />
                                            <span className="text-xs capitalize">{referral.status}</span>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </>
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
                          <div>
                            <label className="block text-sm text-cream/70 mb-2">Phone Number (Optional)</label>
                            <input
                              type="tel"
                              value={profileForm.phoneNumber}
                              onChange={(e) => setProfileForm(prev => ({ ...prev, phoneNumber: e.target.value }))}
                              placeholder="+49 123 456789"
                              className="input-field w-full"
                            />
                            <p className="text-xs text-cream/40 mt-1">For notifications and birthday reminders</p>
                          </div>
                          <div>
                            <label className="block text-sm text-cream/70 mb-2">Telegram Username (Optional)</label>
                            <input
                              type="text"
                              value={profileForm.telegramUsername}
                              onChange={(e) => setProfileForm(prev => ({ ...prev, telegramUsername: e.target.value }))}
                              placeholder="@username"
                              className="input-field w-full"
                            />
                            <p className="text-xs text-cream/40 mt-1">For Telegram bot notifications</p>
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
                        <div className="space-y-6">
                          {/* Notification Types */}
                          <div>
                            <h4 className="text-cream font-medium mb-4">Notification Types</h4>
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
                          </div>

                          {/* Notification Channels */}
                          <div className="border-t border-cream/10 pt-6">
                            <h4 className="text-cream font-medium mb-2">Notification Channels</h4>
                            <p className="text-cream/50 text-sm mb-4">Choose how you want to receive notifications</p>
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-cream">Email</p>
                                  <p className="text-sm text-cream/50">Receive notifications via email</p>
                                </div>
                                <button
                                  onClick={() => setNotifications(prev => ({ ...prev, emailChannel: !prev.emailChannel }))}
                                  className={`w-12 h-6 rounded-full transition-colors ${
                                    notifications.emailChannel ? 'bg-gold' : 'bg-navy-light'
                                  }`}
                                >
                                  <motion.div
                                    className="w-5 h-5 bg-white rounded-full shadow"
                                    animate={{ x: notifications.emailChannel ? 26 : 2 }}
                                  />
                                </button>
                              </div>
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="text-cream">WhatsApp</p>
                                    {!user?.phoneNumber && (
                                      <span className="text-xs text-amber-400">(Add phone number first)</span>
                                    )}
                                  </div>
                                  <p className="text-sm text-cream/50">Receive notifications via WhatsApp</p>
                                </div>
                                <button
                                  onClick={() => setNotifications(prev => ({ ...prev, whatsappChannel: !prev.whatsappChannel }))}
                                  disabled={!user?.phoneNumber}
                                  className={`w-12 h-6 rounded-full transition-colors ${
                                    notifications.whatsappChannel ? 'bg-gold' : 'bg-navy-light'
                                  } disabled:opacity-30 disabled:cursor-not-allowed`}
                                >
                                  <motion.div
                                    className="w-5 h-5 bg-white rounded-full shadow"
                                    animate={{ x: notifications.whatsappChannel ? 26 : 2 }}
                                  />
                                </button>
                              </div>
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <p className="text-cream">Telegram</p>
                                    {!user?.telegramUsername && (
                                      <span className="text-xs text-amber-400">(Add Telegram username first)</span>
                                    )}
                                  </div>
                                  <p className="text-sm text-cream/50">Receive notifications via Telegram bot</p>
                                </div>
                                <button
                                  onClick={() => setNotifications(prev => ({ ...prev, telegramChannel: !prev.telegramChannel }))}
                                  disabled={!user?.telegramUsername}
                                  className={`w-12 h-6 rounded-full transition-colors ${
                                    notifications.telegramChannel ? 'bg-gold' : 'bg-navy-light'
                                  } disabled:opacity-30 disabled:cursor-not-allowed`}
                                >
                                  <motion.div
                                    className="w-5 h-5 bg-white rounded-full shadow"
                                    animate={{ x: notifications.telegramChannel ? 26 : 2 }}
                                  />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {section.id === 'language' && (
                        <div className="space-y-4">
                          <div className="p-4 rounded-xl bg-gold/10 border border-gold/20 flex items-center gap-3">
                            <Languages className="w-5 h-5 text-gold" />
                            <p className="text-cream/70 text-sm">
                              Select your preferred language for the app interface and AI conversations.
                            </p>
                          </div>
                          <div className="space-y-2">
                            {languages.map((lang) => (
                              <button
                                key={lang.code}
                                onClick={() => handleLanguageChange(lang.code)}
                                disabled={isLoading || selectedLanguage === lang.code}
                                className={`w-full p-3 rounded-xl border-2 flex items-center justify-between transition-all ${
                                  selectedLanguage === lang.code
                                    ? 'border-gold bg-gold/10'
                                    : 'border-gold/20 hover:border-gold/40 hover:bg-gold/5'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                              >
                                <div className="flex items-center gap-3">
                                  <span className="text-xl">{lang.flag}</span>
                                  <span className="text-cream">{lang.name}</span>
                                </div>
                                {selectedLanguage === lang.code && (
                                  <Check className="w-5 h-5 text-gold" />
                                )}
                              </button>
                            ))}
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
                </div>
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
