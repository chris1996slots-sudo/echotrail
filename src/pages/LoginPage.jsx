import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight, AlertCircle } from 'lucide-react';
import { PageTransition, FadeIn } from '../components/PageTransition';
import { useApp } from '../context/AppContext';
import api from '../services/api';

export function LoginPage({ onNavigate }) {
  const { setUser } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.login(email, password);
      setUser(data.user);

      // Use setTimeout to defer navigation and avoid React render conflict
      const targetPage = data.user.role === 'ADMIN' ? 'admin' : 'persona';
      setTimeout(() => {
        onNavigate(targetPage);
      }, 0);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition className="min-h-screen bg-gradient-to-b from-navy via-navy to-navy-dark flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <FadeIn>
          <div className="text-center mb-8">
            <motion.div
              className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
            >
              <Sparkles className="w-8 h-8 text-navy" />
            </motion.div>
            <h1 className="text-3xl font-serif text-cream mb-2">Welcome Back</h1>
            <p className="text-cream/60">Sign in to continue your legacy journey</p>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <form onSubmit={handleSubmit} className="glass-card p-8 space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30"
              >
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <span className="text-red-400 text-sm">{error}</span>
              </motion.div>
            )}

            <div>
              <label className="block text-cream/70 text-sm mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold/50" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="input-field pl-12"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-cream/70 text-sm mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold/50" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="input-field pl-12 pr-12"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gold/50 hover:text-gold"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              className="w-full btn-primary flex items-center justify-center disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-navy border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="w-5 h-5 ml-2" />
                </>
              )}
            </motion.button>

            <div className="text-center">
              <p className="text-cream/50 text-sm">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => onNavigate('onboarding')}
                  className="text-gold hover:underline"
                >
                  Create one
                </button>
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gold/20"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-navy-light text-cream/40">or</span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-cream/40 text-xs">
                Admin? Use your admin credentials
              </p>
            </div>
          </form>
        </FadeIn>
      </div>
    </PageTransition>
  );
}
