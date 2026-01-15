import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  User,
  Mail,
  Lock,
  Heart,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';
import { PageTransition, FadeIn } from '../components/PageTransition';
import { useApp } from '../context/AppContext';
import { LegacyScore } from '../components/LegacyScore';
import api from '../services/api';

const steps = [
  {
    id: 'welcome',
    title: 'Your Legacy Begins Here',
    subtitle: 'A journey to immortalize your essence',
  },
  {
    id: 'identity',
    title: 'Who Are You?',
    subtitle: 'Let us know the name your legacy will carry',
  },
  {
    id: 'purpose',
    title: 'Why Are You Here?',
    subtitle: 'Understanding your motivation helps us guide you',
  },
  {
    id: 'account',
    title: 'Secure Your Legacy',
    subtitle: 'Create your account to begin preserving your essence',
  },
  {
    id: 'complete',
    title: 'Welcome to EchoTrail',
    subtitle: 'Your journey to immortality has begun',
  },
];

const purposes = [
  { id: 'family', label: 'For My Family', description: 'Preserve wisdom for future generations', icon: '👨‍👩‍👧‍👦' },
  { id: 'children', label: 'For My Children', description: 'Guide them even when I cannot', icon: '👶' },
  { id: 'grandchildren', label: 'For Future Grandchildren', description: 'Stories for those not yet born', icon: '🌱' },
  { id: 'self', label: 'For Myself', description: 'Create a digital time capsule', icon: '💫' },
];

