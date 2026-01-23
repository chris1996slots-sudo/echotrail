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
  Crown,
  Video,
  Mic,
  TreeDeciduous,
  Gift,
  Quote,
  HeartHandshake
} from 'lucide-react';
import { PageTransition, FadeIn, StaggerContainer, StaggerItem } from '../components/PageTransition';

const features = [
  {
    icon: Video,
    title: 'Talking Avatar',
    description: 'Create a lifelike digital version of yourself that can speak with your voice and personality.',
    highlight: true,
  },
  {
    icon: Mic,
    title: 'Voice Cloning',
    description: 'Your voice lives on. Clone your voice so your avatar speaks exactly as you do.',
    highlight: true,
  },
  {
    icon: HeartHandshake,
    title: 'Family Member Chat',
    description: 'Preserve loved ones who have passed. Let future generations talk to grandma, grandpa, or any family member.',
    highlight: true,
  },
  {
    icon: Heart,
    title: 'Preserve Your Essence',
    description: 'Capture your personality, values, stories, and wisdom in a digital legacy.',
  },
  {
    icon: TreeDeciduous,
    title: 'Interactive Family Tree',
    description: 'Build your family history with photos, stories, and connections across generations.',
  },
  {
    icon: MessageCircle,
    title: 'WisdomGPT Chat',
    description: 'Your descendants can have real conversations with your digital echo and seek your guidance.',
  },
  {
    icon: Clock,
    title: 'Time Capsules',
    description: 'Schedule messages for future birthdays, graduations, weddings, or moments of need.',
  },
  {
    icon: Image,
    title: 'Memory Anchors',
    description: 'Attach stories to cherished objects - that old watch, family recipes, heirlooms.',
  },
  {
    icon: Shield,
    title: 'Private & Secure',
    description: 'Your legacy is encrypted and protected, shared only with those you choose.',
  },
];

const testimonials = [
  {
    quote: "My kids can now hear advice from my late father. It's like he's still with us.",
    author: "Maria S.",
    role: "Mother of 3",
  },
  {
    quote: "I recorded my grandmother's stories before she passed. Now my children know her too.",
    author: "Thomas K.",
    role: "Grandfather",
  },
  {
    quote: "The talking avatar is incredible. It really feels like talking to mom again.",
    author: "Jennifer L.",
    role: "Legacy Preserver",
  },
];

