import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Loader2, HelpCircle, Image } from 'lucide-react';
import { useApp } from '../context/AppContext';

const API_URL = import.meta.env.PROD ? '' : 'http://localhost:3001';

export function SupportChat() {
  const { user } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [isAdminTyping, setIsAdminTyping] = useState(false);
  const [pendingImage, setPendingImage] = useState(null);
  const [supportAvatar, setSupportAvatar] = useState({ name: 'Support Team', imageUrl: null });
  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const lastCheckRef = useRef(null);
  const fileInputRef = useRef(null);

  const shouldShow = user && user.role !== 'ADMIN';

  // Fetch support avatar settings
  const loadSupportAvatar = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/api/support/avatar`);
      if (res.ok) {
        const data = await res.json();
        setSupportAvatar({
          name: data.name || 'Support Team',
          imageUrl: data.imageUrl || null
        });
      }
    } catch (error) {
      console.error('Failed to load support avatar:', error);
    }
  }, []);

  // Load support avatar on mount
  useEffect(() => {
    loadSupportAvatar();
  }, [loadSupportAvatar]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChat = useCallback(async () => {
    try {
      setLoading(messages.length === 0);
      const token = localStorage.getItem('echotrail_token');
      const res = await fetch(`${API_URL}/api/support/chat`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const chat = await res.json();
        setMessages(chat.messages || []);
        setIsAdminTyping(chat.isAdminTyping || false);
        lastCheckRef.current = new Date().toISOString();
      }
    } catch (error) {
      console.error('Failed to load chat:', error);
    } finally {
      setLoading(false);
    }
  }, [messages.length]);

  const pollMessages = useCallback(async () => {
    try {
      const token = localStorage.getItem('echotrail_token');
      const res = await fetch(
        `${API_URL}/api/support/chat/poll?lastCheck=${lastCheckRef.current || ''}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          setMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id));
            const newMsgs = data.messages.filter(m => !existingIds.has(m.id));
            return [...prev, ...newMsgs];
          });
        }
        setIsAdminTyping(data.isAdminTyping || false);
        lastCheckRef.current = new Date().toISOString();
      }
    } catch (error) {
      console.error('Poll error:', error);
    }
  }, []);

  useEffect(() => {
    if (isOpen && shouldShow) {
      loadChat();
      pollIntervalRef.current = setInterval(pollMessages, 2000);
    } else {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    }

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [isOpen, shouldShow, loadChat, pollMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAdminTyping]);

  const sendTypingIndicator = useCallback(async () => {
    try {
      const token = localStorage.getItem('echotrail_token');
      await fetch(`${API_URL}/api/support/chat/typing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      });
    } catch (error) {
      // Ignore typing errors
    }
  }, []);

  const handleInputChange = (e) => {
    setNewMessage(e.target.value);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    sendTypingIndicator();
    typingTimeoutRef.current = setTimeout(() => {
      // Typing stopped
    }, 2000);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPendingImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !pendingImage) || sending) return;

    setSending(true);
    try {
      const token = localStorage.getItem('echotrail_token');
      const res = await fetch(`${API_URL}/api/support/chat/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          content: newMessage.trim(),
          imageUrl: pendingImage
        })
      });

      if (res.ok) {
        const msg = await res.json();
        setMessages(prev => [...prev, msg]);
        setNewMessage('');
        setPendingImage(null);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSending(false);
    }
  };

  if (!shouldShow) return null;

  return (
    <>
      {/* Chat Button */}
      <motion.button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-gold to-gold-light text-navy shadow-lg shadow-gold/30 flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: isOpen ? 0 : 1, scale: isOpen ? 0 : 1 }}
      >
        <HelpCircle className="w-6 h-6" />
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            className="fixed bottom-6 right-6 z-50 w-[360px] h-[500px] bg-navy border border-gold/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-gold/20 to-gold/10 px-4 py-3 border-b border-gold/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {supportAvatar.imageUrl ? (
                  <img
                    src={supportAvatar.imageUrl}
                    alt={supportAvatar.name}
                    className="w-10 h-10 rounded-full object-cover border-2 border-gold/30"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-gold" />
                  </div>
                )}
                <div>
                  <h3 className="text-cream font-medium text-sm">{supportAvatar.name}</h3>
                  <p className="text-cream/50 text-xs">
                    {isAdminTyping ? (
                      <span className="text-gold animate-pulse">{supportAvatar.name} is typing...</span>
                    ) : (
                      'We typically reply within minutes'
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-gold/10 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-cream/60" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <Loader2 className="w-6 h-6 text-gold animate-spin" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center mx-auto mb-4">
                    <MessageCircle className="w-8 h-8 text-gold/50" />
                  </div>
                  <p className="text-cream/60 text-sm">Start a conversation!</p>
                  <p className="text-cream/40 text-xs mt-1">We're here to help you.</p>
                </div>
              ) : (
                <>
                  {messages.map((msg) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                          msg.sender === 'user'
                            ? 'bg-gold text-navy rounded-br-md'
                            : 'bg-navy-light text-cream rounded-bl-md'
                        }`}
                      >
                        {msg.imageUrl && (
                          <img
                            src={msg.imageUrl}
                            alt="Attached"
                            className="max-w-full rounded-lg mb-2 cursor-pointer"
                            onClick={() => window.open(msg.imageUrl, '_blank')}
                          />
                        )}
                        {msg.content && <p className="text-sm">{msg.content}</p>}
                        <p className={`text-xs mt-1 ${msg.sender === 'user' ? 'text-navy/50' : 'text-cream/40'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </motion.div>
                  ))}

                  {/* Typing Indicator */}
                  {isAdminTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="bg-navy-light rounded-2xl rounded-bl-md px-4 py-3">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-gold/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-gold/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-gold/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Image Preview */}
            {pendingImage && (
              <div className="px-4 py-2 border-t border-gold/20 bg-navy-light/30">
                <div className="relative inline-block">
                  <img src={pendingImage} alt="Preview" className="h-20 rounded-lg" />
                  <button
                    onClick={() => setPendingImage(null)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 border-t border-gold/20">
              <div className="flex gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-10 h-10 rounded-xl bg-navy-light/50 border border-gold/20 flex items-center justify-center text-cream/50 hover:text-cream hover:border-gold/40 transition-colors"
                >
                  <Image className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={handleInputChange}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 bg-navy-light/50 border border-gold/20 rounded-xl text-cream placeholder-cream/30 text-sm focus:outline-none focus:border-gold/50"
                />
                <motion.button
                  type="submit"
                  disabled={(!newMessage.trim() && !pendingImage) || sending}
                  className="w-10 h-10 rounded-xl bg-gold text-navy flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </motion.button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
