import { useState } from 'react';
import { motion } from 'framer-motion';
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
  AlertTriangle
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
                    section.danger ? 'border-red-500/30' : ''
                  }`}
                >
                  <button
                    onClick={() => setActiveSection(isActive ? null : section.id)}
                    className={`w-full p-4 flex items-center justify-between transition-colors ${
                      section.danger
                        ? 'hover:bg-red-500/10'
                        : 'hover:bg-navy-light/30'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        section.danger
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-gold/10 text-gold'
                      }`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <h3 className={`font-medium ${
                          section.danger ? 'text-red-400' : 'text-cream'
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