const useCases = [
  {
    icon: Gift,
    title: "For Parents",
    description: "Leave wisdom, advice, and love for your children to access when they need it most.",
  },
  {
    icon: TreeDeciduous,
    title: "For Grandparents",
    description: "Share your family history, traditions, and stories with generations yet to come.",
  },
  {
    icon: HeartHandshake,
    title: "For Those Grieving",
    description: "Keep the memory of loved ones alive. Let them continue to be part of family moments.",
  },
  {
    icon: Users,
    title: "For Families",
    description: "Build a living family archive that grows richer with each generation.",
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
      'Live Avatar Events',
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
              What If They Could
              <br />
              <span className="text-gradient-gold">Still Talk to You?</span>
            </h1>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="text-xl text-cream/70 max-w-2xl mx-auto mb-6 leading-relaxed">
              Create a talking avatar with your voice, personality, and wisdom.
              Let your loved ones have real conversations with you - forever.
            </p>
            <p className="text-lg text-gold/80 max-w-xl mx-auto mb-10">
              ✨ AI-powered avatar • 🎙️ Your cloned voice • 💬 Real conversations
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

      {/* Emotional Hook Section */}
      <section className="py-16 bg-gradient-to-b from-navy-dark to-navy relative">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <FadeIn>
            <div className="glass-card p-10 border-gold/30 bg-gold/5">
              <Quote className="w-10 h-10 text-gold/40 mx-auto mb-6" />
              <p className="text-2xl md:text-3xl font-serif text-cream mb-6 leading-relaxed italic">
                "I wish I could ask my grandmother for advice one more time..."
              </p>
              <p className="text-cream/60 text-lg mb-8">
                With EchoTrail, future generations will never have to say that about you.
              </p>
              <motion.button
                onClick={() => onNavigate('onboarding')}
                className="btn-primary inline-flex items-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Start Preserving Your Legacy
                <ArrowRight className="w-5 h-5 ml-2" />
              </motion.button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 bg-navy relative">
        <div className="max-w-6xl mx-auto px-4">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-serif text-cream mb-4">
                Who Is EchoTrail For?
              </h2>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((useCase, index) => {
              const Icon = useCase.icon;
              return (
                <FadeIn key={index} delay={index * 0.1}>
                  <motion.div
                    className="glass-card p-6 text-center h-full"
                    whileHover={{ y: -5 }}
                  >
                    <div className="w-14 h-14 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
                      <Icon className="w-7 h-7 text-gold" />
                    </div>
                    <h3 className="text-lg font-serif text-cream mb-2">
                      {useCase.title}
                    </h3>
                    <p className="text-cream/60 text-sm leading-relaxed">
                      {useCase.description}
                    </p>
                  </motion.div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-navy-dark relative">
        <div className="max-w-7xl mx-auto px-4">
          <FadeIn>
            <div className="text-center mb-16">
              <h2 className="text-4xl font-serif text-cream mb-4">
                Everything You Need to Live Forever
              </h2>
              <p className="text-cream/60 max-w-2xl mx-auto">
                Powerful features that turn your memories, personality, and voice
                into an eternal presence for your family.
              </p>
            </div>
          </FadeIn>

          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <StaggerItem key={index}>
                  <motion.div
                    className={`glass-card-hover p-8 h-full ${feature.highlight ? 'border-gold/40 bg-gold/5' : ''}`}
                    whileHover={{ y: -5 }}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${feature.highlight ? 'bg-gold/20' : 'bg-gold/10'}`}>
                      <Icon className={`w-6 h-6 ${feature.highlight ? 'text-gold' : 'text-gold'}`} />
                    </div>
                    {feature.highlight && (
                      <span className="inline-block px-2 py-1 bg-gold/20 text-gold text-xs rounded-full mb-3">
                        ✨ Core Feature
                      </span>
                    )}
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

      {/* Testimonials Section */}
      <section className="py-20 bg-navy relative">
        <div className="max-w-6xl mx-auto px-4">
          <FadeIn>
            <div className="text-center mb-12">
              <h2 className="text-3xl font-serif text-cream mb-4">
                Stories from Our Community
              </h2>
              <p className="text-cream/60">
                Real people preserving real legacies
              </p>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, index) => (
              <FadeIn key={index} delay={index * 0.1}>
                <motion.div
                  className="glass-card p-6 h-full"
                  whileHover={{ y: -3 }}
                >
                  <Quote className="w-8 h-8 text-gold/30 mb-4" />
                  <p className="text-cream/80 italic mb-4 leading-relaxed">
                    "{testimonial.quote}"
                  </p>
                  <div className="border-t border-gold/10 pt-4">
                    <p className="text-cream font-medium">{testimonial.author}</p>
                    <p className="text-cream/50 text-sm">{testimonial.role}</p>
                  </div>
                </motion.div>
              </FadeIn>
            ))}
          </div>
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
                  Top up your tokens anytime. Use them for Live Avatar conversations,
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
              Don't Let Your Story End
            </h2>
            <p className="text-xl text-cream/60 mb-6 max-w-2xl mx-auto">
              Every day, wisdom is lost that can never be recovered.
              Every memory that fades takes a piece of family history with it.
            </p>
            <p className="text-2xl text-gold mb-10">
              Start preserving your legacy today – for free.
            </p>
            <motion.button
              onClick={() => onNavigate('onboarding')}
              className="btn-primary text-lg flex items-center mx-auto mb-4"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Create Your Free Account
              <ArrowRight className="w-5 h-5 ml-2" />
            </motion.button>
            <p className="text-cream/40 text-sm">
              No credit card required • Free tier available
            </p>
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
