import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Sparkles,
  User,
  RefreshCw,
  Trash2,
  Heart,
  BookOpen,
  Compass
} from 'lucide-react';
import { PageTransition, FadeIn } from '../components/PageTransition';
import { useApp } from '../context/AppContext';

const suggestedQuestions = [
  { icon: Heart, text: "What's your advice on finding love?" },
  { icon: BookOpen, text: "What's the most important lesson you learned?" },
  { icon: Compass, text: "How should I handle difficult decisions?" },
];

const generateResponse = (question, persona, user) => {
  const vibeResponses = {
    compassionate: {
      intro: "I feel the weight of your question, and I want you to know I'm here for you.",
      style: "warm and nurturing"
    },
    strict: {
      intro: "This is an important question that deserves a direct answer.",
      style: "firm but caring"
    },
    storyteller: {
      intro: "Your question reminds me of something I experienced once...",
      style: "narrative and engaging"
    },
    wise: {
      intro: "Let me share some thoughts that took me years to understand.",
      style: "philosophical and deep"
    },
    playful: {
      intro: "Ah, now that's a great question! Let me think about this...",
      style: "lighthearted yet meaningful"
    },
    adventurous: {
      intro: "Life's full of these moments where we need to take a leap!",
      style: "encouraging and bold"
    },
  };

  const vibe = vibeResponses[persona.echoVibe || 'compassionate'];
  const values = persona.values || { humor: 50, empathy: 50, tradition: 50, adventure: 50 };

  const questionLower = question.toLowerCase();

  let wisdom = "";

  if (questionLower.includes('love') || questionLower.includes('relationship')) {
    wisdom = values.empathy > 60
      ? "Love is about truly seeing another person – their fears, their dreams, their imperfections – and choosing them anyway, every single day. Don't rush it. The right person will make you feel like you can be completely yourself."
      : "Love requires patience and understanding. Focus on building a foundation of respect and communication. The strongest relationships are built on shared values and mutual support.";
  } else if (questionLower.includes('career') || questionLower.includes('work') || questionLower.includes('job')) {
    wisdom = values.adventure > 60
      ? "Don't be afraid to take the path less traveled. Some of my best decisions came from saying yes to opportunities that scared me. Your career should energize you, not drain you."
      : "Build your skills steadily and seek mentors who've walked the path before you. Success rarely comes overnight, but persistence always pays off. Find work that aligns with your values.";
  } else if (questionLower.includes('decision') || questionLower.includes('choose') || questionLower.includes('difficult')) {
    wisdom = values.tradition > 60
      ? "When facing difficult decisions, ask yourself: what would my ancestors think? What choice honors the values that were passed down to me? Sometimes the right path is the one that connects us to our roots."
      : "Trust your gut, but gather information first. Make a list of what truly matters to you, then see which option aligns best. Remember, not making a decision is also a decision.";
  } else if (questionLower.includes('lesson') || questionLower.includes('learn') || questionLower.includes('wisdom')) {
    wisdom = "The most profound lesson I learned is that time is the most precious gift we have. We can always earn more money, but we can never get back a single moment. Spend your time on people and experiences that truly matter to you.";
  } else if (questionLower.includes('happy') || questionLower.includes('happiness') || questionLower.includes('joy')) {
    wisdom = values.humor > 60
      ? "Happiness is found in the little moments – a good laugh with friends, a beautiful sunset, that first sip of morning coffee. Don't wait for the big moments to be happy. Find joy in the everyday silliness of life!"
      : "True happiness comes from within. It's about gratitude for what you have, meaningful connections with others, and living in alignment with your values. It's not about having more, but appreciating more.";
  } else if (questionLower.includes('afraid') || questionLower.includes('fear') || questionLower.includes('scared')) {
    wisdom = "Fear is just excitement without breath. When you feel afraid, it often means you're on the edge of growth. Take a deep breath, acknowledge the fear, and step forward anyway. You're stronger than you know.";
  } else if (questionLower.includes('fail') || questionLower.includes('failure') || questionLower.includes('mistake')) {
    wisdom = "Failure isn't the opposite of success – it's part of success. Every mistake is a lesson, every setback a setup for a comeback. I made plenty of mistakes, and each one taught me something valuable about who I am and what I'm capable of.";
  } else {
    wisdom = "Life has a way of working itself out, even when it doesn't seem like it. Trust the process, stay true to yourself, and remember that you carry the strength of all who came before you. You have everything you need within you.";
  }

  return `${vibe.intro}\n\n${wisdom}\n\nRemember, I'm always here for you. What else is on your mind?`;
};

