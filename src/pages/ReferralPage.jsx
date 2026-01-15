import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Gift,
  Copy,
  Check,
  Share2,
  Coins,
  ChevronRight,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Mail,
  Link,
  Star
} from 'lucide-react';
import { PageTransition, FadeIn } from '../components/PageTransition';
import { useApp } from '../context/AppContext';
import api from '../services/api';

export function ReferralPage({ onNavigate }) {
  const { user } = useApp();
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [referralData, setReferralData] = useState(null);
  const [referrals, setReferrals] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadReferralData();
  }, []);

  const loadReferralData = async () => {
    try {
      setLoading(true);
      const [myReferral, myReferrals] = await Promise.all([
        api.getMyReferral(),
        api.getMyReferrals()
      ]);
      setReferralData(myReferral);
      setReferrals(myReferrals);
    } catch (error) {
      console.error('Failed to load referral data:', error);
    } finally {
      setLoading(false);
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

  const shareReferral = async () => {
    if (!referralData?.referralCode) return;

    const link = `${window.location.origin}/register?ref=${referralData.referralCode}`;
    const text = `Join EchoTrail and preserve your legacy! Use my referral link to get bonus tokens: ${link}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join EchoTrail',
          text: text,
          url: link
        });
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Share failed:', error);
        }
      }
    } else {
      copyReferralLink();
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'text-green-400';
      case 'pending':
        return 'text-yellow-400';
      case 'expired':
        return 'text-red-400';
      default:
        return 'text-cream/50';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return CheckCircle;
      case 'pending':
        return Clock;
      case 'expired':
        return XCircle;
      default:
        return Clock;
    }
  };

  if (loading) {
    return (
      <PageTransition className="min-h-screen bg-gradient-to-b from-navy via-navy to-navy-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </PageTransition>
    );
  }

  return (
    <PageTransition className="min-h-screen bg-gradient-to-b from-navy via-navy to-navy-dark">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <FadeIn>
          <div className="mb-8">
            <h1 className="text-3xl font-serif text-cream mb-2">Referral Program</h1>
            <p className="text-cream/50">Invite friends and earn rewards together</p>
          </div>
        </FadeIn>

        {/* Stats Overview */}
        <FadeIn delay={0.1}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <motion.div
              className="glass-card p-6"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <p className="text-cream/50 text-sm">Total Referrals</p>
                  <p className="text-2xl font-bold text-cream">{referralData?.stats?.total || 0}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="glass-card p-6"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-cream/50 text-sm">Successful</p>
                  <p className="text-2xl font-bold text-green-400">{referralData?.stats?.successful || 0}</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              className="glass-card p-6"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center">
                  <Coins className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <p className="text-cream/50 text-sm">Tokens Earned</p>
                  <p className="text-2xl font-bold text-gold">{referralData?.stats?.totalEarned?.toFixed(2) || '0.00'}€</p>
                </div>
              </div>
            </motion.div>
          </div>
        </FadeIn>

        {/* Referral Link Card */}
        <FadeIn delay={0.2}>
          <div className="glass-card p-6 mb-8 border-gold/30">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center">
                  <Gift className="w-5 h-5 text-gold" />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-cream">Your Referral Link</h3>
                  <p className="text-sm text-cream/50">Share this link with friends</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-gold/20 text-gold text-sm font-medium">
                  {referralData?.referralCode || 'Loading...'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-navy-dark/50 mb-6">
              <Link className="w-5 h-5 text-gold flex-shrink-0" />
              <code className="flex-1 text-cream/70 text-sm break-all">
                {referralData?.referralCode
                  ? `${window.location.origin}/register?ref=${referralData.referralCode}`
                  : 'Generating link...'
                }
              </code>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <motion.button
                onClick={copyReferralLink}
                className="flex-1 btn-primary flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Link
                  </>
                )}
              </motion.button>

              <motion.button
                onClick={shareReferral}
                className="flex-1 btn-secondary flex items-center justify-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Share2 className="w-4 h-4" />
                Share
              </motion.button>
            </div>
          </div>
        </FadeIn>

        {/* How It Works */}
        <FadeIn delay={0.3}>
          <div className="glass-card p-6 mb-8">
            <h3 className="text-lg font-medium text-cream mb-6 flex items-center gap-2">
              <Star className="w-5 h-5 text-gold" />
              How It Works
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-4">
                  <Share2 className="w-8 h-8 text-gold" />
                </div>
                <h4 className="text-cream font-medium mb-2">1. Share Your Link</h4>
                <p className="text-cream/50 text-sm">Send your unique referral link to friends and family</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gold" />
                </div>
                <h4 className="text-cream font-medium mb-2">2. They Sign Up</h4>
                <p className="text-cream/50 text-sm">Your friend creates an account using your link</p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-4">
                  <Gift className="w-8 h-8 text-gold" />
                </div>
                <h4 className="text-cream font-medium mb-2">3. Both Get Rewarded</h4>
                <p className="text-cream/50 text-sm">When they make a qualifying purchase, you both receive tokens</p>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-xl bg-gold/10 border border-gold/20">
              <div className="flex items-center gap-3">
                <Coins className="w-6 h-6 text-gold flex-shrink-0" />
                <p className="text-cream/80 text-sm">
                  <span className="text-gold font-medium">Rewards: </span>
                  You and your friend each receive <span className="text-gold font-bold">5.00€</span> in tokens
                  when they make a purchase of <span className="text-gold font-bold">20.00€</span> or more!
                </p>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Referral History */}
        <FadeIn delay={0.4}>
          <div className="glass-card overflow-hidden">
            <div className="p-6 border-b border-white/5">
              <h3 className="text-lg font-medium text-cream flex items-center gap-2">
                <Clock className="w-5 h-5 text-gold" />
                Referral History
              </h3>
            </div>

            {referrals.length === 0 ? (
              <div className="p-12 text-center">
                <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gold/50" />
                </div>
                <h4 className="text-cream/70 font-medium mb-2">No referrals yet</h4>
                <p className="text-cream/50 text-sm">Share your link to start earning rewards!</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {referrals.map((referral) => {
                  const StatusIcon = getStatusIcon(referral.status);
                  return (
                    <div
                      key={referral.id}
                      className="p-4 flex items-center justify-between hover:bg-navy-light/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-navy-light flex items-center justify-center">
                          <Mail className="w-5 h-5 text-cream/50" />
                        </div>
                        <div>
                          <p className="text-cream font-medium">
                            {referral.refereeEmail || 'Pending signup'}
                          </p>
                          <p className="text-cream/50 text-sm">
                            {new Date(referral.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {referral.status === 'completed' && (
                          <span className="text-green-400 font-medium text-sm">
                            +{referral.referrerReward?.toFixed(2)}€
                          </span>
                        )}
                        <div className={`flex items-center gap-2 ${getStatusColor(referral.status)}`}>
                          <StatusIcon className="w-4 h-4" />
                          <span className="text-sm capitalize">{referral.status}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </FadeIn>

        {/* Your Token Balance */}
        <FadeIn delay={0.5}>
          <div className="mt-8 glass-card p-6 border-gold/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gold/20 flex items-center justify-center">
                  <Coins className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <p className="text-cream/50 text-sm">Your Token Balance</p>
                  <p className="text-2xl font-bold text-gold">
                    {user?.tokenBalance?.toFixed(2) || '0.00'}€
                  </p>
                </div>
              </div>
              <motion.button
                onClick={() => onNavigate('settings')}
                className="btn-secondary flex items-center gap-2"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>Manage Tokens</span>
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </FadeIn>
      </div>
    </PageTransition>
  );
}
