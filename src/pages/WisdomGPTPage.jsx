import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Sparkles,
  User,
  Trash2,
  Heart,
  BookOpen,
  Compass,
  Volume2,
  VolumeX,
  Archive,
  ChevronDown,
  ChevronRight,
  Clock,
  MessageCircle,
  Loader2,
  X,
  Play,
  Pause,
  Check
} from 'lucide-react';
import { PageTransition, FadeIn } from '../components/PageTransition';
import { useApp } from '../context/AppContext';
import api from '../services/api';

const suggestedQuestions = [
  { icon: Heart, text: "What's your advice on finding love?" },
  { icon: BookOpen, text: "What's the most important lesson you learned?" },
  { icon: Compass, text: "How should I handle difficult decisions?" },
];

// Vibe options matching PersonaPage
const vibeOptions = [
  { id: 'compassionate', label: 'Compassionate', icon: '💗', color: 'from-pink-500 to-rose-500' },
  { id: 'strict', label: 'Strict', icon: '🛡️', color: 'from-blue-500 to-indigo-500' },
  { id: 'storyteller', label: 'Storyteller', icon: '📖', color: 'from-amber-500 to-orange-500' },
  { id: 'wise', label: 'Wise Mentor', icon: '✨', color: 'from-purple-500 to-violet-500' },
  { id: 'playful', label: 'Playful', icon: '😊', color: 'from-green-500 to-emerald-500' },
  { id: 'adventurous', label: 'Adventurous', icon: '🧭', color: 'from-cyan-500 to-teal-500' },
];

const ARCHIVE_TIMEOUT = 60 * 60 * 1000; // 60 minutes in ms

