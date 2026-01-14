import { motion } from 'framer-motion';
import {
  Sparkles,
  Heart,
  Shield,
  Clock,
  Star,
  Check,
  ArrowRight,
  Play,
  Users,
  MessageCircle,
  Image,
  Coins,
  Infinity,
  Zap,
  Crown
} from 'lucide-react';
import { PageTransition, FadeIn, StaggerContainer, StaggerItem } from '../components/PageTransition';

const features = [
  {
    icon: Heart,
    title: 'Preserve Your Essence',
    description: 'Capture the unique qualities that make you who you are, from your values to your stories.',
  },
  {
    icon: MessageCircle,
    title: 'Wisdom That Endures',
    description: 'Your descendants can seek guidance and advice based on your lifetime of experience.',
  },
  {
    icon: Image,
    title: 'Memory Anchors',
    description: 'Attach stories to cherished objects, creating lasting connections to your memories.',
  },
  {
    icon: Clock,
    title: 'Time Capsules',
    description: 'Schedule messages for future moments – birthdays, milestones, or moments of need.',
  },
  {
    icon: Shield,
    title: 'Private & Secure',
    description: 'Your legacy is encrypted and protected, shared only with those you choose.',
  },
  {
    icon: Users,
    title: 'Family Connections',
    description: 'Create a lasting bond across generations through your digital presence.',
  },
];

const pricingPlans = [
  {
    name: 'Standard',
    price: '$1.99',
    period: '/month',
    description: 'Begin your legacy journey',
    features: [
      'Personal Persona Builder',
      'Up to 10 Life Stories',
      'Basic Value Store',
      '5 Memory Anchors',
      'Single Time Capsule',
      'Wisdom GPT Access',
      '100 AI Tokens included',
    ],
    cta: 'Start Your Journey',
    popular: false,
    type: 'subscription',
  },
  {
    name: 'Premium',
    price: '$3.99',
    period: '/month',
    description: 'The complete legacy experience',
    features: [
      'Everything in Standard',
      'Unlimited Life Stories',
      'Advanced Personality Traits',
      'Unlimited Memory Anchors',
      'Unlimited Time Capsules',
      'Echo Simulator Events',
      'Priority AI Processing',
      'Family Sharing (up to 5)',
      '500 AI Tokens included',
    ],
    cta: 'Unlock Premium',
    popular: true,
    type: 'subscription',
  },
  {
    name: 'Lifetime',
    price: '$299',
    period: 'one-time',
    description: 'Forever access, pay once',
    features: [
      'All Premium Features Forever',
      'Unlimited AI Tokens',
      'Priority Support',
      'Early Access to New Features',
      'Exclusive Lifetime Badge',
      'Legacy Vault Storage',
      'Family Sharing (up to 10)',
      'No Monthly Fees Ever',
    ],
    cta: 'Get Lifetime Access',
    popular: false,
    type: 'lifetime',
    icon: Crown,
  },
];

const tokenPackages = [
  {
    tokens: 100,
    price: '$4.99',
    perToken: '$0.05',
    popular: false,
  },
  {
    tokens: 500,
    price: '$19.99',
    perToken: '$0.04',
    savings: '20%',
    popular: true,
  },
  {
    tokens: 1000,
    price: '$34.99',
    perToken: '$0.035',
    savings: '30%',
    popular: false,
  },
  {
    tokens: 5000,
    price: '$149.99',
    perToken: '$0.03',
    savings: '40%',
    popular: false,
  },
];