export function OnboardingPage({ onNavigate }) {
  const { setUser, setSubscription } = useApp();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    purposes: [],
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const progress = ((currentStep + 1) / steps.length) * 100;

  const validateStep = () => {
    const newErrors = {};

    if (currentStep === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    }

    if (currentStep === 2) {
      if (formData.purposes.length === 0) newErrors.purposes = 'Please select at least one purpose';
    }

    if (currentStep === 3) {
      if (!formData.email.trim()) newErrors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email format';
      if (!formData.password) newErrors.password = 'Password is required';
      else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = async () => {
    if (!validateStep()) return;

    // Handle registration on account step
    if (currentStep === steps.length - 2) {
      setIsSubmitting(true);
      setErrors({});

      try {
        const response = await api.register({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          password: formData.password,
        });

        // Set user from API response
        setUser(response.user);
        setSubscription({
          plan: response.user.subscription || 'FREE',
          startedAt: new Date().toISOString(),
        });

        // Use setTimeout to defer step update and avoid React render conflict
        setTimeout(() => {
          setCurrentStep(prev => prev + 1);
        }, 0);
      } catch (error) {
        setErrors({ submit: error.message || 'Registration failed. Please try again.' });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const renderStepContent = () => {
    const step = steps[currentStep];

    switch (step.id) {
      case 'welcome':
        return (
          <div className="text-center">
            <motion.div
              className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center pulse-glow"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: 9999 }}
            >
              <Sparkles className="w-12 h-12 text-navy" />
            </motion.div>
            <p className="text-cream/70 text-lg mb-8 max-w-md mx-auto">
              In the next few moments, you'll take the first steps toward creating a digital
              version of yourself that will carry your wisdom, your values, and your stories
              into the future.
            </p>
            <div className="flex items-center justify-center gap-2 text-gold">
              <Heart className="w-5 h-5" />
              <span className="text-sm">This is a journey of love and legacy</span>
            </div>
          </div>
        );

      case 'identity':
        return (
          <div className="max-w-md mx-auto space-y-6">
            <div>
              <label className="block text-cream/70 text-sm mb-2">First Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold/50" />
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Your first name"
                  className="input-field pl-12"
                />
              </div>
              {errors.firstName && (
                <p className="text-red-400 text-sm mt-1">{errors.firstName}</p>
              )}
            </div>
            <div>
              <label className="block text-cream/70 text-sm mb-2">Last Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold/50" />
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Your last name"
                  className="input-field pl-12"
                />
              </div>
              {errors.lastName && (
                <p className="text-red-400 text-sm mt-1">{errors.lastName}</p>
              )}
            </div>
          </div>
        );

      case 'purpose':
        const togglePurpose = (purposeId) => {
          const current = formData.purposes;
          if (current.includes(purposeId)) {
            setFormData({ ...formData, purposes: current.filter(p => p !== purposeId) });
          } else {
            setFormData({ ...formData, purposes: [...current, purposeId] });
          }
        };

        return (
          <div className="max-w-lg mx-auto">
            <p className="text-cream/50 text-sm text-center mb-6">Select all that apply</p>
            <div className="grid grid-cols-2 gap-4">
              {purposes.map((purpose) => {
                const isSelected = formData.purposes.includes(purpose.id);
                return (
                  <motion.button
                    key={purpose.id}
                    onClick={() => togglePurpose(purpose.id)}
                    className={`p-6 rounded-xl border-2 text-left transition-all relative ${
                      isSelected
                        ? 'border-gold bg-gold/10'
                        : 'border-gold/20 hover:border-gold/40 bg-navy-light/30'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-gold flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-navy" />
                      </div>
                    )}
                    <span className="text-3xl mb-3 block">{purpose.icon}</span>
                    <h4 className="text-cream font-medium mb-1">{purpose.label}</h4>
                    <p className="text-cream/50 text-sm">{purpose.description}</p>
                  </motion.button>
                );
              })}
            </div>
            {errors.purposes && (
              <p className="text-red-400 text-sm mt-4 text-center">{errors.purposes}</p>
            )}
          </div>
        );

      case 'account':
        return (
          <div className="max-w-md mx-auto space-y-6">
            <div>
              <label className="block text-cream/70 text-sm mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold/50" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your@email.com"
                  className="input-field pl-12"
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-sm mt-1">{errors.email}</p>
              )}
            </div>
            <div>
              <label className="block text-cream/70 text-sm mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold/50" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Create a secure password"
                  className="input-field pl-12 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gold/50 hover:text-gold"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-sm mt-1">{errors.password}</p>
              )}
            </div>
            {errors.submit && (
              <p className="text-red-400 text-sm text-center bg-red-400/10 p-3 rounded-lg">{errors.submit}</p>
            )}
            <p className="text-cream/40 text-xs text-center">
              By creating an account, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        );

      case 'complete':
        return (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.6 }}
              className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center"
            >
              <CheckCircle2 className="w-12 h-12 text-navy" />
            </motion.div>
            <p className="text-cream/70 text-lg mb-4">
              Welcome, <span className="text-gold font-serif">{formData.firstName}</span>!
            </p>
            <p className="text-cream/50 mb-8 max-w-md mx-auto">
              Your legacy journey has officially begun. Let's start building your digital
              essence by exploring who you truly are.
            </p>
            <div className="mb-8">
              <LegacyScore size="lg" />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <PageTransition className="min-h-screen bg-gradient-to-b from-navy via-navy to-navy-dark flex flex-col">
      <div className="fixed top-0 left-0 right-0 h-1 bg-navy-dark z-50">
        <motion.div
          className="h-full bg-gradient-to-r from-gold to-gold-light"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-4 pt-8">
        <div className="w-full max-w-2xl">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentStep
                      ? 'w-8 bg-gold'
                      : index < currentStep
                      ? 'bg-gold/50'
                      : 'bg-gold/20'
                  }`}
                />
              ))}
            </div>
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="text-3xl md:text-4xl font-serif text-cream mb-2">
                {steps[currentStep].title}
              </h1>
              <p className="text-cream/60">{steps[currentStep].subtitle}</p>
            </motion.div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="glass-card p-8 md:p-12"
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between mt-8">
            {currentStep > 0 && currentStep < steps.length - 1 ? (
              <motion.button
                onClick={prevStep}
                className="btn-secondary flex items-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </motion.button>
            ) : (
              <div />
            )}

            {currentStep < steps.length - 1 ? (
              <motion.button
                onClick={nextStep}
                disabled={isSubmitting}
                className="btn-primary flex items-center ml-auto disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={isSubmitting ? {} : { scale: 1.05 }}
                whileTap={isSubmitting ? {} : { scale: 0.95 }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    {currentStep === 0 ? "Let's Begin" : 'Continue'}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </motion.button>
            ) : (
              <motion.button
                onClick={() => onNavigate('persona')}
                className="btn-primary flex items-center mx-auto"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Build My Persona
                <ArrowRight className="w-5 h-5 ml-2" />
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