export function WisdomGPTPage() {
  const { user, persona, wisdomChats, setWisdomChats, avatarImages } = useApp();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [showAvatarSelector, setShowAvatarSelector] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [archivedChats, setArchivedChats] = useState([]);
  const [expandedArchive, setExpandedArchive] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const [ttsLoading, setTtsLoading] = useState(false);
  const [lastActivityTime, setLastActivityTime] = useState(Date.now());
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const audioRef = useRef(null);
  const archiveCheckRef = useRef(null);

  // Initialize with first avatar or active avatar
  useEffect(() => {
    if (avatarImages && avatarImages.length > 0 && !selectedAvatar) {
      const activeAvatar = avatarImages.find(a => a.isActive) || avatarImages[0];
      setSelectedAvatar(activeAvatar);
    }
  }, [avatarImages, selectedAvatar]);

  // Load archived chats from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('echotrail_archived_chats');
    if (saved) {
      try {
        setArchivedChats(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse archived chats:', e);
      }
    }
  }, []);

  // Save archived chats to localStorage
  const saveArchivedChats = useCallback((chats) => {
    localStorage.setItem('echotrail_archived_chats', JSON.stringify(chats));
    setArchivedChats(chats);
  }, []);

  // Check for archive timeout
  useEffect(() => {
    archiveCheckRef.current = setInterval(() => {
      const timeSinceActivity = Date.now() - lastActivityTime;
      if (timeSinceActivity >= ARCHIVE_TIMEOUT && messages.length > 1) {
        // Archive current chat
        const chatToArchive = {
          id: Date.now(),
          messages: [...messages],
          archivedAt: new Date().toISOString(),
          avatarId: selectedAvatar?.id,
          avatarLabel: selectedAvatar?.label || 'Unknown Avatar',
        };
        saveArchivedChats([chatToArchive, ...archivedChats]);

        // Clear current chat
        handleClearChat();
      }
    }, 60000); // Check every minute

    return () => {
      if (archiveCheckRef.current) {
        clearInterval(archiveCheckRef.current);
      }
    };
  }, [lastActivityTime, messages, archivedChats, selectedAvatar, saveArchivedChats]);

  // Initialize messages
  useEffect(() => {
    if (wisdomChats.length > 0) {
      setMessages(wisdomChats);
    } else {
      setMessages([getWelcomeMessage()]);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getWelcomeMessage = () => ({
    id: 1,
    role: 'assistant',
    content: `Hello, dear one. I'm ${user?.firstName}'s Echo, here to share wisdom and guidance whenever you need it.\n\nAsk me anything – about life, love, decisions, or anything weighing on your heart. I'll do my best to respond with the values and experiences that shaped who ${user?.firstName} was.`,
    timestamp: new Date().toISOString(),
  });

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    setLastActivityTime(Date.now());

    const userMessage = {
      id: Date.now(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    const messageToSend = input;
    setInput('');
    setIsTyping(true);

    try {
      // Call the backend API with selected avatar info
      const response = await api.sendWisdomMessage(messageToSend, {
        avatarId: selectedAvatar?.id,
        echoVibe: selectedAvatar?.echoVibe || persona.echoVibe || 'compassionate',
      });

      const assistantMessage = {
        id: response.assistantMessage?.id || Date.now() + 1,
        role: 'assistant',
        content: response.assistantMessage?.content || 'I apologize, but I had trouble formulating a response. Please try again.',
        timestamp: response.assistantMessage?.createdAt || new Date().toISOString(),
        avatarId: selectedAvatar?.id,
      };

      setMessages(prev => {
        const updated = [...prev, assistantMessage];
        setWisdomChats(updated);
        return updated;
      });
    } catch (error) {
      console.error('Failed to get wisdom response:', error);
      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'I apologize, but I had trouble connecting. Please try again.',
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => {
        const updated = [...prev, assistantMessage];
        setWisdomChats(updated);
        return updated;
      });
    }

    setIsTyping(false);
  };

  const handleClearChat = () => {
    const initialMessage = getWelcomeMessage();
    setMessages([initialMessage]);
    setWisdomChats([initialMessage]);
    setLastActivityTime(Date.now());
  };

  const handleArchiveChat = () => {
    if (messages.length <= 1) return;

    const chatToArchive = {
      id: Date.now(),
      messages: [...messages],
      archivedAt: new Date().toISOString(),
      avatarId: selectedAvatar?.id,
      avatarLabel: selectedAvatar?.label || 'Unknown Avatar',
    };
    saveArchivedChats([chatToArchive, ...archivedChats]);
    handleClearChat();
  };

  const handleDeleteArchivedChat = (chatId) => {
    const updated = archivedChats.filter(c => c.id !== chatId);
    saveArchivedChats(updated);
    if (expandedArchive === chatId) {
      setExpandedArchive(null);
    }
  };

  const handleSuggestedQuestion = (question) => {
    setInput(question);
    inputRef.current?.focus();
    setLastActivityTime(Date.now());
  };

  // Text-to-Speech functionality
  const handleSpeak = async (message) => {
    if (speakingMessageId === message.id && isSpeaking) {
      // Stop current playback
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      setIsSpeaking(false);
      setSpeakingMessageId(null);
      return;
    }

    // Check if we have a voice clone
    if (!persona.elevenlabsVoiceId) {
      // Use browser's built-in TTS as fallback
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(message.content);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.onend = () => {
          setIsSpeaking(false);
          setSpeakingMessageId(null);
        };
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
        setSpeakingMessageId(message.id);
      }
      return;
    }

    // Use ElevenLabs voice clone
    setTtsLoading(true);
    setSpeakingMessageId(message.id);

    try {
      const audioBlob = await api.textToSpeech(message.content);
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.pause();
      }

      audioRef.current = new Audio(audioUrl);
      audioRef.current.onended = () => {
        setIsSpeaking(false);
        setSpeakingMessageId(null);
        URL.revokeObjectURL(audioUrl);
      };
      audioRef.current.onerror = () => {
        setIsSpeaking(false);
        setSpeakingMessageId(null);
        setTtsLoading(false);
      };

      await audioRef.current.play();
      setIsSpeaking(true);
    } catch (error) {
      console.error('TTS failed:', error);
      // Fallback to browser TTS
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(message.content);
        utterance.rate = 0.9;
        utterance.onend = () => {
          setIsSpeaking(false);
          setSpeakingMessageId(null);
        };
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
      }
    } finally {
      setTtsLoading(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const currentVibe = selectedAvatar?.echoVibe
    ? vibeOptions.find(v => v.id === selectedAvatar.echoVibe)
    : vibeOptions.find(v => v.id === persona.echoVibe) || vibeOptions[0];

  return (
    <PageTransition className="min-h-screen bg-gradient-to-b from-navy via-navy to-navy-dark flex flex-col">
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-4 py-8">
        <FadeIn>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              {/* Avatar Selector */}
              {avatarImages && avatarImages.length > 0 && (
                <div className="relative">
                  <motion.button
                    onClick={() => setShowAvatarSelector(!showAvatarSelector)}
                    className="flex items-center gap-3 p-2 pr-4 rounded-xl bg-navy-dark/50 border border-gold/20 hover:border-gold/40 transition-colors"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="w-10 h-10 rounded-lg overflow-hidden border-2 border-gold/40">
                      <img
                        src={selectedAvatar?.imageData || selectedAvatar?.image}
                        alt={selectedAvatar?.label || 'Avatar'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="text-left">
                      <p className="text-cream text-sm font-medium">
                        {selectedAvatar?.label || 'Select Avatar'}
                      </p>
                      <p className="text-cream/50 text-xs flex items-center gap-1">
                        <span>{currentVibe?.icon}</span>
                        {currentVibe?.label}
                      </p>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-cream/50 transition-transform ${showAvatarSelector ? 'rotate-180' : ''}`} />
                  </motion.button>

                  {/* Avatar Dropdown */}
                  <AnimatePresence>
                    {showAvatarSelector && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 mt-2 w-64 glass-card p-2 z-50"
                      >
                        <p className="text-cream/50 text-xs px-2 py-1 mb-1">Choose an avatar to chat with:</p>
                        {avatarImages.map((avatar) => {
                          const avatarVibe = vibeOptions.find(v => v.id === avatar.echoVibe) || vibeOptions[0];
                          return (
                            <motion.button
                              key={avatar.id}
                              onClick={() => {
                                setSelectedAvatar(avatar);
                                setShowAvatarSelector(false);
                              }}
                              className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                                selectedAvatar?.id === avatar.id
                                  ? 'bg-gold/20 border border-gold/40'
                                  : 'hover:bg-navy-light/50'
                              }`}
                              whileHover={{ scale: 1.02 }}
                            >
                              <div className="w-12 h-12 rounded-lg overflow-hidden border-2 border-gold/30">
                                <img
                                  src={avatar.imageData || avatar.image}
                                  alt={avatar.label}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div className="flex-1 text-left">
                                <p className="text-cream text-sm font-medium">
                                  {avatar.label || 'Unnamed Avatar'}
                                </p>
                                <p className="text-cream/50 text-xs flex items-center gap-1">
                                  <span>{avatarVibe.icon}</span>
                                  {avatarVibe.label}
                                </p>
                              </div>
                              {selectedAvatar?.id === avatar.id && (
                                <Check className="w-4 h-4 text-gold" />
                              )}
                            </motion.button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              <div>
                <h1 className="text-2xl md:text-3xl font-serif text-cream mb-1">
                  Wisdom GPT
                </h1>
                <p className="text-cream/50 text-sm">
                  Seek guidance from {user?.firstName}'s digital wisdom
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Archive Button */}
              <motion.button
                onClick={() => setShowArchive(!showArchive)}
                className={`p-2 transition-colors rounded-lg ${
                  showArchive ? 'bg-gold/20 text-gold' : 'text-cream/40 hover:text-cream/70'
                }`}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                title="View archived chats"
              >
                <Archive className="w-5 h-5" />
                {archivedChats.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-gold text-navy text-[10px] font-bold rounded-full flex items-center justify-center">
                    {archivedChats.length}
                  </span>
                )}
              </motion.button>

              {/* Archive Current Chat */}
              {messages.length > 1 && (
                <motion.button
                  onClick={handleArchiveChat}
                  className="p-2 text-cream/40 hover:text-cream/70 transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  title="Archive this conversation"
                >
                  <Clock className="w-5 h-5" />
                </motion.button>
              )}

              {/* Clear Chat */}
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
          </div>
        </FadeIn>

        {/* Archive View */}
        <AnimatePresence>
          {showArchive && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <FadeIn>
                <div className="glass-card p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-cream font-serif text-lg flex items-center gap-2">
                      <Archive className="w-5 h-5 text-gold" />
                      Archived Conversations
                    </h3>
                    <button
                      onClick={() => setShowArchive(false)}
                      className="text-cream/50 hover:text-cream"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {archivedChats.length === 0 ? (
                    <p className="text-cream/50 text-sm text-center py-4">
                      No archived conversations yet. Chats are automatically archived after 60 minutes of inactivity.
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {archivedChats.map((chat) => (
                        <div key={chat.id} className="bg-navy-dark/50 rounded-lg overflow-hidden">
                          <button
                            onClick={() => setExpandedArchive(expandedArchive === chat.id ? null : chat.id)}
                            className="w-full p-3 flex items-center justify-between hover:bg-navy-light/30 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <MessageCircle className="w-4 h-4 text-gold/60" />
                              <div className="text-left">
                                <p className="text-cream text-sm">
                                  {chat.messages.length - 1} messages • {chat.avatarLabel}
                                </p>
                                <p className="text-cream/40 text-xs">
                                  {new Date(chat.archivedAt).toLocaleDateString()} at {new Date(chat.archivedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <motion.button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteArchivedChat(chat.id);
                                }}
                                className="p-1 text-red-400/60 hover:text-red-400"
                                whileHover={{ scale: 1.1 }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </motion.button>
                              <ChevronRight className={`w-4 h-4 text-cream/50 transition-transform ${expandedArchive === chat.id ? 'rotate-90' : ''}`} />
                            </div>
                          </button>

                          <AnimatePresence>
                            {expandedArchive === chat.id && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t border-gold/10"
                              >
                                <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
                                  {chat.messages.slice(1).map((msg, idx) => (
                                    <div key={idx} className={`text-sm ${msg.role === 'user' ? 'text-gold/80' : 'text-cream/70'}`}>
                                      <span className="font-medium">{msg.role === 'user' ? 'You: ' : 'Echo: '}</span>
                                      <span className="line-clamp-2">{msg.content}</span>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </FadeIn>
            </motion.div>
          )}
        </AnimatePresence>

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
                      <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden ${
                        message.role === 'user'
                          ? 'bg-gold/20'
                          : selectedAvatar
                          ? 'border-2 border-gold/40'
                          : 'bg-gradient-to-br from-gold to-gold-light'
                      }`}>
                        {message.role === 'user' ? (
                          <User className="w-5 h-5 text-gold" />
                        ) : selectedAvatar ? (
                          <img
                            src={selectedAvatar.imageData || selectedAvatar.image}
                            alt=""
                            className="w-full h-full object-cover"
                          />
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
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-[10px] opacity-40">
                            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                          {message.role === 'assistant' && (
                            <motion.button
                              onClick={() => handleSpeak(message)}
                              disabled={ttsLoading && speakingMessageId === message.id}
                              className={`p-1 rounded transition-colors ${
                                speakingMessageId === message.id && isSpeaking
                                  ? 'text-gold'
                                  : 'text-cream/30 hover:text-cream/60'
                              }`}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              title="Read aloud"
                            >
                              {ttsLoading && speakingMessageId === message.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : speakingMessageId === message.id && isSpeaking ? (
                                <VolumeX className="w-4 h-4" />
                              ) : (
                                <Volume2 className="w-4 h-4" />
                              )}
                            </motion.button>
                          )}
                        </div>
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
                    <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden ${
                      selectedAvatar ? 'border-2 border-gold/40' : 'bg-gradient-to-br from-gold to-gold-light'
                    }`}>
                      {selectedAvatar ? (
                        <img
                          src={selectedAvatar.imageData || selectedAvatar.image}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Sparkles className="w-5 h-5 text-navy" />
                      )}
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
                onChange={(e) => {
                  setInput(e.target.value);
                  setLastActivityTime(Date.now());
                }}
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

        {/* Auto-archive notice */}
        <p className="text-center text-cream/30 text-xs mt-4">
          Conversations are automatically archived after 60 minutes of inactivity
        </p>
      </div>
    </PageTransition>
  );
}