export function LandingPage({ onNavigate }) {
  return (
    <PageTransition className="min-h-screen">
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-navy via-navy to-navy-dark" />

        <div className="absolute inset-0 overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-gold/30 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0.2, 0.8, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 2 + Math.random() * 3,
                repeat: 9999,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
          <FadeIn>
            <motion.div
              className="inline-flex items-center px-4 py-2 rounded-full bg-gold/10 border border-gold/20 mb-8"
              whileHover={{ scale: 1.05 }}
            >
              <Sparkles className="w-4 h-4 text-gold mr-2" />
              <span className="text-gold text-sm font-medium">Your Legacy, Immortalized</span>
            </motion.div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h1 className="text-5xl md:text-7xl font-serif text-cream mb-6 leading-tight">
              Leave Behind More Than
              <br />
              <span className="text-gradient-gold">Memories</span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="text-xl text-cream/70 max-w-2xl mx-auto mb-10 leading-relaxed">
              EchoTrail transforms your wisdom, values, and stories into an AI companion
              that carries your essence forward for generations to come.
            </p>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button
                onClick={() => onNavigate('onboarding')}
                className="btn-primary flex items-center text-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Begin Your Legacy
                <ArrowRight className="w-5 h-5 ml-2" />
              </motion.button>
              <motion.button
                className="btn-secondary flex items-center text-lg"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Play className="w-5 h-5 mr-2" />
                Watch Demo
              </motion.button>
            </div>
          </FadeIn>

          <FadeIn delay={0.5}>
            <div className="mt-16 flex items-center justify-center gap-8 text-cream/50">
              <div className="text-center">
                <p className="text-3xl font-serif text-gold">10,000+</p>
                <p className="text-sm">Legacies Created</p>
              </div>
              <div className="w-px h-12 bg-gold/20" />
              <div className="text-center">
                <p className="text-3xl font-serif text-gold">4.9</p>
                <p className="text-sm">User Rating</p>
              </div>
              <div className="w-px h-12 bg-gold/20" />
              <div className="text-center">
                <p className="text-3xl font-serif text-gold">50,000+</p>
                <p className="text-sm">Stories Preserved</p>
              </div>
            </div>
          </FadeIn>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-navy-dark to-transparent" />
      </section>

      <section className="py-24 bg-navy-dark relative">
        <div className="max-w-7xl mx-auto px-4">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-4xl font-serif text-cream mb-4">
                Preserve What Matters Most
              </h2>
              <p className="text-cream/60 max-w-2xl mx-auto">
                Every feature is designed to capture the essence of who you are,
                creating a lasting connection with those who matter most.
              </p>
            </div>
          </FadeIn>

          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <StaggerItem key={index}>
                  <motion.div
                    className="glass-card-hover p-8 h-full"
                    whileHover={{ y: -5 }}
                  >
                    <div className="w-12 h-12 rounded-xl bg-gold/10 flex items-center justify-center mb-6">
                      <Icon className="w-6 h-6 text-gold" />
                    </div>
                    <h3 className="text-xl font-serif text-cream mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-cream/60 leading-relaxed">
                      {feature.description}
                    </p>
                  </motion.div>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </div>
      </section>

      <section id="pricing" className="py-24 bg-navy relative">
        <div className="max-w-7xl mx-auto px-4">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-4xl font-serif text-cream mb-4">
                Choose Your Legacy Plan
              </h2>
              <p className="text-cream/60 max-w-2xl mx-auto">
                Start preserving your essence today with our thoughtfully crafted plans.
              </p>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto mb-20">
            {pricingPlans.map((plan, index) => {
              const PlanIcon = plan.icon;
              return (
                <FadeIn key={plan.name} delay={index * 0.1}>
                  <motion.div
                    className={`relative glass-card p-8 h-full ${
                      plan.popular ? 'border-gold/50' : ''
                    } ${plan.type === 'lifetime' ? 'bg-gradient-to-b from-gold/5 to-transparent' : ''}`}
                    whileHover={{ y: -10, scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                  >
                    {plan.popular && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <span className="inline-flex items-center px-4 py-1 rounded-full bg-gold text-navy text-sm font-semibold">
                          <Star className="w-4 h-4 mr-1" />
                          Most Popular
                        </span>
                      </div>
                    )}

                    {plan.type === 'lifetime' && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                        <span className="inline-flex items-center px-4 py-1 rounded-full bg-gradient-to-r from-gold to-gold-light text-navy text-sm font-semibold">
                          <Infinity className="w-4 h-4 mr-1" />
                          Best Value
                        </span>
                      </div>
                    )}

                    <div className="text-center mb-8">
                      {PlanIcon && (
                        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-gold/20 flex items-center justify-center">
                          <PlanIcon className="w-6 h-6 text-gold" />
                        </div>
                      )}
                      <h3 className="text-2xl font-serif text-cream mb-2">{plan.name}</h3>
                      <p className="text-cream/50 text-sm mb-4">{plan.description}</p>
                      <div className="flex items-baseline justify-center">
                        <span className="text-4xl font-serif text-gold">{plan.price}</span>
                        <span className="text-cream/50 ml-1">
                          {plan.period === 'one-time' ? '' : plan.period}
                        </span>
                      </div>
                      {plan.type === 'lifetime' && (
                        <p className="text-gold/70 text-sm mt-2">One-time payment</p>
                      )}
                    </div>

                    <ul className="space-y-3 mb-8">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-start text-cream/80 text-sm">
                          <Check className="w-4 h-4 text-gold mr-2 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <motion.button
                      onClick={() => onNavigate('onboarding')}
                      className={`w-full py-3 rounded-full font-semibold transition-all ${
                        plan.popular || plan.type === 'lifetime'
                          ? 'btn-primary'
                          : 'btn-secondary'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {plan.cta}
                    </motion.button>
                  </motion.div>
                </FadeIn>
              );
            })}
          </div>

          <FadeIn delay={0.3}>
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-10">
                <div className="inline-flex items-center px-4 py-2 rounded-full bg-gold/10 border border-gold/20 mb-4">
                  <Coins className="w-4 h-4 text-gold mr-2" />
                  <span className="text-gold text-sm font-medium">AI Token Packages</span>
                </div>
                <h3 className="text-2xl font-serif text-cream mb-2">
                  Need More AI Power?
                </h3>
                <p className="text-cream/60 text-sm max-w-xl mx-auto">
                  Top up your tokens anytime. Use them for Echo Simulator conversations,
                  Wisdom GPT chats, and AI-powered features.
                </p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {tokenPackages.map((pkg, index) => (
                  <motion.div
                    key={pkg.tokens}
                    className={`relative glass-card p-5 text-center cursor-pointer ${
                      pkg.popular ? 'border-gold/50' : ''
                    }`}
                    whileHover={{ y: -5, scale: 1.03 }}
                    transition={{ duration: 0.2 }}
                  >
                    {pkg.popular && (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-gold text-navy text-xs font-semibold">
                          Best Deal
                        </span>
                      </div>
                    )}
                    {pkg.savings && (
                      <div className="absolute -top-2 -right-2">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-green-500 text-white text-xs font-semibold">
                          Save {pkg.savings}
                        </span>
                      </div>
                    )}

                    <div className="flex items-center justify-center mb-3">
                      <Zap className="w-5 h-5 text-gold mr-1" />
                      <span className="text-2xl font-serif text-cream">{pkg.tokens.toLocaleString()}</span>
                    </div>
                    <p className="text-xs text-cream/50 mb-2">tokens</p>
                    <p className="text-xl font-semibold text-gold mb-1">{pkg.price}</p>
                    <p className="text-xs text-cream/40">{pkg.perToken}/token</p>
                  </motion.div>
                ))}
              </div>

              <p className="text-center text-cream/40 text-xs mt-6">
                Tokens never expire. Lifetime members enjoy unlimited tokens at no extra cost.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="py-24 bg-navy-dark">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <FadeIn>
            <h2 className="text-4xl font-serif text-cream mb-6">
              Begin Your Legacy Today
            </h2>
            <p className="text-xl text-cream/60 mb-10 max-w-2xl mx-auto">
              Join thousands who have chosen to preserve their wisdom, their stories,
              and their essence for generations to come.
            </p>
            <motion.button
              onClick={() => onNavigate('onboarding')}
              className="btn-primary text-lg flex items-center mx-auto"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Start Your Journey
              <ArrowRight className="w-5 h-5 ml-2" />
            </motion.button>
          </FadeIn>
        </div>
      </section>

      <footer className="py-12 bg-navy border-t border-gold/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-navy" />
              </div>
              <span className="ml-3 text-xl font-serif text-cream">EchoTrail</span>
            </div>
            <p className="text-cream/40 text-sm">
              © 2026 EchoTrail. Preserving legacies for the future.
            </p>
          </div>
        </div>
      </footer>
    </PageTransition>
  );
}