export function WisdomGPTPage() {
  const { user, persona, wisdomChats, setWisdomChats } = useApp();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (wisdomChats.length > 0) {
      setMessages(wisdomChats);
    } else {
      setMessages([{
        id: 1,
        role: 'assistant',
        content: `Hello, dear one. I'm ${user?.firstName}'s Echo, here to share wisdom and guidance whenever you need it.\n\nAsk me anything – about life, love, decisions, or anything weighing on your heart. I'll do my best to respond with the values and experiences that shaped who ${user?.firstName} was.`,
        timestamp: new Date().toISOString(),
      }]);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

    const response = generateResponse(input, persona, user);

    const assistantMessage = {
      id: Date.now() + 1,
      role: 'assistant',
      content: response,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => {
      const updated = [...prev, assistantMessage];
      setWisdomChats(updated);
      return updated;
    });

    setIsTyping(false);
  };

  const handleClearChat = () => {
    const initialMessage = {
      id: 1,
      role: 'assistant',
      content: `Hello, dear one. I'm ${user?.firstName}'s Echo, here to share wisdom and guidance whenever you need it.\n\nAsk me anything – about life, love, decisions, or anything weighing on your heart.`,
      timestamp: new Date().toISOString(),
    };
    setMessages([initialMessage]);
    setWisdomChats([initialMessage]);
  };

  const handleSuggestedQuestion = (question) => {
    setInput(question);
    inputRef.current?.focus();
  };

  return (
    <PageTransition className="min-h-screen bg-gradient-to-b from-navy via-navy to-navy-dark flex flex-col">
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 py-8">
        <FadeIn>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-serif text-cream mb-1">
                Wisdom GPT
              </h1>
              <p className="text-cream/50 text-sm">
                Seek guidance from {user?.firstName}'s digital wisdom
              </p>
            </div>
            <motion.button
              onClick={handleClearChat}
              className="p-2 text-cream/40 hover:text-cream/70 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title="Clear conversation"
            >
              <Trash2 className="w-5 h-5" />
            </motion.button>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="flex-1 glass-card p-4 md:p-6 flex flex-col min-h-[60vh]">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              <AnimatePresence initial={false}>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex gap-3 max-w-[85%] ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${
                        message.role === 'user'
                          ? 'bg-gold/20'
                          : 'bg-gradient-to-br from-gold to-gold-light'
                      }`}>
                        {message.role === 'user' ? (
                          <User className="w-5 h-5 text-gold" />
                        ) : (
                          <Sparkles className="w-5 h-5 text-navy" />
                        )}
                      </div>
                      <div className={`rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-gold/20 text-cream'
                          : 'bg-navy-dark/50 text-cream/90'
                      }`}>
                        <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>
                        <p className="text-[10px] mt-2 opacity-40">
                          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center bg-gradient-to-br from-gold to-gold-light">
                      <Sparkles className="w-5 h-5 text-navy" />
                    </div>
                    <div className="bg-navy-dark/50 rounded-2xl px-4 py-3">
                      <div className="flex gap-1">
                        <motion.div
                          className="w-2 h-2 bg-gold/50 rounded-full"
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 0.5, repeat: 9999, delay: 0 }}
                        />
                        <motion.div
                          className="w-2 h-2 bg-gold/50 rounded-full"
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 0.5, repeat: 9999, delay: 0.15 }}
                        />
                        <motion.div
                          className="w-2 h-2 bg-gold/50 rounded-full"
                          animate={{ y: [0, -5, 0] }}
                          transition={{ duration: 0.5, repeat: 9999, delay: 0.3 }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {messages.length <= 1 && (
              <div className="mb-4">
                <p className="text-cream/40 text-sm mb-3">Suggested questions:</p>
                <div className="flex flex-wrap gap-2">
                  {suggestedQuestions.map((q, index) => {
                    const Icon = q.icon;
                    return (
                      <motion.button
                        key={index}
                        onClick={() => handleSuggestedQuestion(q.text)}
                        className="flex items-center gap-2 px-4 py-2 rounded-full bg-navy-dark/50 border border-gold/20 text-cream/70 text-sm hover:border-gold/40 transition-colors"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Icon className="w-4 h-4 text-gold/70" />
                        {q.text}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask for wisdom..."
                className="input-field flex-1"
                disabled={isTyping}
              />
              <motion.button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="btn-primary px-6 disabled:opacity-50"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Send className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </FadeIn>

        <FadeIn delay={0.2}>
          <p className="text-center text-cream/30 text-xs mt-4">
            Responses are generated based on {user?.firstName}'s stored values and personality traits.
            This is a simulation and does not represent actual AI consciousness.
          </p>
        </FadeIn>
      </div>
    </PageTransition>
  );
}
