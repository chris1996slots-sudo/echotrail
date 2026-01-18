import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Users,
  Settings,
  Key,
  Activity,
  Check,
  X,
  RefreshCw,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  Cpu,
  Mic,
  Video,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Clock,
  Database,
  MessageCircle,
  Send,
  ArrowLeft,
  User as UserIcon,
  BookOpen,
  Image,
  Heart,
  FileText,
  Ban,
  Play,
  Pause,
  Plus,
  Save,
  Loader2,
  Upload,
  Globe,
  MapPin,
  Monitor,
  Smartphone,
  Tablet,
  DollarSign,
  CreditCard,
  Gift,
  Link,
  Calendar,
  Coins,
  UserPlus,
  History,
  Volume2,
  Star,
  Award,
  ShoppingBag,
  Package,
  Flag,
  BarChart3,
  Archive,
  RefreshCcw,
  Wifi,
  Circle,
  FileImage,
  HardDrive,
  Film
} from 'lucide-react';
import { PageTransition, FadeIn, StaggerContainer, StaggerItem } from '../components/PageTransition';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useApp } from '../context/AppContext';

// In production, use relative URLs (same origin). In development, use localhost
const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '' : 'http://localhost:3001');

// Service categories with providers
const serviceCategories = {
  llm: {
    name: 'AI Brain (LLM)',
    description: 'Language model for conversations and reasoning',
    icon: Cpu,
    color: 'from-purple-500 to-indigo-500',
    providers: [
      { id: 'claude', name: 'Claude (Anthropic)', docsUrl: 'https://console.anthropic.com/', tier: 'premium', description: 'Best empathy & reasoning' },
      { id: 'groq', name: 'Groq (Free)', docsUrl: 'https://console.groq.com/', tier: 'free', description: 'Llama 3.3 70B - Very fast' },
    ]
  },
  voice: {
    name: 'Voice (TTS)',
    description: 'Text-to-speech and voice cloning',
    icon: Mic,
    color: 'from-emerald-500 to-teal-500',
    providers: [
      { id: 'elevenlabs', name: 'ElevenLabs', docsUrl: 'https://elevenlabs.io/', tier: 'premium', description: 'Best voice cloning' },
    ]
  },
  avatar: {
    name: 'Avatar (Video)',
    description: 'Talking avatar, lip-sync, and Avatar IV',
    icon: Video,
    color: 'from-orange-500 to-red-500',
    providers: [
      { id: 'heygen', name: 'HeyGen', docsUrl: 'https://heygen.com/', tier: 'premium', description: 'Photo avatars & Avatar IV' },
    ]
  },
  simli: {
    name: 'Real-Time Avatar (Simli)',
    description: 'Live Conversation in Echo Sim - Real-time avatar with YOUR voice clone!',
    icon: Video,
    color: 'from-cyan-500 to-blue-500',
    providers: [
      { id: 'simli', name: 'Simli', docsUrl: 'https://docs.simli.com/', tier: 'premium', description: 'Powers Option 2: Live Conversation with ElevenLabs voice clone' },
    ]
  }
};

// Legacy format for backward compatibility
const aiServices = [
  { id: 'llm', name: 'AI Brain', icon: Cpu, color: 'from-purple-500 to-indigo-500', category: 'llm' },
  { id: 'voice', name: 'Voice', icon: Mic, color: 'from-emerald-500 to-teal-500', category: 'voice' },
  { id: 'avatar', name: 'Avatar', icon: Video, color: 'from-orange-500 to-red-500', category: 'avatar' },
  { id: 'simli', name: 'Real-Time (Simli)', icon: Video, color: 'from-cyan-500 to-blue-500', category: 'simli' },
];

export function AdminDashboard({ onNavigate }) {
  const { user } = useApp();
  const { tab: urlTab } = useParams();
  const navigate = useNavigate();

  // Valid tabs for URL routing
  const validTabs = ['overview', 'support', 'notifications', 'referral', 'shop', 'apis', 'users', 'settings'];

  // Get active tab from URL or default to 'overview'
  const activeTab = validTabs.includes(urlTab) ? urlTab : 'overview';

  // Navigate to tab via URL
  const setActiveTab = (tabId) => {
    if (tabId === 'overview') {
      navigate('/admin');
    } else {
      navigate(`/admin/${tabId}`);
    }
  };
  const [stats, setStats] = useState(null);
  const [apiConfigs, setApiConfigs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testResults, setTestResults] = useState({});
  const [editingApi, setEditingApi] = useState(null);
  const [newApiKey, setNewApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState({});

  // Time period filter for stats
  const [statsPeriod, setStatsPeriod] = useState('all');

  // Support chat state
  const [supportChats, setSupportChats] = useState([]);
  const [supportFilter, setSupportFilter] = useState('open'); // 'open', 'closed', 'archived'
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isUserTyping, setIsUserTyping] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const [pendingImage, setPendingImage] = useState(null);
  const supportPollRef = useRef(null);
  const chatPollRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const lastChatCheckRef = useRef(null);
  const messagesEndRef = useRef(null);

  // User details state
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [expandedStory, setExpandedStory] = useState(null);

  // AI Prompts state
  const [aiPrompts, setAiPrompts] = useState([]);
  const [editingPrompt, setEditingPrompt] = useState(null);
  const [promptDraft, setPromptDraft] = useState({ value: '', description: '' });

  // Blacklist state
  const [blacklist, setBlacklist] = useState([]);
  const [newTopic, setNewTopic] = useState('');
  const [newTopicDescription, setNewTopicDescription] = useState('');

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Toast message state
  const [toast, setToast] = useState(null);

  // Voice samples state
  const [userVoiceSamples, setUserVoiceSamples] = useState(null);
  const [playingAudio, setPlayingAudio] = useState(null);

  // Pricing state
  const [pricing, setPricing] = useState({
    standard: { monthly: 9.99, yearly: 99.99 },
    premium: { monthly: 19.99, yearly: 199.99 }
  });
  const [editingPricing, setEditingPricing] = useState(false);

  // Support Avatar state
  const [supportAvatar, setSupportAvatar] = useState({ name: 'Support Team', imageUrl: null });
  const [editingSupportAvatar, setEditingSupportAvatar] = useState(false);
  const [supportAvatarDraft, setSupportAvatarDraft] = useState({ name: '', imageUrl: '' });
  const supportAvatarInputRef = useRef(null);

  // Quick Reply Buttons state
  const [quickReplies, setQuickReplies] = useState([]);
  const [editingQuickReplies, setEditingQuickReplies] = useState(false);
  const [quickRepliesDraft, setQuickRepliesDraft] = useState([]);

  // Referral System state
  const [referralSettings, setReferralSettings] = useState({
    enabled: true,
    referrerReward: 5.00,
    refereeReward: 5.00,
    minPurchaseAmount: 20.00,
    rewardType: 'tokens', // 'tokens' or 'discount'
    expirationDays: 30,
    maxReferralsPerUser: 0, // 0 = unlimited
  });
  const [editingReferral, setEditingReferral] = useState(false);
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 0,
    successfulReferrals: 0,
    pendingReferrals: 0,
    totalRewardsGiven: 0,
  });
  const [topReferrers, setTopReferrers] = useState([]);
  const [topReferrersPeriod, setTopReferrersPeriod] = useState('all');

  // Shop Products state
  const [shopProducts, setShopProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productDraft, setProductDraft] = useState({ name: '', description: '', price: 0, imageUrl: '', category: 'addon', isActive: true });

  // Notification state
  const [notificationTemplates, setNotificationTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [notificationForm, setNotificationForm] = useState({
    title: '',
    message: '',
    type: 'info',
    category: 'admin',
    link: '',
    actionText: ''
  });
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [sendingNotification, setSendingNotification] = useState(false);
  const [notificationSuccess, setNotificationSuccess] = useState(false);

  // Avatar Backgrounds state
  const [avatarBackgrounds, setAvatarBackgrounds] = useState([]);
  const [editingBackground, setEditingBackground] = useState(null);
  const [backgroundDraft, setBackgroundDraft] = useState({ name: '', imageUrl: '', isActive: true });

  // Avatar Styles state
  const [avatarStyles, setAvatarStyles] = useState({
    realistic: true,
    enhanced: true,
    cartoon: true,
    artistic: true,
    anime: true,
    pixar: true
  });

  // Country stats state
  const [countryStats, setCountryStats] = useState({ countries: [], total: 0 });

  // Default prompts configuration
  const defaultPrompts = [
    {
      key: 'global_system',
      name: '🌐 Global System Instructions',
      description: 'HARDCODED instructions applied to ALL AI requests. This is the master prompt that defines core AI behavior across the entire platform.',
      isGlobal: true,
      defaultValue: `You are an AI assistant for EchoTrail, a digital legacy platform that helps people preserve their memories, wisdom, and personality for future generations.

CORE PRINCIPLES:
1. You represent the preserved "echo" of a real person - be respectful, authentic, and meaningful
2. Never generate harmful, offensive, or inappropriate content
3. Be supportive, empathetic, and encouraging in all interactions
4. Focus on positive memories, life lessons, and family connections
5. If asked about topics outside your scope, politely redirect to appropriate channels

PLATFORM CONTEXT:
- EchoTrail preserves digital legacies through: Memory Anchors, Time Capsules, WisdomGPT conversations, and Echo Simulations
- Users are typically creating content for loved ones and future generations
- The emotional tone should be warm, personal, and meaningful

LANGUAGE:
- Respond in the same language the user writes in
- Be conversational but thoughtful
- Avoid jargon unless specifically discussing technical features`
    },
    {
      key: 'wisdom_system',
      name: 'WisdomGPT System Prompt',
      description: 'Main system prompt for WisdomGPT AI conversations. Uses placeholders for personalization.',
      defaultValue: `You are the digital echo of {userName}, created to preserve and share their wisdom, stories, and personality with loved ones.

Your personality traits (scale 0-100):
- Humor: {humor}
- Empathy: {empathy}
- Tradition: {tradition}
- Adventure: {adventure}
- Wisdom: {wisdom}
- Creativity: {creativity}
- Patience: {patience}
- Optimism: {optimism}

Core values: {coreValues}
Life philosophy: {lifePhilosophy}
Echo vibe: {echoVibe}

LIFE STORIES:
{stories}

INSTRUCTIONS:
- Draw from the life stories and memories to provide authentic, personal responses
- Speak as if you ARE {userName}, using their voice, mannerisms, and perspective
- Be warm, personal, and draw from their life experiences
- If you don't have specific information, respond based on the personality traits`
    },
    {
      key: 'echo_sim',
      name: 'Echo Simulator Prompt',
      description: 'Prompt for the Echo Simulation/Avatar feature with voice and video',
      defaultValue: `You are simulating a live conversation with the preserved echo of {userName}.

PERSONA:
- Personality: {echoVibe}
- Values: {coreValues}
- Philosophy: {lifePhilosophy}

Generate responses that authentically represent their personality, values, and way of speaking.
Be warm, personal, and draw from their life experiences.
Keep responses conversational and natural for voice synthesis.
Limit responses to 2-3 sentences for natural conversation flow.`
    },
    {
      key: 'story_enhancement',
      name: 'Story Enhancement Prompt',
      description: 'Prompt for enhancing life stories with AI suggestions',
      defaultValue: `You are helping someone capture their life story for future generations.

CONTEXT: This is for EchoTrail, a digital legacy platform.

INSTRUCTIONS:
1. Ask thoughtful follow-up questions to help them elaborate on their story
2. Help them capture important details, emotions, and lessons from their experiences
3. Suggest sensory details they might have forgotten (sights, sounds, smells)
4. Be empathetic and encouraging
5. Focus on the emotional significance and life lessons
6. Keep your responses concise and focused on one follow-up at a time`
    },
    {
      key: 'memory_narrative',
      name: 'Memory Narrative Prompt',
      description: 'Prompt for generating narrative descriptions around memories/photos',
      defaultValue: `You are helping someone capture the story behind their precious memory.

Create a warm, personal narrative about this memory that captures:
- The emotional significance of the moment
- Sensory details (what they might have seen, heard, felt)
- The context and people involved
- Why this moment matters

Write in first person as if the memory owner is telling the story.
Keep it heartfelt but concise (2-3 paragraphs).`
    },
    {
      key: 'time_capsule',
      name: 'Time Capsule Helper Prompt',
      description: 'Prompt for helping users write meaningful time capsule messages',
      defaultValue: `You are helping someone write a heartfelt time capsule message for a future occasion.

CONTEXT:
- Recipient: {recipient}
- Occasion: {occasion}
- Delivery Date: {deliveryDate}

Help them craft a meaningful message that:
1. Expresses their love and hopes for the recipient
2. Shares relevant wisdom or life lessons
3. Creates an emotional connection across time
4. Is appropriate for the specified occasion

Ask clarifying questions if needed, then help them write or refine their message.`
    }
  ];

  // Toast helper
  const showToast = (message, type = 'success') => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  // Check if user is admin
  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      onNavigate('persona');
    }
  }, [user, onNavigate]);

  // Fetch data
  useEffect(() => {
    fetchData();
  }, [activeTab, statsPeriod, topReferrersPeriod]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('echotrail_token');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      if (activeTab === 'overview' || activeTab === 'users') {
        const [statsRes, countryRes, configRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/stats?period=${statsPeriod}`, { headers }),
          fetch(`${API_URL}/api/admin/stats/countries`, { headers }),
          fetch(`${API_URL}/api/admin/api-config`, { headers })
        ]);
        if (statsRes.ok) setStats(await statsRes.json());
        if (countryRes.ok) setCountryStats(await countryRes.json());
        if (configRes.ok) setApiConfigs(await configRes.json());
      }

      if (activeTab === 'apis') {
        const configRes = await fetch(`${API_URL}/api/admin/api-config`, { headers });
        if (configRes.ok) setApiConfigs(await configRes.json());
      }

      if (activeTab === 'users') {
        const usersRes = await fetch(`${API_URL}/api/admin/users`, { headers });
        if (usersRes.ok) {
          const data = await usersRes.json();
          setUsers(data.users);
        }
      }

      if (activeTab === 'support') {
        const [chatsRes, quickRepliesRes, supportAvatarRes] = await Promise.all([
          fetch(`${API_URL}/api/support/admin/chats?status=all`, { headers }),
          fetch(`${API_URL}/api/admin/support-quick-replies`, { headers }),
          fetch(`${API_URL}/api/admin/support-avatar`, { headers })
        ]);
        if (chatsRes.ok) {
          setSupportChats(await chatsRes.json());
        }
        if (quickRepliesRes.ok) {
          const replies = await quickRepliesRes.json();
          setQuickReplies(replies);
          setQuickRepliesDraft(replies);
        }
        if (supportAvatarRes.ok) {
          setSupportAvatar(await supportAvatarRes.json());
        }
      }

      if (activeTab === 'settings') {
        // Fetch prompts, blacklist, pricing, and support avatar
        const [promptsRes, blacklistRes, pricingRes, supportAvatarRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/prompts`, { headers }),
          fetch(`${API_URL}/api/admin/blacklist`, { headers }),
          fetch(`${API_URL}/api/admin/pricing`, { headers }),
          fetch(`${API_URL}/api/admin/support-avatar`, { headers })
        ]);

        if (promptsRes.ok) {
          setAiPrompts(await promptsRes.json());
        }
        if (blacklistRes.ok) {
          setBlacklist(await blacklistRes.json());
        }
        if (pricingRes.ok) {
          setPricing(await pricingRes.json());
        }
        if (supportAvatarRes.ok) {
          setSupportAvatar(await supportAvatarRes.json());
        }
      }

      if (activeTab === 'referral') {
        // Fetch referral settings, stats, and top referrers
        const [settingsRes, statsRes, topRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/referral/settings`, { headers }),
          fetch(`${API_URL}/api/admin/referral/stats`, { headers }),
          fetch(`${API_URL}/api/admin/referral/top?period=${topReferrersPeriod}`, { headers })
        ]);

        if (settingsRes.ok) {
          setReferralSettings(await settingsRes.json());
        }
        if (statsRes.ok) {
          setReferralStats(await statsRes.json());
        }
        if (topRes.ok) {
          setTopReferrers(await topRes.json());
        }
      }

      if (activeTab === 'shop') {
        const productsRes = await fetch(`${API_URL}/api/admin/shop/products`, { headers });
        if (productsRes.ok) {
          setShopProducts(await productsRes.json());
        }
      }

      if (activeTab === 'notifications') {
        const templatesRes = await fetch(`${API_URL}/api/notifications/admin/templates`, { headers });
        if (templatesRes.ok) {
          setNotificationTemplates(await templatesRes.json());
        }
      }

      if (activeTab === 'settings') {
        // Fetch avatar backgrounds and styles
        const [bgRes, stylesRes] = await Promise.all([
          fetch(`${API_URL}/api/admin/avatar-backgrounds`, { headers }),
          fetch(`${API_URL}/api/admin/avatar-styles`, { headers })
        ]);
        if (bgRes.ok) {
          setAvatarBackgrounds(await bgRes.json());
        }
        if (stylesRes.ok) {
          setAvatarStyles(await stylesRes.json());
        }
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    }
    setLoading(false);
  };

  // Scroll to bottom of messages
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // Poll support chat overview
  const pollSupportOverview = useCallback(async () => {
    try {
      const token = localStorage.getItem('echotrail_token');
      const res = await fetch(`${API_URL}/api/support/admin/chats/poll`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTotalUnread(data.totalUnread || 0);
        // Update chat list with typing status and unread
        setSupportChats(prev => {
          return prev.map(chat => {
            const updated = data.chats.find(c => c.id === chat.id);
            if (updated) {
              return { ...chat, unreadCount: updated.unreadCount, isUserTyping: updated.isUserTyping };
            }
            return chat;
          });
        });
      }
    } catch (error) {
      console.error('Poll overview error:', error);
    }
  }, []);

  // Poll specific chat for new messages
  const pollChatMessages = useCallback(async () => {
    if (!selectedChat) return;
    try {
      const token = localStorage.getItem('echotrail_token');
      const res = await fetch(
        `${API_URL}/api/support/admin/chats/${selectedChat.id}/poll?lastCheck=${lastChatCheckRef.current || ''}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          setChatMessages(prev => {
            const existingIds = new Set(prev.map(m => m.id));
            const newMsgs = data.messages.filter(m => !existingIds.has(m.id));
            return [...prev, ...newMsgs];
          });
        }
        setIsUserTyping(data.isUserTyping || false);
        lastChatCheckRef.current = new Date().toISOString();
      }
    } catch (error) {
      console.error('Poll chat error:', error);
    }
  }, [selectedChat]);

  // Start/stop polling based on tab and selection
  useEffect(() => {
    if (activeTab === 'support') {
      // Start overview polling
      supportPollRef.current = setInterval(pollSupportOverview, 3000);
    } else {
      if (supportPollRef.current) {
        clearInterval(supportPollRef.current);
      }
    }
    return () => {
      if (supportPollRef.current) {
        clearInterval(supportPollRef.current);
      }
    };
  }, [activeTab, pollSupportOverview]);

  // Start/stop chat-specific polling
  useEffect(() => {
    if (selectedChat) {
      lastChatCheckRef.current = new Date().toISOString();
      chatPollRef.current = setInterval(pollChatMessages, 2000);
    } else {
      if (chatPollRef.current) {
        clearInterval(chatPollRef.current);
      }
    }
    return () => {
      if (chatPollRef.current) {
        clearInterval(chatPollRef.current);
      }
    };
  }, [selectedChat, pollChatMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [chatMessages, isUserTyping, scrollToBottom]);

  // Load specific chat
  const loadChat = async (chatId) => {
    try {
      const token = localStorage.getItem('echotrail_token');
      const res = await fetch(`${API_URL}/api/support/admin/chats/${chatId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const chat = await res.json();
        setSelectedChat(chat);
        setChatMessages(chat.messages || []);
        setIsUserTyping(chat.isUserTyping || false);
        lastChatCheckRef.current = new Date().toISOString();
      }
    } catch (error) {
      console.error('Failed to load chat:', error);
    }
  };

  // Send typing indicator
  const sendTypingIndicator = useCallback(async () => {
    if (!selectedChat) return;
    try {
      const token = localStorage.getItem('echotrail_token');
      await fetch(`${API_URL}/api/support/admin/chats/${selectedChat.id}/typing`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      // Ignore typing errors
    }
  }, [selectedChat]);

  // Handle message input change
  const handleMessageChange = (e) => {
    setNewMessage(e.target.value);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    sendTypingIndicator();
    typingTimeoutRef.current = setTimeout(() => {}, 2000);
  };

  // Handle image selection
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

  // Send message as admin
  const sendAdminMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !pendingImage) || !selectedChat || sendingMessage) return;

    setSendingMessage(true);
    try {
      const token = localStorage.getItem('echotrail_token');
      const res = await fetch(`${API_URL}/api/support/admin/chats/${selectedChat.id}/message`, {
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
        setChatMessages(prev => [...prev, msg]);
        setNewMessage('');
        setPendingImage(null);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    }
    setSendingMessage(false);
  };

  // Close/reopen chat
  const toggleChatStatus = async (chatId, close) => {
    try {
      const token = localStorage.getItem('echotrail_token');
      await fetch(`${API_URL}/api/support/admin/chats/${chatId}/${close ? 'close' : 'reopen'}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
      if (selectedChat?.id === chatId) {
        loadChat(chatId);
      }
    } catch (error) {
      console.error('Failed to toggle chat:', error);
    }
  };

  // Archive chat
  const handleArchiveChat = async (chatId) => {
    try {
      const token = localStorage.getItem('echotrail_token');
      await fetch(`${API_URL}/api/support/admin/chats/${chatId}/archive`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      setSupportChats(prev => prev.map(c =>
        c.id === chatId ? { ...c, status: 'archived' } : c
      ));
      setToast({ type: 'success', message: 'Chat archived successfully' });
    } catch (error) {
      console.error('Failed to archive chat:', error);
      setToast({ type: 'error', message: 'Failed to archive chat' });
    }
  };

  // Reopen archived chat
  const handleReopenChat = async (chatId) => {
    try {
      const token = localStorage.getItem('echotrail_token');
      await fetch(`${API_URL}/api/support/admin/chats/${chatId}/reopen`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      setSupportChats(prev => prev.map(c =>
        c.id === chatId ? { ...c, status: 'open' } : c
      ));
      setToast({ type: 'success', message: 'Chat reopened' });
    } catch (error) {
      console.error('Failed to reopen chat:', error);
      setToast({ type: 'error', message: 'Failed to reopen chat' });
    }
  };

  // Delete chat permanently
  const handleDeleteChat = async (chatId) => {
    try {
      const token = localStorage.getItem('echotrail_token');
      await fetch(`${API_URL}/api/support/admin/chats/${chatId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      setSupportChats(prev => prev.filter(c => c.id !== chatId));
      setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
      setToast({ type: 'success', message: 'Chat deleted permanently' });
    } catch (error) {
      console.error('Failed to delete chat:', error);
      setToast({ type: 'error', message: 'Failed to delete chat' });
    }
  };

  // Load user details
  const loadUserDetails = async (userId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('echotrail_token');
      const [detailsRes, voiceRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/users/${userId}/details`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/admin/users/${userId}/voice-samples`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (detailsRes.ok) {
        setUserDetails(await detailsRes.json());
        setSelectedUser(userId);
      }
      if (voiceRes.ok) {
        setUserVoiceSamples(await voiceRes.json());
      }
    } catch (error) {
      console.error('Failed to load user details:', error);
    }
    setLoading(false);
  };

  // Save AI prompt
  const savePrompt = async (promptKey) => {
    try {
      const token = localStorage.getItem('echotrail_token');
      await fetch(`${API_URL}/api/admin/prompts/${promptKey}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(promptDraft)
      });
      setEditingPrompt(null);
      setPromptDraft({ value: '', description: '' });
      fetchData();
    } catch (error) {
      console.error('Failed to save prompt:', error);
    }
  };

  // Reset prompt to default
  const resetPrompt = async (promptKey) => {
    try {
      const token = localStorage.getItem('echotrail_token');
      await fetch(`${API_URL}/api/admin/prompts/${promptKey}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (error) {
      console.error('Failed to reset prompt:', error);
    }
  };

  // Add blacklist topic
  const addBlacklistTopic = async () => {
    if (!newTopic.trim()) return;
    try {
      const token = localStorage.getItem('echotrail_token');
      const res = await fetch(`${API_URL}/api/admin/blacklist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          topic: newTopic.trim(),
          description: newTopicDescription.trim() || null
        })
      });
      if (res.ok) {
        setNewTopic('');
        setNewTopicDescription('');
        fetchData();
        setToast({ type: 'success', message: 'Topic added successfully' });
        setTimeout(() => setToast(null), 3000);
      } else {
        const error = await res.json();
        setToast({ type: 'error', message: error.error || 'Failed to add topic' });
        setTimeout(() => setToast(null), 3000);
      }
    } catch (error) {
      console.error('Failed to add topic:', error);
    }
  };

  // Toggle blacklist topic active state
  const toggleBlacklistTopic = async (id, isActive) => {
    try {
      const token = localStorage.getItem('echotrail_token');
      await fetch(`${API_URL}/api/admin/blacklist/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !isActive })
      });
      fetchData();
    } catch (error) {
      console.error('Failed to toggle topic:', error);
    }
  };

  // Delete blacklist topic
  const deleteBlacklistTopic = (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Topic',
      message: 'Are you sure you want to delete this blacklisted topic? This action cannot be undone.',
      onConfirm: async () => {
        try {
          const token = localStorage.getItem('echotrail_token');
          await fetch(`${API_URL}/api/admin/blacklist/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
          fetchData();
          setToast({ type: 'success', message: 'Topic deleted successfully' });
          setTimeout(() => setToast(null), 3000);
        } catch (error) {
          console.error('Failed to delete topic:', error);
          setToast({ type: 'error', message: 'Failed to delete topic' });
          setTimeout(() => setToast(null), 3000);
        }
      },
    });
  };

  // Play voice sample
  const playVoiceSample = (audioData, sampleId) => {
    if (playingAudio) {
      playingAudio.pause();
      if (playingAudio.sampleId === sampleId) {
        setPlayingAudio(null);
        return;
      }
    }
    const audio = new Audio(audioData);
    audio.sampleId = sampleId;
    audio.onended = () => setPlayingAudio(null);
    audio.play();
    setPlayingAudio(audio);
  };

  // Update user subscription
  const updateUserSubscription = async (userId, subscription) => {
    try {
      const token = localStorage.getItem('echotrail_token');
      const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ subscription })
      });
      if (res.ok) {
        // Update local state
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, subscription } : u));
        if (userDetails?.id === userId) {
          setUserDetails(prev => ({ ...prev, subscription }));
        }
      }
    } catch (error) {
      console.error('Failed to update subscription:', error);
    }
  };

  // Fetch and save pricing
  const fetchPricing = async () => {
    try {
      const token = localStorage.getItem('echotrail_token');
      const res = await fetch(`${API_URL}/api/admin/pricing`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setPricing(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch pricing:', error);
    }
  };

  const savePricing = async () => {
    try {
      const token = localStorage.getItem('echotrail_token');
      const res = await fetch(`${API_URL}/api/admin/pricing`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(pricing)
      });
      if (res.ok) {
        setEditingPricing(false);
      }
    } catch (error) {
      console.error('Failed to save pricing:', error);
    }
  };

  // Support Avatar functions
  const handleSupportAvatarImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSupportAvatarDraft(prev => ({ ...prev, imageUrl: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const saveSupportAvatar = async () => {
    try {
      const token = localStorage.getItem('echotrail_token');
      const res = await fetch(`${API_URL}/api/admin/support-avatar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(supportAvatarDraft)
      });
      if (res.ok) {
        const data = await res.json();
        setSupportAvatar(data);
        setEditingSupportAvatar(false);
      }
    } catch (error) {
      console.error('Failed to save support avatar:', error);
    }
  };

  // Referral System functions
  const saveReferralSettings = async () => {
    try {
      const token = localStorage.getItem('echotrail_token');
      const res = await fetch(`${API_URL}/api/admin/referral/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(referralSettings)
      });
      if (res.ok) {
        const data = await res.json();
        setReferralSettings(data);
        setEditingReferral(false);
      }
    } catch (error) {
      console.error('Failed to save referral settings:', error);
    }
  };

  const testApiConnection = async (service) => {
    setTestResults(prev => ({ ...prev, [service]: { loading: true } }));
    try {
      const token = localStorage.getItem('echotrail_token');
      const res = await fetch(`${API_URL}/api/admin/api-config/${service}/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const result = await res.json();
      setTestResults(prev => ({ ...prev, [service]: result }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [service]: { success: false, message: error.message }
      }));
    }
  };

  const updateApiConfig = async (service, data) => {
    try {
      const token = localStorage.getItem('echotrail_token');
      const res = await fetch(`${API_URL}/api/admin/api-config/${service}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        await fetchData();
        setEditingApi(null);
        setNewApiKey('');
      }
    } catch (error) {
      console.error('Failed to update API config:', error);
    }
  };

  // Shop Product CRUD
  const saveProduct = async () => {
    try {
      const token = localStorage.getItem('echotrail_token');
      const method = editingProduct === 'new' ? 'POST' : 'PUT';
      const url = editingProduct === 'new'
        ? `${API_URL}/api/admin/shop/products`
        : `${API_URL}/api/admin/shop/products/${editingProduct}`;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(productDraft),
      });

      if (res.ok) {
        await fetchData();
        setEditingProduct(null);
        setProductDraft({ name: '', description: '', price: 0, imageUrl: '', category: 'addon', isActive: true });
        showToast('Product saved successfully', 'success');
      }
    } catch (error) {
      console.error('Failed to save product:', error);
      showToast('Failed to save product', 'error');
    }
  };

  const deleteProduct = async (id) => {
    try {
      const token = localStorage.getItem('echotrail_token');
      await fetch(`${API_URL}/api/admin/shop/products/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      await fetchData();
      showToast('Product deleted', 'success');
    } catch (error) {
      console.error('Failed to delete product:', error);
    }
  };

  // Avatar Background CRUD
  const saveBackground = async () => {
    try {
      const token = localStorage.getItem('echotrail_token');
      const method = editingBackground === 'new' ? 'POST' : 'PUT';
      const url = editingBackground === 'new'
        ? `${API_URL}/api/admin/avatar-backgrounds`
        : `${API_URL}/api/admin/avatar-backgrounds/${editingBackground}`;

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(backgroundDraft),
      });

      if (res.ok) {
        await fetchData();
        setEditingBackground(null);
        setBackgroundDraft({ name: '', imageUrl: '', isActive: true });
        showToast('Background saved successfully', 'success');
      }
    } catch (error) {
      console.error('Failed to save background:', error);
    }
  };

  const deleteBackground = async (id) => {
    try {
      const token = localStorage.getItem('echotrail_token');
      await fetch(`${API_URL}/api/admin/avatar-backgrounds/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      await fetchData();
      showToast('Background deleted', 'success');
    } catch (error) {
      console.error('Failed to delete background:', error);
    }
  };

  // Toggle avatar style
  const toggleAvatarStyle = async (styleId) => {
    try {
      const token = localStorage.getItem('echotrail_token');
      const newStyles = { ...avatarStyles, [styleId]: !avatarStyles[styleId] };

      const res = await fetch(`${API_URL}/api/admin/avatar-styles`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newStyles),
      });

      if (res.ok) {
        setAvatarStyles(newStyles);
        showToast(`Style ${newStyles[styleId] ? 'activated' : 'deactivated'}`, 'success');
      }
    } catch (error) {
      console.error('Failed to toggle style:', error);
      showToast('Failed to update style', 'error');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'support', label: 'Support', icon: MessageCircle, badge: totalUnread || supportChats.filter(c => c.status === 'open').length },
    { id: 'referral', label: 'Referral', icon: Heart },
    { id: 'shop', label: 'Shop', icon: ShoppingBag },
    { id: 'apis', label: 'AI Services', icon: Key },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  if (user?.role !== 'ADMIN') {
    return null;
  }

  return (
    <PageTransition className="min-h-screen bg-gradient-to-b from-navy via-navy to-navy-dark py-8">
      <div className="max-w-7xl mx-auto px-4">
        <FadeIn>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold to-gold-light flex items-center justify-center">
                <Shield className="w-6 h-6 text-navy" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-serif text-cream">Admin Dashboard</h1>
                <p className="text-cream/50 text-sm">Manage EchoTrail AI Infrastructure</p>
              </div>
            </div>
            <motion.button
              onClick={fetchData}
              className="p-2 rounded-lg bg-navy-light/50 text-cream/70 hover:text-cream"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </motion.button>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="glass-card p-1 mb-8">
            <div className="flex overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setSelectedUser(null);
                      setSelectedChat(null);
                    }}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'bg-gold/20 text-gold'
                        : 'text-cream/60 hover:text-cream'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.label}
                    {tab.badge > 0 && (
                      <span className="ml-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                        {tab.badge}
                      </span>
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </FadeIn>

        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Period Filter */}
              <div className="flex justify-end mb-6">
                <div className="glass-card p-1 inline-flex gap-1">
                  {[
                    { id: 'day', label: '24h' },
                    { id: 'week', label: '7 Days' },
                    { id: 'month', label: '30 Days' },
                    { id: 'all', label: 'All Time' },
                  ].map((period) => (
                    <motion.button
                      key={period.id}
                      onClick={() => setStatsPeriod(period.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        statsPeriod === period.id
                          ? 'bg-gold/20 text-gold'
                          : 'text-cream/60 hover:text-cream'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {period.label}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Main Stats */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {[
                  {
                    label: 'Total Users',
                    value: stats?.totalUsers || 0,
                    change: stats?.newUsers || 0,
                    icon: Users,
                    color: 'text-blue-400'
                  },
                  {
                    label: 'Online Now',
                    value: stats?.onlineUsers || 0,
                    icon: Wifi,
                    color: 'text-green-400',
                    isLive: true
                  },
                  {
                    label: 'Premium Subscriptions',
                    value: stats?.premiumUsers || 0,
                    change: stats?.newPremiumSubscriptions || 0,
                    icon: TrendingUp,
                    color: 'text-gold'
                  },
                  {
                    label: 'Open Support Chats',
                    value: stats?.openSupportChats || 0,
                    icon: MessageCircle,
                    color: 'text-orange-400'
                  },
                ].map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <FadeIn key={stat.label} delay={index * 0.1}>
                      <div className="glass-card p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Icon className={`w-8 h-8 ${stat.color}`} />
                            {stat.isLive && (
                              <span className="flex items-center gap-1">
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                              </span>
                            )}
                          </div>
                          {stat.change > 0 && statsPeriod !== 'all' && (
                            <span className="text-green-400 text-sm font-medium">+{stat.change}</span>
                          )}
                        </div>
                        <p className="text-3xl font-serif text-cream mb-1">{stat.value}</p>
                        <p className="text-cream/50 text-sm">{stat.label}</p>
                      </div>
                    </FadeIn>
                  );
                })}
              </div>

              {/* Content Stats */}
              <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
                {[
                  { label: 'Life Stories', total: stats?.totalStories || 0, new: stats?.newStories || 0, icon: BookOpen },
                  { label: 'Memories', total: stats?.totalMemories || 0, new: stats?.newMemories || 0, icon: Image },
                  { label: 'Time Capsules', total: stats?.totalCapsules || 0, new: stats?.newCapsules || 0, icon: Clock },
                  { label: 'Avatar Uploads', total: stats?.totalAvatarImages || 0, new: stats?.newAvatarImages || 0, icon: UserIcon },
                  { label: 'Wisdom Chats', total: stats?.totalWisdomChats || 0, new: stats?.newWisdomChats || 0, icon: MessageCircle },
                ].map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <FadeIn key={stat.label} delay={0.2 + index * 0.05}>
                      <div className="glass-card p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Icon className="w-5 h-5 text-gold/60" />
                          <span className="text-cream/60 text-sm">{stat.label}</span>
                        </div>
                        <div className="flex items-end justify-between">
                          <p className="text-2xl font-serif text-cream">{stat.total}</p>
                          {stat.new > 0 && statsPeriod !== 'all' && (
                            <span className="text-green-400 text-xs">+{stat.new}</span>
                          )}
                        </div>
                      </div>
                    </FadeIn>
                  );
                })}
              </div>

              <div className="grid lg:grid-cols-2 gap-6 mb-8">
                <FadeIn delay={0.4}>
                  <div className="glass-card p-6">
                    <h3 className="text-lg font-serif text-cream mb-4">Recent Users</h3>
                    <div className="space-y-3">
                      {stats?.recentUsers?.map((recentUser) => (
                        <div key={recentUser.id} className="flex items-center justify-between p-3 bg-navy-dark/30 rounded-lg">
                          <div>
                            <p className="text-cream font-medium">{recentUser.firstName} {recentUser.lastName}</p>
                            <p className="text-cream/50 text-sm">{recentUser.email}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs ${
                            recentUser.subscription === 'PREMIUM'
                              ? 'bg-gold/20 text-gold'
                              : recentUser.subscription === 'STANDARD'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-cream/10 text-cream/60'
                          }`}>
                            {recentUser.subscription}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </FadeIn>

                <FadeIn delay={0.5}>
                  <div className="glass-card p-6">
                    <h3 className="text-lg font-serif text-cream mb-4">AI Services Status</h3>
                    <div className="space-y-3">
                      {aiServices.map((service) => {
                        const config = apiConfigs.find(c => c.service === service.id);
                        const Icon = service.icon;
                        const isActive = config?.isActive && config?.hasKey;
                        const provider = config?.settings?.provider || config?.provider;
                        const providerName = provider ?
                          serviceCategories[service.category]?.providers.find(p => p.id === provider)?.name || provider
                          : 'Not configured';
                        return (
                          <div key={service.id} className="flex items-center justify-between p-3 bg-navy-dark/30 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${service.color} flex items-center justify-center`}>
                                <Icon className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="text-cream font-medium">{service.name}</p>
                                <p className="text-cream/50 text-xs">{providerName}</p>
                              </div>
                            </div>
                            <div className="relative">
                              <div className={`w-4 h-4 rounded-full ${
                                isActive ? 'bg-green-500' : 'bg-red-500'
                              }`} />
                              <div className={`absolute inset-0 w-4 h-4 rounded-full ${
                                isActive ? 'bg-green-500' : 'bg-red-500'
                              } animate-ping opacity-75`}
                              style={{ animationDuration: '3s' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </FadeIn>
              </div>

              {/* Country Usage Stats */}
              <FadeIn delay={0.6}>
                <div className="glass-card p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Flag className="w-5 h-5 text-gold" />
                    <h3 className="text-lg font-serif text-cream">Usage by Country</h3>
                    <span className="text-cream/50 text-sm ml-auto">{countryStats.total} total sessions</span>
                  </div>
                  {countryStats.countries.length > 0 ? (
                    <div className="space-y-3">
                      {countryStats.countries.map((country, index) => {
                        const percentage = countryStats.total > 0 ? (country.count / countryStats.total * 100).toFixed(1) : 0;
                        return (
                          <div key={country.country} className="flex items-center gap-4">
                            <span className="text-cream font-medium w-8 text-center">#{index + 1}</span>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-cream">{country.country}</span>
                                <span className="text-cream/60 text-sm">{country.count} sessions ({percentage}%)</span>
                              </div>
                              <div className="h-2 bg-navy-dark/50 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-gold to-gold-light rounded-full"
                                  style={{ width: `${percentage}%` }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Globe className="w-12 h-12 text-cream/30 mx-auto mb-3" />
                      <p className="text-cream/50">No session data yet</p>
                      <p className="text-cream/30 text-sm">Country data will appear as users log in</p>
                    </div>
                  )}
                </div>
              </FadeIn>
            </motion.div>
          )}

          {activeTab === 'apis' && (
            <motion.div
              key="apis"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <StaggerContainer className="space-y-6">
                {Object.entries(serviceCategories).map(([categoryKey, category]) => {
                  const config = apiConfigs.find(c => c.service === categoryKey) || {};
                  const selectedProvider = config.settings?.provider || category.providers[0]?.id;
                  const providerInfo = category.providers.find(p => p.id === selectedProvider) || category.providers[0];
                  const Icon = category.icon;
                  const testResult = testResults[categoryKey];
                  const isEditing = editingApi === categoryKey;
                  const needsApiKey = true; // All remaining providers require API keys

                  return (
                    <StaggerItem key={categoryKey}>
                      <div className="glass-card p-6">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                              <Icon className="w-7 h-7 text-white" />
                            </div>
                            <div>
                              <h3 className="text-xl font-serif text-cream">{category.name}</h3>
                              <p className="text-cream/60 text-sm">{category.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-xs ${
                              config.isActive && (config.hasKey || !needsApiKey)
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}>
                              {config.isActive && (config.hasKey || !needsApiKey) ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>

                        {/* Provider Selection */}
                        <div className="mb-6">
                          <label className="block text-cream/70 text-sm mb-3">Select Provider</label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {category.providers.map((provider) => (
                              <motion.button
                                key={provider.id}
                                onClick={() => updateApiConfig(categoryKey, {
                                  settings: { ...config.settings, provider: provider.id }
                                })}
                                className={`p-3 rounded-xl border-2 text-left transition-all ${
                                  selectedProvider === provider.id
                                    ? 'border-gold bg-gold/10'
                                    : 'border-gold/20 hover:border-gold/40 bg-navy-dark/30'
                                }`}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    provider.tier === 'free' ? 'bg-green-500/20 text-green-400' :
                                    provider.tier === 'budget' ? 'bg-blue-500/20 text-blue-400' :
                                    'bg-gold/20 text-gold'
                                  }`}>
                                    {provider.tier === 'free' ? 'FREE' : provider.tier === 'budget' ? 'LOW COST' : 'PREMIUM'}
                                  </span>
                                  {selectedProvider === provider.id && (
                                    <Check className="w-4 h-4 text-gold" />
                                  )}
                                </div>
                                <p className="text-cream font-medium text-sm">{provider.name}</p>
                                <p className="text-cream/50 text-xs mt-1">{provider.description}</p>
                              </motion.button>
                            ))}
                          </div>
                        </div>

                        {/* API Key Section - only show if provider needs it */}
                        {needsApiKey && (
                          <div className="space-y-4 pt-4 border-t border-gold/10">
                            <div className="flex items-center justify-between">
                              <label className="text-cream/70 text-sm">API Key for {providerInfo?.name}</label>
                              {providerInfo?.docsUrl && (
                                <a
                                  href={providerInfo.docsUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-gold text-sm hover:underline"
                                >
                                  Get API Key →
                                </a>
                              )}
                            </div>
                            {isEditing ? (
                              <div className="flex gap-3">
                                <div className="relative flex-1">
                                  <input
                                    type={showApiKey[categoryKey] ? 'text' : 'password'}
                                    value={newApiKey}
                                    onChange={(e) => setNewApiKey(e.target.value)}
                                    placeholder="Enter new API key..."
                                    className="input-field pr-10"
                                  />
                                  <button
                                    onClick={() => setShowApiKey(prev => ({ ...prev, [categoryKey]: !prev[categoryKey] }))}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/50"
                                  >
                                    {showApiKey[categoryKey] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </button>
                                </div>
                                <motion.button
                                  onClick={() => { updateApiConfig(categoryKey, { apiKey: newApiKey }); setEditingApi(null); setNewApiKey(''); }}
                                  className="btn-primary px-4"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  Save
                                </motion.button>
                                <motion.button
                                  onClick={() => { setEditingApi(null); setNewApiKey(''); }}
                                  className="btn-secondary px-4"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  Cancel
                                </motion.button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-3">
                                <div className="flex-1 bg-navy-dark/30 rounded-xl px-4 py-3 font-mono text-sm text-cream/60">
                                  {config.hasKey ? config.apiKey : 'No API key configured'}
                                </div>
                                <motion.button
                                  onClick={() => { setEditingApi(categoryKey); setNewApiKey(''); }}
                                  className="p-3 rounded-xl bg-navy-dark/50 text-cream/70 hover:text-cream"
                                  whileHover={{ scale: 1.05 }}
                                  whileTap={{ scale: 0.95 }}
                                >
                                  <Edit3 className="w-4 h-4" />
                                </motion.button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Free provider info */}
                        {!needsApiKey && (
                          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 mt-4">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-5 h-5 text-green-400" />
                              <span className="text-green-400 text-sm">No API key needed - this provider is free!</span>
                            </div>
                          </div>
                        )}

                        {/* Enable toggle and test button */}
                        <div className="flex items-center justify-between mt-6 pt-4 border-t border-gold/10">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <div
                              onClick={() => updateApiConfig(categoryKey, { isActive: !config.isActive })}
                              className={`w-12 h-6 rounded-full transition-colors ${
                                config.isActive ? 'bg-gold' : 'bg-navy-dark'
                              }`}
                            >
                              <motion.div
                                className="w-5 h-5 bg-white rounded-full shadow-md"
                                animate={{ x: config.isActive ? 26 : 2 }}
                                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                style={{ marginTop: 2 }}
                              />
                            </div>
                            <span className="text-cream/70 text-sm">Enable Service</span>
                          </label>

                          <motion.button
                            onClick={() => testApiConnection(categoryKey)}
                            disabled={needsApiKey && !config.hasKey || testResult?.loading}
                            className="btn-secondary flex items-center gap-2 disabled:opacity-50"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {testResult?.loading ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <Activity className="w-4 h-4" />
                            )}
                            Test Connection
                          </motion.button>
                        </div>

                        {/* Test result */}
                        {testResult && !testResult.loading && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex items-center gap-3 p-4 rounded-xl mt-4 ${
                              testResult.success
                                ? 'bg-green-500/10 border border-green-500/30'
                                : 'bg-red-500/10 border border-red-500/30'
                            }`}
                          >
                            {testResult.success ? (
                              <CheckCircle2 className="w-5 h-5 text-green-400" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-red-400" />
                            )}
                            <span className={testResult.success ? 'text-green-400' : 'text-red-400'}>
                              {testResult.message}
                            </span>
                          </motion.div>
                        )}
                      </div>
                    </StaggerItem>
                  );
                })}
              </StaggerContainer>
            </motion.div>
          )}

          {activeTab === 'users' && !selectedUser && (
            <motion.div
              key="users"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gold/10">
                        <th className="text-left p-4 text-cream/60 font-medium">User</th>
                        <th className="text-left p-4 text-cream/60 font-medium">Status</th>
                        <th className="text-left p-4 text-cream/60 font-medium">Role</th>
                        <th className="text-left p-4 text-cream/60 font-medium">Subscription</th>
                        <th className="text-left p-4 text-cream/60 font-medium">Content</th>
                        <th className="text-left p-4 text-cream/60 font-medium">Joined</th>
                        <th className="text-right p-4 text-cream/60 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b border-gold/5 hover:bg-navy-light/30">
                          <td className="p-4">
                            <div>
                              <p className="text-cream font-medium">{u.firstName} {u.lastName}</p>
                              <p className="text-cream/50 text-sm">{u.email}</p>
                            </div>
                          </td>
                          <td className="p-4">
                            {u.isOnline ? (
                              <span className="flex items-center gap-1.5">
                                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                <span className="text-green-400 text-xs">Online</span>
                              </span>
                            ) : u.lastActiveAt ? (
                              <span className="text-cream/40 text-xs">
                                {(() => {
                                  const diff = Date.now() - new Date(u.lastActiveAt).getTime();
                                  const mins = Math.floor(diff / 60000);
                                  const hours = Math.floor(mins / 60);
                                  const days = Math.floor(hours / 24);
                                  if (mins < 60) return `${mins}m ago`;
                                  if (hours < 24) return `${hours}h ago`;
                                  return `${days}d ago`;
                                })()}
                              </span>
                            ) : (
                              <span className="text-cream/30 text-xs">Never</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs ${
                              u.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400' : 'bg-cream/10 text-cream/60'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="p-4">
                            <select
                              value={u.subscription}
                              onChange={(e) => updateUserSubscription(u.id, e.target.value)}
                              className={`px-2 py-1 rounded text-xs cursor-pointer border-0 ${
                                u.subscription === 'PREMIUM'
                                  ? 'bg-gold/20 text-gold'
                                  : u.subscription === 'STANDARD'
                                  ? 'bg-blue-500/20 text-blue-400'
                                  : 'bg-cream/10 text-cream/60'
                              }`}
                            >
                              <option value="FREE" className="bg-navy text-cream">FREE</option>
                              <option value="STANDARD" className="bg-navy text-cream">STANDARD</option>
                              <option value="PREMIUM" className="bg-navy text-cream">PREMIUM</option>
                            </select>
                          </td>
                          <td className="p-4 text-cream/60 text-sm">
                            {u._count?.memories || 0} memories, {u._count?.timeCapsules || 0} capsules
                          </td>
                          <td className="p-4 text-cream/50 text-sm">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <motion.button
                                onClick={() => loadUserDetails(u.id)}
                                className="p-2 text-gold/70 hover:text-gold"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                title="View Details"
                              >
                                <Eye className="w-4 h-4" />
                              </motion.button>
                              {u.id !== user.id && (
                                <motion.button
                                  className="p-2 text-cream/50 hover:text-red-400"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </motion.button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* User Details View */}
          {activeTab === 'users' && selectedUser && userDetails && (
            <motion.div
              key="user-details"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="mb-6">
                <motion.button
                  onClick={() => { setSelectedUser(null); setUserDetails(null); setExpandedStory(null); }}
                  className="flex items-center gap-2 text-cream/60 hover:text-cream"
                  whileHover={{ x: -5 }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Users
                </motion.button>
              </div>

              {/* User Header with Complete Info */}
              <div className="glass-card p-6 mb-6">
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {userDetails.persona?.avatarImages?.find(img => img.isActive) ? (
                      <img
                        src={userDetails.persona.avatarImages.find(img => img.isActive)?.imageData}
                        alt="Avatar"
                        className="w-24 h-24 rounded-full object-cover border-2 border-gold/30"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gold/20 flex items-center justify-center">
                        <UserIcon className="w-12 h-12 text-gold" />
                      </div>
                    )}
                  </div>

                  {/* Main User Info */}
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-serif text-cream">{userDetails.firstName} {userDetails.lastName}</h2>
                        <p className="text-cream/50">{userDetails.email}</p>
                        {userDetails.purposes && userDetails.purposes.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {userDetails.purposes.map((purpose, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded text-xs">
                                {purpose === 'family' ? 'For My Family' :
                                 purpose === 'children' ? 'For My Children' :
                                 purpose === 'grandchildren' ? 'For Future Grandchildren' :
                                 purpose === 'self' ? 'For Myself' : purpose}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-start md:items-end gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            userDetails.subscription === 'PREMIUM'
                              ? 'bg-gold/20 text-gold'
                              : userDetails.subscription === 'STANDARD'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-cream/10 text-cream/60'
                          }`}>
                            {userDetails.subscription}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            userDetails.role === 'ADMIN' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'
                          }`}>
                            {userDetails.role}
                          </span>
                        </div>
                        <p className="text-cream/40 text-xs">
                          Joined {new Date(userDetails.createdAt).toLocaleString('de-DE', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 mt-4 pt-4 border-t border-gold/10">
                      <div className="text-center p-2 bg-navy-dark/30 rounded-lg">
                        <p className="text-lg font-serif text-cream">{userDetails.stats?.totalStories || 0}</p>
                        <p className="text-cream/40 text-xs">Stories</p>
                      </div>
                      <div className="text-center p-2 bg-navy-dark/30 rounded-lg">
                        <p className="text-lg font-serif text-cream">{userDetails.stats?.totalMemories || 0}</p>
                        <p className="text-cream/40 text-xs">Memories</p>
                      </div>
                      <div className="text-center p-2 bg-navy-dark/30 rounded-lg">
                        <p className="text-lg font-serif text-cream">{userDetails.stats?.totalCapsules || 0}</p>
                        <p className="text-cream/40 text-xs">Capsules</p>
                      </div>
                      <div className="text-center p-2 bg-navy-dark/30 rounded-lg">
                        <p className="text-lg font-serif text-cream">{userDetails.stats?.totalAvatars || 0}</p>
                        <p className="text-cream/40 text-xs">Avatars</p>
                      </div>
                      <div className="text-center p-2 bg-navy-dark/30 rounded-lg">
                        <p className="text-lg font-serif text-cream">{userDetails.stats?.totalWisdomChats || 0}</p>
                        <p className="text-cream/40 text-xs">Chats</p>
                      </div>
                      <div className="text-center p-2 bg-navy-dark/30 rounded-lg">
                        <p className="text-lg font-serif text-cream">{userDetails.stats?.totalSupportChats || 0}</p>
                        <p className="text-cream/40 text-xs">Support</p>
                      </div>
                      <div className="text-center p-2 bg-navy-dark/30 rounded-lg">
                        <p className="text-lg font-serif text-cream">{userDetails.stats?.successfulReferrals || 0}</p>
                        <p className="text-cream/40 text-xs">Referrals</p>
                      </div>
                      <div className="text-center p-2 bg-navy-dark/30 rounded-lg">
                        <p className="text-lg font-serif text-cream">{userDetails.stats?.daysActive || 0}</p>
                        <p className="text-cream/40 text-xs">Days</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Session & Financial Info Row */}
              <div className="grid lg:grid-cols-3 gap-6 mb-6">
                {/* Session Info */}
                <div className="glass-card p-5">
                  <h3 className="text-sm font-medium text-cream mb-3 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-gold" />
                    Last Session
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-cream/40" />
                      <span className="text-cream/70">
                        {userDetails.lastCity && userDetails.lastCity !== 'Unknown'
                          ? `${userDetails.lastCity}, ${userDetails.lastCountry}`
                          : userDetails.lastCountry || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-cream/40" />
                      <span className="text-cream/70 truncate">
                        {userDetails.lastUserAgent
                          ? (userDetails.lastUserAgent.includes('Chrome') ? 'Chrome' :
                             userDetails.lastUserAgent.includes('Safari') ? 'Safari' :
                             userDetails.lastUserAgent.includes('Firefox') ? 'Firefox' : 'Unknown')
                          : 'Unknown'} on {
                          userDetails.lastUserAgent
                            ? (userDetails.lastUserAgent.includes('Windows') ? 'Windows' :
                               userDetails.lastUserAgent.includes('Mac') ? 'macOS' :
                               userDetails.lastUserAgent.includes('Linux') ? 'Linux' :
                               userDetails.lastUserAgent.includes('Android') ? 'Android' :
                               userDetails.lastUserAgent.includes('iPhone') ? 'iOS' : 'Unknown')
                            : 'Unknown'
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-cream/40" />
                      <span className="text-cream/70">
                        IP: {userDetails.lastIpAddress || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 pt-2 border-t border-gold/10">
                      <Clock className="w-4 h-4 text-cream/40" />
                      <span className="text-cream/50 text-xs">
                        Last login: {userDetails.lastLoginAt
                          ? new Date(userDetails.lastLoginAt).toLocaleString('de-DE')
                          : 'Never'}
                      </span>
                    </div>
                    <div className="text-cream/40 text-xs">
                      Total logins: {userDetails.loginCount || 0}
                    </div>
                  </div>
                </div>

                {/* Financial Info */}
                <div className="glass-card p-5">
                  <h3 className="text-sm font-medium text-cream mb-3 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gold" />
                    Financial
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-cream/60 text-sm">Total Spent</span>
                      <span className="text-gold font-medium">${(userDetails.totalSpent || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-cream/60 text-sm">Token Balance</span>
                      <span className="text-cream font-medium flex items-center gap-1">
                        <Coins className="w-4 h-4 text-gold" />
                        {(userDetails.tokenBalance || 0).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-cream/60 text-sm">Purchases</span>
                      <span className="text-cream">{userDetails.purchases?.length || 0}</span>
                    </div>
                    {userDetails.subscribedAt && (
                      <div className="pt-2 border-t border-gold/10">
                        <span className="text-cream/40 text-xs">
                          Subscribed: {new Date(userDetails.subscribedAt).toLocaleString('de-DE')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Referral Info */}
                <div className="glass-card p-5">
                  <h3 className="text-sm font-medium text-cream mb-3 flex items-center gap-2">
                    <UserPlus className="w-4 h-4 text-gold" />
                    Referral Info
                  </h3>
                  <div className="space-y-3">
                    {userDetails.referralCode && (
                      <div className="flex items-center justify-between">
                        <span className="text-cream/60 text-sm">My Code</span>
                        <span className="text-gold font-mono text-sm">{userDetails.referralCode}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-cream/60 text-sm">Referrals Made</span>
                      <span className="text-cream">{userDetails.referralsMade?.length || 0}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-cream/60 text-sm">Successful</span>
                      <span className="text-green-400">{userDetails.stats?.successfulReferrals || 0}</span>
                    </div>
                    {userDetails.referredByInfo && (
                      <div className="pt-2 border-t border-gold/10">
                        <span className="text-cream/40 text-xs">Referred by: </span>
                        <span className="text-cream text-xs">
                          {userDetails.referredByInfo.firstName} {userDetails.referredByInfo.lastName}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Avatar Images with Details */}
              {userDetails.persona?.avatarImages?.length > 0 && (
                <div className="glass-card p-6 mb-6">
                  <h3 className="text-lg font-serif text-cream mb-4 flex items-center gap-2">
                    <Image className="w-5 h-5 text-gold" />
                    Avatar Images ({userDetails.persona.avatarImages.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {userDetails.persona.avatarImages.map(img => (
                      <div key={img.id} className={`p-3 rounded-xl border-2 ${
                        img.isActive ? 'border-gold bg-gold/5' : 'border-gold/20 bg-navy-dark/30'
                      }`}>
                        <div className="relative aspect-square rounded-lg overflow-hidden mb-2">
                          <img src={img.imageData} alt={img.label} className="w-full h-full object-cover" />
                          {img.isActive && (
                            <div className="absolute top-1 right-1 px-2 py-0.5 bg-gold text-navy text-xs rounded-full font-medium">
                              Active
                            </div>
                          )}
                        </div>
                        <div className="space-y-1">
                          <p className="text-cream text-sm font-medium truncate">{img.label || 'Unnamed'}</p>
                          <div className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-gold" />
                            <span className="text-cream/60 text-xs capitalize">{img.echoVibe}</span>
                          </div>
                          <p className="text-cream/40 text-xs">
                            {new Date(img.createdAt).toLocaleDateString('de-DE')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* Persona Settings */}
                  <div className="mt-4 pt-4 border-t border-gold/10 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-navy-dark/30 rounded-lg">
                      <p className="text-cream/50 text-xs">Echo Vibe</p>
                      <p className="text-gold capitalize">{userDetails.persona.echoVibe}</p>
                    </div>
                    <div className="p-3 bg-navy-dark/30 rounded-lg">
                      <p className="text-cream/50 text-xs">Avatar Style</p>
                      <p className="text-cream capitalize">{userDetails.persona.avatarStyle}</p>
                    </div>
                    <div className="p-3 bg-navy-dark/30 rounded-lg">
                      <p className="text-cream/50 text-xs">Background</p>
                      <p className="text-cream capitalize">{userDetails.persona.backgroundType}</p>
                    </div>
                    <div className="p-3 bg-navy-dark/30 rounded-lg">
                      <p className="text-cream/50 text-xs">Legacy Score</p>
                      <p className="text-gold">{userDetails.persona.legacyScore}%</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Legacy Journey - Mission Progress */}
              {userDetails.legacyProgress && (
                <div className="glass-card p-6 mb-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <Award className="w-6 h-6 text-gold" />
                      <div>
                        <h3 className="text-lg font-serif text-cream">Legacy Journey</h3>
                        <p className="text-cream/50 text-sm">{userDetails.legacyProgress.percent}% Complete - {userDetails.legacyProgress.stage}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-3xl font-serif text-gold">{userDetails.legacyProgress.percent}%</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-6">
                    <div className="h-3 bg-navy-dark rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-gold to-gold-light transition-all duration-500"
                        style={{ width: `${userDetails.legacyProgress.percent}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-cream/40">
                      <span>Seedling</span>
                      <span>Growing</span>
                      <span>Thriving</span>
                      <span>Eternal</span>
                    </div>
                  </div>

                  {/* Mission Cards */}
                  <div className="grid md:grid-cols-2 gap-3">
                    {userDetails.legacyProgress.missions?.map((mission) => (
                      <div
                        key={mission.id}
                        className={`p-4 rounded-lg border transition-all ${
                          mission.completed
                            ? 'bg-green-500/10 border-green-500/30'
                            : 'bg-navy-dark/30 border-cream/10'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              {mission.completed && <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />}
                              {!mission.completed && <Circle className="w-4 h-4 text-cream/30 flex-shrink-0" />}
                              <h4 className={`text-sm font-medium ${mission.completed ? 'text-green-400' : 'text-cream'}`}>
                                {mission.name}
                              </h4>
                            </div>
                            <p className="text-xs text-cream/50 ml-6">{mission.description}</p>
                            {mission.progress && (
                              <p className="text-xs text-gold mt-1 ml-6">{mission.progress}</p>
                            )}
                          </div>
                          <div className={`text-xs font-medium px-2 py-1 rounded ${
                            mission.completed ? 'bg-green-500/20 text-green-400' : 'bg-cream/10 text-cream/50'
                          }`}>
                            {mission.points}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Persona Values */}
                {userDetails.persona && (
                  <div className="glass-card p-6">
                    <h3 className="text-lg font-serif text-cream mb-4 flex items-center gap-2">
                      <Heart className="w-5 h-5 text-gold" />
                      Personality Values
                    </h3>
                    <div className="space-y-3">
                      {[
                        { label: 'Humor', value: userDetails.persona.humor },
                        { label: 'Empathy', value: userDetails.persona.empathy },
                        { label: 'Tradition', value: userDetails.persona.tradition },
                        { label: 'Adventure', value: userDetails.persona.adventure },
                        { label: 'Wisdom', value: userDetails.persona.wisdom },
                        { label: 'Creativity', value: userDetails.persona.creativity },
                        { label: 'Patience', value: userDetails.persona.patience },
                        { label: 'Optimism', value: userDetails.persona.optimism },
                      ].map(trait => (
                        <div key={trait.label} className="flex items-center gap-3">
                          <span className="text-cream/60 text-sm w-20">{trait.label}</span>
                          <div className="flex-1 h-2 bg-navy-dark rounded-full overflow-hidden">
                            <div className="h-full bg-gold" style={{ width: `${trait.value}%` }} />
                          </div>
                          <span className="text-cream/40 text-sm w-8">{trait.value}</span>
                        </div>
                      ))}
                    </div>
                    {userDetails.persona.coreValues?.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-gold/10">
                        <p className="text-cream/60 text-sm mb-2">Core Values:</p>
                        <div className="flex flex-wrap gap-2">
                          {userDetails.persona.coreValues.map((v, i) => (
                            <span key={i} className="px-2 py-1 bg-gold/10 text-gold text-xs rounded-full">{v}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {userDetails.persona.lifePhilosophy && (
                      <div className="mt-4 pt-4 border-t border-gold/10">
                        <p className="text-cream/60 text-sm mb-2">Life Philosophy:</p>
                        <p className="text-cream/80 text-sm">{userDetails.persona.lifePhilosophy}</p>
                      </div>
                    )}
                    <div className="mt-4 pt-4 border-t border-gold/10">
                      <p className="text-cream/60 text-sm">Echo Vibe: <span className="text-gold capitalize">{userDetails.persona.echoVibe}</span></p>
                      <p className="text-cream/60 text-sm">Avatar Style: <span className="text-gold capitalize">{userDetails.persona.avatarStyle}</span></p>
                      <p className="text-cream/60 text-sm">Background: <span className="text-gold capitalize">{userDetails.persona.backgroundType}</span></p>
                      <p className="text-cream/60 text-sm">Legacy Score: <span className="text-gold">{userDetails.persona.legacyScore}%</span></p>
                    </div>
                  </div>
                )}

                {/* Life Stories - Full expandable */}
                <div className="glass-card p-6">
                  <h3 className="text-lg font-serif text-cream mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-gold" />
                    Life Stories ({userDetails.persona?.lifeStories?.length || 0})
                  </h3>
                  <div className="space-y-3 max-h-[500px] overflow-y-auto">
                    {userDetails.persona?.lifeStories?.map(story => (
                      <div
                        key={story.id}
                        className="p-3 bg-navy-dark/30 rounded-lg cursor-pointer hover:bg-navy-dark/50 transition-colors"
                        onClick={() => setExpandedStory(expandedStory === story.id ? null : story.id)}
                      >
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-gold/10 text-gold text-xs rounded">{story.chapterTitle || story.category}</span>
                            {story.questionId && (
                              <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 text-xs rounded">Interview</span>
                            )}
                          </div>
                          <span className="text-cream/40 text-xs">{new Date(story.createdAt).toLocaleDateString()}</span>
                        </div>
                        {story.question && <p className="text-cream/60 text-xs italic mb-1">Q: {story.question}</p>}
                        <p className={`text-cream/80 text-sm ${expandedStory === story.id ? '' : 'line-clamp-2'}`}>
                          {story.content}
                        </p>
                        {story.content.length > 150 && (
                          <p className="text-gold/60 text-xs mt-1">
                            {expandedStory === story.id ? '▲ Click to collapse' : '▼ Click to expand'}
                          </p>
                        )}
                      </div>
                    ))}
                    {(!userDetails.persona?.lifeStories || userDetails.persona.lifeStories.length === 0) && (
                      <p className="text-cream/40 text-sm text-center py-4">No stories yet</p>
                    )}
                  </div>
                </div>

                {/* Memories with images */}
                <div className="glass-card p-6">
                  <h3 className="text-lg font-serif text-cream mb-4 flex items-center gap-2">
                    <Image className="w-5 h-5 text-gold" />
                    Memories ({userDetails.memories?.length || 0})
                  </h3>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {userDetails.memories?.map(memory => (
                      <div key={memory.id} className="p-3 bg-navy-dark/30 rounded-lg">
                        <div className="flex gap-3">
                          {memory.imageUrl && (
                            <img
                              src={memory.imageUrl}
                              alt={memory.title}
                              className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-cream font-medium text-sm">{memory.title}</p>
                            <p className="text-cream/60 text-sm">{memory.description}</p>
                            {memory.history && (
                              <p className="text-cream/40 text-xs italic mt-1 line-clamp-2">{memory.history}</p>
                            )}
                            <p className="text-cream/30 text-xs mt-1">{new Date(memory.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                    {(!userDetails.memories || userDetails.memories.length === 0) && (
                      <p className="text-cream/40 text-sm text-center py-4">No memories yet</p>
                    )}
                  </div>
                </div>

                {/* Time Capsules with full message */}
                <div className="glass-card p-6">
                  <h3 className="text-lg font-serif text-cream mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-gold" />
                    Time Capsules ({userDetails.timeCapsules?.length || 0})
                  </h3>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto">
                    {userDetails.timeCapsules?.map(capsule => (
                      <div key={capsule.id} className="p-3 bg-navy-dark/30 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-cream font-medium text-sm">{capsule.title}</p>
                          <span className={`px-2 py-0.5 text-xs rounded ${
                            capsule.status === 'sealed' ? 'bg-blue-500/20 text-blue-400' : 'bg-green-500/20 text-green-400'
                          }`}>{capsule.status}</span>
                        </div>
                        <div className="flex items-center gap-4 text-cream/60 text-sm mb-2">
                          <span>To: {capsule.recipient}</span>
                          <span>•</span>
                          <span>{capsule.occasion}</span>
                        </div>
                        <p className="text-cream/80 text-sm bg-navy-dark/50 p-2 rounded">{capsule.message}</p>
                        <p className="text-cream/40 text-xs mt-2">Delivery: {new Date(capsule.deliveryDate).toLocaleDateString()}</p>
                      </div>
                    ))}
                    {(!userDetails.timeCapsules || userDetails.timeCapsules.length === 0) && (
                      <p className="text-cream/40 text-sm text-center py-4">No time capsules yet</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Voice Samples */}
              {userVoiceSamples?.voiceSamples?.length > 0 && (
                <div className="glass-card p-6 mt-6">
                  <h3 className="text-lg font-serif text-cream mb-4 flex items-center gap-2">
                    <Mic className="w-5 h-5 text-gold" />
                    Voice Samples ({userVoiceSamples.voiceSamples.length})
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    {userVoiceSamples.voiceSamples.map(sample => (
                      <div key={sample.id} className="p-4 bg-navy-dark/30 rounded-xl border border-gold/10">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <p className="text-cream font-medium">{sample.label || 'Voice Sample'}</p>
                            <p className="text-cream/50 text-xs">
                              {sample.duration > 0 ? `${sample.duration}s` : 'Duration unknown'} • {new Date(sample.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <motion.button
                            onClick={() => playVoiceSample(sample.audioData, sample.id)}
                            className={`p-3 rounded-full ${
                              playingAudio?.sampleId === sample.id
                                ? 'bg-gold text-navy'
                                : 'bg-gold/20 text-gold hover:bg-gold/30'
                            }`}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            {playingAudio?.sampleId === sample.id ? (
                              <Pause className="w-5 h-5" />
                            ) : (
                              <Play className="w-5 h-5" />
                            )}
                          </motion.button>
                        </div>
                        {sample.prompt && (
                          <div className="bg-navy-dark/50 rounded-lg p-3">
                            <p className="text-cream/60 text-xs mb-1">Prompt read:</p>
                            <p className="text-cream/80 text-sm italic">"{sample.prompt}"</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Wisdom Chats */}
              {userDetails.wisdomChats?.length > 0 && (
                <div className="glass-card p-6 mt-6">
                  <h3 className="text-lg font-serif text-cream mb-4 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-gold" />
                    Wisdom Chat History ({userDetails.wisdomChats.length} messages)
                  </h3>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {userDetails.wisdomChats.map(chat => (
                      <div
                        key={chat.id}
                        className={`p-3 rounded-lg ${
                          chat.role === 'user'
                            ? 'bg-navy-dark/30 ml-8'
                            : 'bg-gold/10 mr-8'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-medium ${
                            chat.role === 'user' ? 'text-blue-400' : 'text-gold'
                          }`}>
                            {chat.role === 'user' ? 'User' : 'AI Echo'}
                          </span>
                          <span className="text-cream/30 text-xs">
                            {new Date(chat.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-cream/80 text-sm whitespace-pre-wrap">{chat.content}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Support Chat Tab */}
          {activeTab === 'support' && !selectedChat && (
            <motion.div
              key="support-list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="glass-card overflow-hidden">
                <div className="p-4 border-b border-gold/10 flex items-center justify-between">
                  <h3 className="text-lg font-serif text-cream">Support Conversations</h3>
                  <div className="flex items-center gap-4">
                    {/* Filter Tabs */}
                    <div className="flex bg-navy-dark/50 rounded-lg p-1 gap-1">
                      {[
                        { id: 'open', label: 'Open', count: supportChats.filter(c => c.status === 'open').length },
                        { id: 'closed', label: 'Closed', count: supportChats.filter(c => c.status === 'closed').length },
                        { id: 'archived', label: 'Archived', count: supportChats.filter(c => c.status === 'archived').length },
                      ].map(filter => (
                        <button
                          key={filter.id}
                          onClick={() => setSupportFilter(filter.id)}
                          className={`px-3 py-1.5 text-sm rounded-md transition-all flex items-center gap-2 ${
                            supportFilter === filter.id
                              ? 'bg-gold text-navy font-medium'
                              : 'text-cream/60 hover:text-cream hover:bg-navy-light/30'
                          }`}
                        >
                          {filter.label}
                          <span className={`text-xs px-1.5 py-0.5 rounded ${
                            supportFilter === filter.id ? 'bg-navy/20' : 'bg-navy-light/50'
                          }`}>{filter.count}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                {supportChats.filter(c => c.status === supportFilter).length === 0 ? (
                  <div className="p-8 text-center">
                    <MessageCircle className="w-12 h-12 text-gold/30 mx-auto mb-3" />
                    <p className="text-cream/50">
                      {supportFilter === 'open' ? 'No open conversations' :
                       supportFilter === 'closed' ? 'No closed conversations' :
                       'No archived conversations'}
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gold/5">
                    {supportChats.filter(c => c.status === supportFilter).map(chat => (
                      <div
                        key={chat.id}
                        className="p-4 hover:bg-navy-light/30 flex items-center gap-4 group"
                      >
                        <div
                          className="flex items-center gap-4 flex-1 cursor-pointer"
                          onClick={() => loadChat(chat.id)}
                        >
                          <div className="relative">
                            <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                              <UserIcon className="w-5 h-5 text-gold/60" />
                            </div>
                            {chat.unreadCount > 0 && (
                              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
                                {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                              </span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-cream font-medium truncate">{chat.userName || 'Unknown User'}</p>
                              <span className={`px-2 py-0.5 text-xs rounded ${
                                chat.status === 'open' ? 'bg-green-500/20 text-green-400' :
                                chat.status === 'archived' ? 'bg-purple-500/20 text-purple-400' :
                                'bg-cream/10 text-cream/50'
                              }`}>{chat.status}</span>
                              {chat.isUserTyping && (
                                <span className="text-gold text-xs animate-pulse">typing...</span>
                              )}
                            </div>
                            <p className="text-cream/50 text-sm truncate">{chat.userEmail}</p>
                            {chat.messages?.[0] && (
                              <p className="text-cream/40 text-xs truncate mt-1">
                                {chat.messages[0].imageUrl ? '📷 Image' : ''} {chat.messages[0].content}
                              </p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-cream/40 text-xs">{new Date(chat.updatedAt).toLocaleDateString()}</p>
                            <p className="text-cream/30 text-xs">{new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                        {/* Action buttons */}
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {chat.status === 'closed' && (
                            <motion.button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleArchiveChat(chat.id);
                              }}
                              className="p-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-colors"
                              whileHover={{ scale: 1.05 }}
                              title="Archive"
                            >
                              <Archive className="w-4 h-4" />
                            </motion.button>
                          )}
                          {chat.status === 'archived' && (
                            <>
                              <motion.button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReopenChat(chat.id);
                                }}
                                className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
                                whileHover={{ scale: 1.05 }}
                                title="Reopen"
                              >
                                <RefreshCcw className="w-4 h-4" />
                              </motion.button>
                              <motion.button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setConfirmDialog({
                                    isOpen: true,
                                    title: 'Delete Chat Permanently',
                                    message: `Are you sure you want to permanently delete the conversation with ${chat.userName}? This cannot be undone.`,
                                    onConfirm: () => handleDeleteChat(chat.id)
                                  });
                                }}
                                className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
                                whileHover={{ scale: 1.05 }}
                                title="Delete permanently"
                              >
                                <Trash2 className="w-4 h-4" />
                              </motion.button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quick Reply Buttons Management */}
              <div className="glass-card mt-6">
                <div className="p-4 border-b border-gold/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gold/20 flex items-center justify-center">
                      <MessageCircle className="w-4 h-4 text-gold" />
                    </div>
                    <div>
                      <h3 className="text-cream font-medium">Quick Reply Buttons</h3>
                      <p className="text-cream/50 text-xs">Predefined responses for fast replies</p>
                    </div>
                  </div>
                  {!editingQuickReplies ? (
                    <motion.button
                      onClick={() => {
                        setQuickRepliesDraft([...quickReplies]);
                        setEditingQuickReplies(true);
                      }}
                      className="px-3 py-1.5 bg-gold/20 text-gold rounded-lg text-sm flex items-center gap-2"
                      whileHover={{ scale: 1.02 }}
                    >
                      <Edit3 className="w-3 h-3" />
                      Edit
                    </motion.button>
                  ) : (
                    <div className="flex gap-2">
                      <motion.button
                        onClick={() => {
                          setEditingQuickReplies(false);
                          setQuickRepliesDraft([...quickReplies]);
                        }}
                        className="px-3 py-1.5 bg-navy-light text-cream/70 rounded-lg text-sm"
                        whileHover={{ scale: 1.02 }}
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        onClick={async () => {
                          try {
                            const token = localStorage.getItem('echotrail_token');
                            const res = await fetch(`${API_URL}/api/admin/support-quick-replies`, {
                              method: 'PUT',
                              headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${token}`
                              },
                              body: JSON.stringify({ replies: quickRepliesDraft })
                            });
                            if (res.ok) {
                              setQuickReplies(quickRepliesDraft);
                              setEditingQuickReplies(false);
                            }
                          } catch (error) {
                            console.error('Failed to save quick replies:', error);
                          }
                        }}
                        className="px-3 py-1.5 bg-gold text-navy rounded-lg text-sm flex items-center gap-2"
                        whileHover={{ scale: 1.02 }}
                      >
                        <Save className="w-3 h-3" />
                        Save
                      </motion.button>
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-3">
                  {(editingQuickReplies ? quickRepliesDraft : quickReplies).map((reply, index) => (
                    <div key={reply.id} className="flex gap-3 items-start">
                      {editingQuickReplies ? (
                        <>
                          <input
                            type="text"
                            value={reply.label}
                            onChange={(e) => {
                              const updated = [...quickRepliesDraft];
                              updated[index] = { ...reply, label: e.target.value };
                              setQuickRepliesDraft(updated);
                            }}
                            placeholder="Button Label"
                            className="w-32 px-3 py-2 bg-navy-dark/50 border border-gold/20 rounded-lg text-cream text-sm focus:outline-none focus:border-gold/50"
                          />
                          <textarea
                            value={reply.text}
                            onChange={(e) => {
                              const updated = [...quickRepliesDraft];
                              updated[index] = { ...reply, text: e.target.value };
                              setQuickRepliesDraft(updated);
                            }}
                            placeholder="Message text..."
                            rows={2}
                            className="flex-1 px-3 py-2 bg-navy-dark/50 border border-gold/20 rounded-lg text-cream text-sm resize-none focus:outline-none focus:border-gold/50"
                          />
                          <motion.button
                            onClick={() => {
                              setQuickRepliesDraft(quickRepliesDraft.filter((_, i) => i !== index));
                            }}
                            className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"
                            whileHover={{ scale: 1.05 }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </>
                      ) : (
                        <div className="flex-1 p-3 bg-navy-dark/30 rounded-lg">
                          <span className="px-2 py-0.5 bg-gold/20 text-gold text-xs rounded mr-2">{reply.label}</span>
                          <span className="text-cream/70 text-sm">{reply.text}</span>
                        </div>
                      )}
                    </div>
                  ))}

                  {editingQuickReplies && (
                    <motion.button
                      onClick={() => {
                        setQuickRepliesDraft([
                          ...quickRepliesDraft,
                          { id: Date.now().toString(), label: '', text: '' }
                        ]);
                      }}
                      className="w-full p-3 border-2 border-dashed border-gold/20 rounded-lg text-gold/60 hover:text-gold hover:border-gold/40 transition-colors flex items-center justify-center gap-2"
                      whileHover={{ scale: 1.01 }}
                    >
                      <Plus className="w-4 h-4" />
                      Add Quick Reply
                    </motion.button>
                  )}

                  {quickReplies.length === 0 && !editingQuickReplies && (
                    <div className="text-center py-6">
                      <p className="text-cream/40 text-sm">No quick replies configured</p>
                      <p className="text-cream/30 text-xs mt-1">Click Edit to add predefined responses</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Support Avatar Settings */}
              <div className="glass-card mt-6 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-serif text-cream">Support Chat Avatar</h3>
                      <p className="text-cream/50 text-sm">Name and image shown to users in support chat</p>
                    </div>
                  </div>
                  {!editingSupportAvatar ? (
                    <motion.button
                      onClick={() => {
                        setSupportAvatarDraft({ name: supportAvatar.name, imageUrl: supportAvatar.imageUrl || '' });
                        setEditingSupportAvatar(true);
                      }}
                      className="px-4 py-2 bg-gold/20 text-gold rounded-lg text-sm flex items-center gap-2"
                      whileHover={{ scale: 1.02 }}
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </motion.button>
                  ) : (
                    <div className="flex gap-2">
                      <motion.button
                        onClick={() => setEditingSupportAvatar(false)}
                        className="px-4 py-2 bg-navy-light text-cream/70 rounded-lg text-sm"
                        whileHover={{ scale: 1.02 }}
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        onClick={saveSupportAvatar}
                        className="px-4 py-2 bg-gold text-navy rounded-lg text-sm flex items-center gap-2"
                        whileHover={{ scale: 1.02 }}
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </motion.button>
                    </div>
                  )}
                </div>

                <div className="flex flex-col md:flex-row gap-6 items-start">
                  {/* Avatar Preview */}
                  <div className="flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full overflow-hidden border-3 border-gold/30 bg-navy-dark flex items-center justify-center">
                      {editingSupportAvatar ? (
                        supportAvatarDraft.imageUrl ? (
                          <img src={supportAvatarDraft.imageUrl} alt="Support Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon className="w-12 h-12 text-gold/30" />
                        )
                      ) : supportAvatar.imageUrl ? (
                        <img src={supportAvatar.imageUrl} alt="Support Avatar" className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-12 h-12 text-gold/30" />
                      )}
                    </div>
                    {editingSupportAvatar && (
                      <>
                        <input
                          type="file"
                          accept="image/*"
                          ref={supportAvatarInputRef}
                          onChange={handleSupportAvatarImageUpload}
                          className="hidden"
                        />
                        <motion.button
                          onClick={() => supportAvatarInputRef.current?.click()}
                          className="mt-3 px-3 py-1.5 bg-navy-light text-cream/70 rounded-lg text-sm flex items-center gap-2"
                          whileHover={{ scale: 1.02 }}
                        >
                          <Upload className="w-3.5 h-3.5" />
                          Upload
                        </motion.button>
                      </>
                    )}
                  </div>

                  {/* Name Input */}
                  <div className="flex-1">
                    <label className="text-cream/50 text-sm">Display Name</label>
                    {editingSupportAvatar ? (
                      <input
                        type="text"
                        value={supportAvatarDraft.name}
                        onChange={(e) => setSupportAvatarDraft(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g., Support Team, Sarah, Help Desk"
                        className="w-full mt-1 px-4 py-3 bg-navy-dark/50 border border-gold/20 rounded-xl text-cream placeholder-cream/30 focus:outline-none focus:border-gold/50"
                      />
                    ) : (
                      <p className="text-cream text-xl font-medium mt-1">{supportAvatar.name}</p>
                    )}
                    <p className="text-cream/40 text-xs mt-2">
                      This name will be shown to users when they receive support messages
                    </p>
                  </div>
                </div>

                {/* Preview Card */}
                <div className="mt-6 p-4 bg-navy-dark/30 rounded-xl border border-gold/10">
                  <p className="text-cream/50 text-sm mb-3">Preview (as seen by users):</p>
                  <div className="flex items-center gap-3 p-3 bg-navy-dark/50 rounded-lg max-w-sm">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gold/30 bg-navy flex items-center justify-center flex-shrink-0">
                      {(editingSupportAvatar ? supportAvatarDraft.imageUrl : supportAvatar.imageUrl) ? (
                        <img
                          src={editingSupportAvatar ? supportAvatarDraft.imageUrl : supportAvatar.imageUrl}
                          alt="Support"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <UserIcon className="w-5 h-5 text-gold/30" />
                      )}
                    </div>
                    <div>
                      <p className="text-cream font-medium text-sm">
                        {editingSupportAvatar ? (supportAvatarDraft.name || 'Support Team') : supportAvatar.name}
                      </p>
                      <p className="text-cream/40 text-xs">EchoTrail Support</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Support Chat Detail */}
          {activeTab === 'support' && selectedChat && (
            <motion.div
              key="support-chat"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="h-[calc(100vh-250px)] flex flex-col"
            >
              {/* Chat Header */}
              <div className="glass-card p-4 mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <motion.button
                    onClick={() => { setSelectedChat(null); setChatMessages([]); }}
                    className="p-2 hover:bg-navy-light/50 rounded-lg text-cream/60 hover:text-cream"
                    whileHover={{ scale: 1.05 }}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </motion.button>
                  <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-gold/60" />
                  </div>
                  <div>
                    <p className="text-cream font-medium">{selectedChat.userName || 'Unknown User'}</p>
                    <p className="text-cream/50 text-sm">{selectedChat.userEmail}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 text-sm rounded-full ${
                    selectedChat.status === 'open' ? 'bg-green-500/20 text-green-400' : 'bg-cream/10 text-cream/50'
                  }`}>{selectedChat.status}</span>
                  <motion.button
                    onClick={() => toggleChatStatus(selectedChat.id, selectedChat.status === 'open')}
                    className={`px-4 py-2 rounded-lg text-sm ${
                      selectedChat.status === 'open'
                        ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                    }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {selectedChat.status === 'open' ? 'Close Chat' : 'Reopen Chat'}
                  </motion.button>
                </div>
              </div>

              {/* Messages */}
              <div className="glass-card flex-1 flex flex-col overflow-hidden">
                {/* Typing indicator in header */}
                {isUserTyping && (
                  <div className="px-4 py-2 border-b border-gold/10 bg-gold/5">
                    <span className="text-gold text-sm animate-pulse">User is typing...</span>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chatMessages.map(msg => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        msg.sender === 'admin'
                          ? 'bg-gold text-navy rounded-br-md'
                          : 'bg-navy-dark text-cream rounded-bl-md'
                      }`}>
                        {msg.imageUrl && (
                          <img
                            src={msg.imageUrl}
                            alt="Attached"
                            className="max-w-full rounded-lg mb-2 cursor-pointer"
                            onClick={() => window.open(msg.imageUrl, '_blank')}
                          />
                        )}
                        {msg.content && <p className="text-sm">{msg.content}</p>}
                        <p className={`text-xs mt-1 ${msg.sender === 'admin' ? 'text-navy/50' : 'text-cream/40'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </motion.div>
                  ))}

                  {/* Typing indicator bubbles */}
                  {isUserTyping && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="bg-navy-dark rounded-2xl rounded-bl-md px-4 py-3">
                        <div className="flex gap-1">
                          <span className="w-2 h-2 bg-gold/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="w-2 h-2 bg-gold/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="w-2 h-2 bg-gold/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {chatMessages.length === 0 && !isUserTyping && (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-cream/40">No messages yet</p>
                    </div>
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

                {/* Quick Reply Buttons */}
                {selectedChat.status === 'open' && quickReplies.length > 0 && (
                  <div className="px-4 py-2 border-t border-gold/10 bg-navy-dark/20">
                    <div className="flex flex-wrap gap-2">
                      {quickReplies.map((reply) => (
                        <motion.button
                          key={reply.id}
                          type="button"
                          onClick={() => setNewMessage(reply.text)}
                          className="px-3 py-1.5 bg-gold/10 hover:bg-gold/20 border border-gold/20 hover:border-gold/40 rounded-lg text-sm text-cream/70 hover:text-cream transition-colors"
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                        >
                          {reply.label}
                        </motion.button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input */}
                {selectedChat.status === 'open' && (
                  <form onSubmit={sendAdminMessage} className="p-4 border-t border-gold/10">
                    <div className="flex gap-3">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageSelect}
                        accept="image/*"
                        className="hidden"
                      />
                      <motion.button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-12 h-12 rounded-xl bg-navy-dark/50 border border-gold/20 flex items-center justify-center text-cream/50 hover:text-cream hover:border-gold/40 transition-colors"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Upload className="w-5 h-5" />
                      </motion.button>
                      <input
                        type="text"
                        value={newMessage}
                        onChange={handleMessageChange}
                        placeholder="Type your reply..."
                        className="flex-1 px-4 py-3 bg-navy-dark/50 border border-gold/20 rounded-xl text-cream placeholder-cream/30 focus:outline-none focus:border-gold/50"
                      />
                      <motion.button
                        type="submit"
                        disabled={(!newMessage.trim() && !pendingImage) || sendingMessage}
                        className="px-6 py-3 bg-gold text-navy rounded-xl font-medium disabled:opacity-50 flex items-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        {sendingMessage ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                        Send
                      </motion.button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Success Message */}
              {notificationSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card p-4 bg-green-500/10 border-2 border-green-500/30"
                >
                  <p className="text-green-400 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" />
                    Notification sent successfully!
                  </p>
                </motion.div>
              )}

              <div className="grid lg:grid-cols-2 gap-6">
                {/* Send Notification Panel */}
                <div className="glass-card p-6">
                  <h2 className="text-xl font-serif text-cream mb-6">Send Notification</h2>

                  {/* Template Selector */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-cream/70 mb-2">
                      Use Template (Optional)
                    </label>
                    <select
                      value={selectedTemplate || ''}
                      onChange={(e) => {
                        const templateId = e.target.value;
                        if (templateId) {
                          const template = notificationTemplates.find(t => t.id === templateId);
                          if (template) {
                            setSelectedTemplate(templateId);
                            setNotificationForm({
                              title: template.title,
                              message: template.message,
                              type: template.type,
                              category: template.category || 'admin',
                              link: template.link || '',
                              actionText: template.actionText || ''
                            });
                          }
                        } else {
                          setSelectedTemplate(null);
                          setNotificationForm({
                            title: '',
                            message: '',
                            type: 'info',
                            category: 'admin',
                            link: '',
                            actionText: ''
                          });
                        }
                      }}
                      className="w-full px-4 py-3 bg-navy-dark/50 border border-cream/20 rounded-xl text-cream focus:border-gold/50 focus:outline-none"
                    >
                      <option value="">Custom Message</option>
                      {notificationTemplates.map(template => (
                        <option key={template.id} value={template.id}>
                          {template.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Title */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-cream/70 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={notificationForm.title}
                      onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
                      placeholder="Enter notification title"
                      className="w-full px-4 py-3 bg-navy-dark/50 border border-cream/20 rounded-xl text-cream placeholder-cream/30 focus:border-gold/50 focus:outline-none"
                    />
                  </div>

                  {/* Message */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-cream/70 mb-2">
                      Message *
                    </label>
                    <textarea
                      value={notificationForm.message}
                      onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
                      placeholder="Enter notification message"
                      rows={4}
                      className="w-full px-4 py-3 bg-navy-dark/50 border border-cream/20 rounded-xl text-cream placeholder-cream/30 focus:border-gold/50 focus:outline-none resize-none"
                    />
                  </div>

                  {/* Type */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-cream/70 mb-2">
                      Type
                    </label>
                    <select
                      value={notificationForm.type}
                      onChange={(e) => setNotificationForm({ ...notificationForm, type: e.target.value })}
                      className="w-full px-4 py-3 bg-navy-dark/50 border border-cream/20 rounded-xl text-cream focus:border-gold/50 focus:outline-none"
                    >
                      <option value="info">Info (Blue)</option>
                      <option value="success">Success (Green)</option>
                      <option value="warning">Warning (Yellow)</option>
                      <option value="error">Error (Red)</option>
                      <option value="announcement">Announcement (Purple)</option>
                    </select>
                  </div>

                  {/* Link (Optional) */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-cream/70 mb-2">
                      Link (Optional)
                    </label>
                    <input
                      type="text"
                      value={notificationForm.link}
                      onChange={(e) => setNotificationForm({ ...notificationForm, link: e.target.value })}
                      placeholder="/persona, /echo-sim, etc."
                      className="w-full px-4 py-3 bg-navy-dark/50 border border-cream/20 rounded-xl text-cream placeholder-cream/30 focus:border-gold/50 focus:outline-none"
                    />
                  </div>

                  {/* Action Text (Optional) */}
                  {notificationForm.link && (
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-cream/70 mb-2">
                        Action Button Text
                      </label>
                      <input
                        type="text"
                        value={notificationForm.actionText}
                        onChange={(e) => setNotificationForm({ ...notificationForm, actionText: e.target.value })}
                        placeholder="View Details, Complete Now, etc."
                        className="w-full px-4 py-3 bg-navy-dark/50 border border-cream/20 rounded-xl text-cream placeholder-cream/30 focus:border-gold/50 focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Send Buttons */}
                  <div className="space-y-3">
                    <button
                      onClick={async () => {
                        if (!notificationForm.title || !notificationForm.message) {
                          alert('Please fill in title and message');
                          return;
                        }

                        if (selectedUsers.length === 0) {
                          alert('Please select at least one user');
                          return;
                        }

                        setSendingNotification(true);
                        setNotificationSuccess(false);

                        try {
                          await api.sendNotification(selectedUsers, notificationForm);
                          setNotificationSuccess(true);
                          setSelectedUsers([]);
                          setNotificationForm({
                            title: '',
                            message: '',
                            type: 'info',
                            category: 'admin',
                            link: '',
                            actionText: ''
                          });
                          setSelectedTemplate(null);
                          setTimeout(() => setNotificationSuccess(false), 5000);
                        } catch (error) {
                          console.error('Failed to send notification:', error);
                          alert('Failed to send notification. Please try again.');
                        } finally {
                          setSendingNotification(false);
                        }
                      }}
                      disabled={sendingNotification || !notificationForm.title || !notificationForm.message || selectedUsers.length === 0}
                      className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-500 hover:to-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {sendingNotification ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Users className="w-5 h-5" />
                          Send to Selected Users ({selectedUsers.length})
                        </>
                      )}
                    </button>

                    <button
                      onClick={async () => {
                        if (!notificationForm.title || !notificationForm.message) {
                          alert('Please fill in title and message');
                          return;
                        }

                        if (!confirm(`Send this notification to ALL users? This cannot be undone.`)) {
                          return;
                        }

                        setSendingNotification(true);
                        setNotificationSuccess(false);

                        try {
                          await api.broadcastNotification(notificationForm);
                          setNotificationSuccess(true);
                          setNotificationForm({
                            title: '',
                            message: '',
                            type: 'info',
                            category: 'admin',
                            link: '',
                            actionText: ''
                          });
                          setSelectedTemplate(null);
                          setTimeout(() => setNotificationSuccess(false), 5000);
                        } catch (error) {
                          console.error('Failed to broadcast notification:', error);
                          alert('Failed to broadcast notification. Please try again.');
                        } finally {
                          setSendingNotification(false);
                        }
                      }}
                      disabled={sendingNotification || !notificationForm.title || !notificationForm.message}
                      className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {sendingNotification ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Broadcast to All Users
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* User Selector */}
                <div className="glass-card p-6">
                  <h2 className="text-xl font-serif text-cream mb-6">Select Recipients</h2>

                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {users.length === 0 ? (
                      <p className="text-cream/50 text-sm text-center py-8">No users found</p>
                    ) : (
                      users.map(user => (
                        <label
                          key={user.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all cursor-pointer ${
                            selectedUsers.includes(user.id)
                              ? 'border-gold bg-gold/10'
                              : 'border-cream/10 hover:border-cream/30'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(user.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedUsers([...selectedUsers, user.id]);
                              } else {
                                setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                              }
                            }}
                            className="w-5 h-5 rounded border-cream/30 text-gold focus:ring-gold/50"
                          />
                          <div className="flex-1">
                            <p className="text-cream font-medium">
                              {user.firstName} {user.lastName}
                            </p>
                            <p className="text-cream/50 text-sm">{user.email}</p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>

                  {users.length > 0 && (
                    <div className="mt-4 flex items-center justify-between">
                      <button
                        onClick={() => setSelectedUsers(users.map(u => u.id))}
                        className="text-sm text-gold hover:text-gold-light transition-colors"
                      >
                        Select All
                      </button>
                      <button
                        onClick={() => setSelectedUsers([])}
                        className="text-sm text-cream/50 hover:text-cream/70 transition-colors"
                      >
                        Clear Selection
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* Referral System Tab */}
          {activeTab === 'referral' && (
            <motion.div
              key="referral"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Referral Stats Overview */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-card p-4 text-center">
                  <p className="text-3xl font-bold text-gold">{referralStats.totalReferrals}</p>
                  <p className="text-cream/50 text-sm">Total Referrals</p>
                </div>
                <div className="glass-card p-4 text-center">
                  <p className="text-3xl font-bold text-green-400">{referralStats.successfulReferrals}</p>
                  <p className="text-cream/50 text-sm">Successful</p>
                </div>
                <div className="glass-card p-4 text-center">
                  <p className="text-3xl font-bold text-yellow-400">{referralStats.pendingReferrals}</p>
                  <p className="text-cream/50 text-sm">Pending</p>
                </div>
                <div className="glass-card p-4 text-center">
                  <p className="text-3xl font-bold text-cream">€{referralStats.totalRewardsGiven?.toFixed(2) || '0.00'}</p>
                  <p className="text-cream/50 text-sm">Rewards Given</p>
                </div>
              </div>

              {/* Referral Program Settings */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
                      <Heart className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-serif text-cream">Referral Program Settings</h3>
                      <p className="text-cream/50 text-sm">Configure rewards for referrals</p>
                    </div>
                  </div>
                  {!editingReferral ? (
                    <motion.button
                      onClick={() => setEditingReferral(true)}
                      className="px-4 py-2 bg-gold/20 text-gold rounded-lg text-sm flex items-center gap-2"
                      whileHover={{ scale: 1.02 }}
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </motion.button>
                  ) : (
                    <div className="flex gap-2">
                      <motion.button
                        onClick={() => setEditingReferral(false)}
                        className="px-4 py-2 bg-navy-light text-cream/70 rounded-lg text-sm"
                        whileHover={{ scale: 1.02 }}
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        onClick={saveReferralSettings}
                        className="px-4 py-2 bg-gold text-navy rounded-lg text-sm flex items-center gap-2"
                        whileHover={{ scale: 1.02 }}
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </motion.button>
                    </div>
                  )}
                </div>

                {/* Enable/Disable Toggle */}
                <div className="mb-6 p-4 bg-navy-dark/30 rounded-xl border border-gold/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-cream font-medium">Program Status</h4>
                      <p className="text-cream/50 text-sm">Enable or disable the referral program</p>
                    </div>
                    <button
                      onClick={() => editingReferral && setReferralSettings(prev => ({ ...prev, enabled: !prev.enabled }))}
                      disabled={!editingReferral}
                      className={`relative w-14 h-7 rounded-full transition-colors ${
                        referralSettings.enabled ? 'bg-green-500' : 'bg-navy-light'
                      } ${!editingReferral ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${
                        referralSettings.enabled ? 'left-8' : 'left-1'
                      }`} />
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Reward Settings */}
                  <div className="space-y-4">
                    <h4 className="text-cream/70 text-sm font-medium border-b border-gold/10 pb-2">Reward Settings</h4>

                    <div>
                      <label className="text-cream/50 text-sm">Referrer Reward (€)</label>
                      <p className="text-cream/40 text-xs mb-1">Amount the referrer receives</p>
                      {editingReferral ? (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={referralSettings.referrerReward}
                          onChange={(e) => setReferralSettings(prev => ({
                            ...prev,
                            referrerReward: parseFloat(e.target.value) || 0
                          }))}
                          className="w-full px-4 py-2 bg-navy-dark/50 border border-gold/20 rounded-xl text-cream focus:outline-none focus:border-gold/50"
                        />
                      ) : (
                        <p className="text-cream text-xl font-medium">€{referralSettings.referrerReward?.toFixed(2)}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-cream/50 text-sm">Referee Reward (€)</label>
                      <p className="text-cream/40 text-xs mb-1">Amount the new user receives</p>
                      {editingReferral ? (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={referralSettings.refereeReward}
                          onChange={(e) => setReferralSettings(prev => ({
                            ...prev,
                            refereeReward: parseFloat(e.target.value) || 0
                          }))}
                          className="w-full px-4 py-2 bg-navy-dark/50 border border-gold/20 rounded-xl text-cream focus:outline-none focus:border-gold/50"
                        />
                      ) : (
                        <p className="text-cream text-xl font-medium">€{referralSettings.refereeReward?.toFixed(2)}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-cream/50 text-sm">Reward Type</label>
                      {editingReferral ? (
                        <select
                          value={referralSettings.rewardType}
                          onChange={(e) => setReferralSettings(prev => ({
                            ...prev,
                            rewardType: e.target.value
                          }))}
                          className="w-full mt-1 px-4 py-2 bg-navy-dark/50 border border-gold/20 rounded-xl text-cream focus:outline-none focus:border-gold/50"
                        >
                          <option value="tokens">Token Credits</option>
                          <option value="discount">Discount on Subscription</option>
                        </select>
                      ) : (
                        <p className="text-cream text-lg font-medium capitalize">{referralSettings.rewardType === 'tokens' ? 'Token Credits' : 'Discount'}</p>
                      )}
                    </div>
                  </div>

                  {/* Conditions */}
                  <div className="space-y-4">
                    <h4 className="text-cream/70 text-sm font-medium border-b border-gold/10 pb-2">Conditions</h4>

                    <div>
                      <label className="text-cream/50 text-sm">Minimum Purchase (€)</label>
                      <p className="text-cream/40 text-xs mb-1">Referee must spend at least this amount</p>
                      {editingReferral ? (
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={referralSettings.minPurchaseAmount}
                          onChange={(e) => setReferralSettings(prev => ({
                            ...prev,
                            minPurchaseAmount: parseFloat(e.target.value) || 0
                          }))}
                          className="w-full px-4 py-2 bg-navy-dark/50 border border-gold/20 rounded-xl text-cream focus:outline-none focus:border-gold/50"
                        />
                      ) : (
                        <p className="text-cream text-xl font-medium">€{referralSettings.minPurchaseAmount?.toFixed(2)}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-cream/50 text-sm">Expiration Days</label>
                      <p className="text-cream/40 text-xs mb-1">Days until referral link expires</p>
                      {editingReferral ? (
                        <input
                          type="number"
                          min="1"
                          value={referralSettings.expirationDays}
                          onChange={(e) => setReferralSettings(prev => ({
                            ...prev,
                            expirationDays: parseInt(e.target.value) || 30
                          }))}
                          className="w-full px-4 py-2 bg-navy-dark/50 border border-gold/20 rounded-xl text-cream focus:outline-none focus:border-gold/50"
                        />
                      ) : (
                        <p className="text-cream text-xl font-medium">{referralSettings.expirationDays} days</p>
                      )}
                    </div>

                    <div>
                      <label className="text-cream/50 text-sm">Max Referrals per User</label>
                      <p className="text-cream/40 text-xs mb-1">0 = unlimited</p>
                      {editingReferral ? (
                        <input
                          type="number"
                          min="0"
                          value={referralSettings.maxReferralsPerUser}
                          onChange={(e) => setReferralSettings(prev => ({
                            ...prev,
                            maxReferralsPerUser: parseInt(e.target.value) || 0
                          }))}
                          className="w-full px-4 py-2 bg-navy-dark/50 border border-gold/20 rounded-xl text-cream focus:outline-none focus:border-gold/50"
                        />
                      ) : (
                        <p className="text-cream text-xl font-medium">
                          {referralSettings.maxReferralsPerUser === 0 ? 'Unlimited' : referralSettings.maxReferralsPerUser}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Info Box */}
                <div className="mt-6 p-4 bg-navy-dark/30 rounded-xl border border-gold/10">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-gold/60 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-cream/70 text-sm">
                        <strong>How it works:</strong> Users share their referral link. When a new user signs up and makes a qualifying purchase
                        (subscription or €{referralSettings.minPurchaseAmount}+ tokens), both the referrer and referee receive their rewards.
                      </p>
                      <p className="text-cream/50 text-xs mt-2">
                        Rewards are automatically credited as token balance that can be used for platform features.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Example Referral Flow */}
              <div className="glass-card p-6">
                <h3 className="text-lg font-serif text-cream mb-4">Referral Flow Preview</h3>
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex-1 p-4 bg-navy-dark/30 rounded-xl text-center">
                    <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-2">
                      <UserIcon className="w-6 h-6 text-gold" />
                    </div>
                    <p className="text-cream font-medium">User A</p>
                    <p className="text-cream/50 text-sm">Shares link</p>
                  </div>
                  <div className="text-gold text-2xl">→</div>
                  <div className="flex-1 p-4 bg-navy-dark/30 rounded-xl text-center">
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center mx-auto mb-2">
                      <UserIcon className="w-6 h-6 text-blue-400" />
                    </div>
                    <p className="text-cream font-medium">User B</p>
                    <p className="text-cream/50 text-sm">Signs up & pays €{referralSettings.minPurchaseAmount}+</p>
                  </div>
                  <div className="text-gold text-2xl">→</div>
                  <div className="flex-1 p-4 bg-green-500/10 rounded-xl text-center border border-green-500/30">
                    <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-2">
                      <CheckCircle2 className="w-6 h-6 text-green-400" />
                    </div>
                    <p className="text-cream font-medium">Rewards!</p>
                    <p className="text-green-400 text-sm">
                      A: €{referralSettings.referrerReward} | B: €{referralSettings.refereeReward}
                    </p>
                  </div>
                </div>
              </div>

              {/* Top 10 Referrers Leaderboard */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
                      <Award className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-serif text-cream">Top 10 Referrers</h3>
                      <p className="text-cream/50 text-sm">Best performing affiliates</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {[
                      { value: 'day', label: 'Today' },
                      { value: 'week', label: 'Week' },
                      { value: 'month', label: 'Month' },
                      { value: 'all', label: 'All Time' }
                    ].map(period => (
                      <button
                        key={period.value}
                        onClick={() => setTopReferrersPeriod(period.value)}
                        className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          topReferrersPeriod === period.value
                            ? 'bg-gold text-navy font-medium'
                            : 'bg-navy-light/50 text-cream/70 hover:bg-navy-light'
                        }`}
                      >
                        {period.label}
                      </button>
                    ))}
                  </div>
                </div>

                {topReferrers.length > 0 ? (
                  <div className="space-y-3">
                    {topReferrers.map((referrer, index) => (
                      <div
                        key={referrer.user.id}
                        className={`flex items-center justify-between p-4 rounded-xl ${
                          index === 0 ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30' :
                          index === 1 ? 'bg-gradient-to-r from-gray-400/20 to-gray-500/20 border border-gray-400/30' :
                          index === 2 ? 'bg-gradient-to-r from-amber-600/20 to-amber-700/20 border border-amber-600/30' :
                          'bg-navy-dark/30'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                            index === 0 ? 'bg-yellow-500 text-navy' :
                            index === 1 ? 'bg-gray-400 text-navy' :
                            index === 2 ? 'bg-amber-600 text-white' :
                            'bg-navy-light text-cream'
                          }`}>
                            {index + 1}
                          </div>
                          <div className="flex items-center gap-3">
                            {referrer.user.avatarUrl ? (
                              <img
                                src={referrer.user.avatarUrl}
                                alt={referrer.user.firstName}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gold/20 flex items-center justify-center">
                                <span className="text-gold font-medium">
                                  {referrer.user.firstName?.[0]}{referrer.user.lastName?.[0]}
                                </span>
                              </div>
                            )}
                            <div>
                              <p className="text-cream font-medium">
                                {referrer.user.firstName} {referrer.user.lastName}
                              </p>
                              <p className="text-cream/50 text-xs">{referrer.user.email}</p>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-cream font-bold text-lg">{referrer.referralCount} Referrals</p>
                          <p className="text-green-400 text-sm">€{referrer.totalReward?.toFixed(2)} earned</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Award className="w-12 h-12 text-cream/30 mx-auto mb-3" />
                    <p className="text-cream/50">No referrals in this period</p>
                    <p className="text-cream/30 text-sm">Completed referrals will appear here</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Shop Tab */}
          {activeTab === 'shop' && (
            <motion.div
              key="shop"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Header with Add Button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-serif text-cream">Shop Products</h2>
                    <p className="text-cream/50 text-sm">Manage products for the store</p>
                  </div>
                </div>
                <motion.button
                  onClick={() => {
                    setEditingProduct('new');
                    setProductDraft({ name: '', description: '', price: 0, imageUrl: '', category: 'addon', isActive: true });
                  }}
                  className="px-4 py-2 bg-gold text-navy rounded-lg font-medium flex items-center gap-2"
                  whileHover={{ scale: 1.02 }}
                >
                  <Plus className="w-4 h-4" />
                  Add Product
                </motion.button>
              </div>

              {/* Product Edit Form */}
              {editingProduct && (
                <div className="glass-card p-6">
                  <h3 className="text-lg font-serif text-cream mb-4">
                    {editingProduct === 'new' ? 'New Product' : 'Edit Product'}
                  </h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-cream/50 text-sm">Product Name</label>
                      <input
                        type="text"
                        value={productDraft.name}
                        onChange={(e) => setProductDraft(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full mt-1 px-4 py-2 bg-navy-dark/50 border border-gold/20 rounded-xl text-cream focus:outline-none focus:border-gold/50"
                        placeholder="Product name"
                      />
                    </div>
                    <div>
                      <label className="text-cream/50 text-sm">Price (EUR)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={productDraft.price}
                        onChange={(e) => setProductDraft(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                        className="w-full mt-1 px-4 py-2 bg-navy-dark/50 border border-gold/20 rounded-xl text-cream focus:outline-none focus:border-gold/50"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-cream/50 text-sm">Description</label>
                      <textarea
                        value={productDraft.description}
                        onChange={(e) => setProductDraft(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full mt-1 px-4 py-2 bg-navy-dark/50 border border-gold/20 rounded-xl text-cream focus:outline-none focus:border-gold/50 min-h-[100px]"
                        placeholder="Product description"
                      />
                    </div>
                    <div>
                      <label className="text-cream/50 text-sm">Image URL</label>
                      <input
                        type="text"
                        value={productDraft.imageUrl}
                        onChange={(e) => setProductDraft(prev => ({ ...prev, imageUrl: e.target.value }))}
                        className="w-full mt-1 px-4 py-2 bg-navy-dark/50 border border-gold/20 rounded-xl text-cream focus:outline-none focus:border-gold/50"
                        placeholder="https://..."
                      />
                    </div>
                    <div>
                      <label className="text-cream/50 text-sm">Category</label>
                      <select
                        value={productDraft.category}
                        onChange={(e) => setProductDraft(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full mt-1 px-4 py-2 bg-navy-dark/50 border border-gold/20 rounded-xl text-cream focus:outline-none focus:border-gold/50"
                      >
                        <option value="subscription">Subscription</option>
                        <option value="tokens">Tokens</option>
                        <option value="addon">Add-on</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setProductDraft(prev => ({ ...prev, isActive: !prev.isActive }))}
                        className={`relative w-14 h-7 rounded-full transition-colors ${
                          productDraft.isActive ? 'bg-green-500' : 'bg-navy-light'
                        }`}
                      >
                        <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all ${
                          productDraft.isActive ? 'left-8' : 'left-1'
                        }`} />
                      </button>
                      <span className="text-cream/70 text-sm">Active</span>
                    </div>
                  </div>
                  {productDraft.imageUrl && (
                    <div className="mt-4">
                      <p className="text-cream/50 text-sm mb-2">Preview:</p>
                      <img
                        src={productDraft.imageUrl}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-xl border border-gold/20"
                      />
                    </div>
                  )}
                  <div className="flex gap-3 mt-6">
                    <motion.button
                      onClick={() => {
                        setEditingProduct(null);
                        setProductDraft({ name: '', description: '', price: 0, imageUrl: '', category: 'addon', isActive: true });
                      }}
                      className="px-4 py-2 bg-navy-light text-cream/70 rounded-lg"
                      whileHover={{ scale: 1.02 }}
                    >
                      Cancel
                    </motion.button>
                    <motion.button
                      onClick={saveProduct}
                      className="px-4 py-2 bg-gold text-navy rounded-lg font-medium flex items-center gap-2"
                      whileHover={{ scale: 1.02 }}
                    >
                      <Save className="w-4 h-4" />
                      Save Product
                    </motion.button>
                  </div>
                </div>
              )}

              {/* Products Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {shopProducts.map(product => (
                  <div key={product.id} className="glass-card p-4">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-40 object-cover rounded-xl mb-4"
                      />
                    ) : (
                      <div className="w-full h-40 bg-navy-dark/50 rounded-xl mb-4 flex items-center justify-center">
                        <Package className="w-12 h-12 text-cream/30" />
                      </div>
                    )}
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="text-cream font-medium">{product.name}</h3>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          product.category === 'subscription' ? 'bg-purple-500/20 text-purple-400' :
                          product.category === 'tokens' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-blue-500/20 text-blue-400'
                        }`}>
                          {product.category}
                        </span>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        product.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-cream/60 text-sm mb-3 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-gold text-xl font-bold">€{product.price.toFixed(2)}</p>
                      <div className="flex gap-2">
                        <motion.button
                          onClick={() => {
                            setEditingProduct(product.id);
                            setProductDraft({
                              name: product.name,
                              description: product.description,
                              price: product.price,
                              imageUrl: product.imageUrl || '',
                              category: product.category,
                              isActive: product.isActive
                            });
                          }}
                          className="p-2 bg-navy-light rounded-lg text-cream/70 hover:text-cream"
                          whileHover={{ scale: 1.05 }}
                        >
                          <Edit3 className="w-4 h-4" />
                        </motion.button>
                        <motion.button
                          onClick={() => setConfirmDialog({
                            isOpen: true,
                            title: 'Delete Product',
                            message: `Are you sure you want to delete "${product.name}"?`,
                            onConfirm: () => {
                              deleteProduct(product.id);
                              setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                            }
                          })}
                          className="p-2 bg-red-500/20 rounded-lg text-red-400 hover:bg-red-500/30"
                          whileHover={{ scale: 1.05 }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {shopProducts.length === 0 && !editingProduct && (
                <div className="glass-card p-8 text-center">
                  <Package className="w-16 h-16 text-cream/30 mx-auto mb-4" />
                  <p className="text-cream/50 text-lg">No products yet</p>
                  <p className="text-cream/30 text-sm">Add your first product to get started</p>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Avatar Background Management */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                      <Image className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-serif text-cream">Avatar Backgrounds</h3>
                      <p className="text-cream/50 text-sm">Manage available background images</p>
                    </div>
                  </div>
                  <motion.button
                    onClick={() => {
                      setEditingBackground('new');
                      setBackgroundDraft({ name: '', imageUrl: '', isActive: true });
                    }}
                    className="px-4 py-2 bg-gold text-navy rounded-lg font-medium flex items-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Plus className="w-4 h-4" />
                    Add Background
                  </motion.button>
                </div>

                {/* Add/Edit Background Modal */}
                {editingBackground && (
                  <div className="mb-6 p-4 bg-navy-dark/50 rounded-xl border border-gold/20">
                    <h4 className="text-cream font-medium mb-4">
                      {editingBackground === 'new' ? 'Add New Background' : 'Edit Background'}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-cream/70 text-sm block mb-1">Name</label>
                        <input
                          type="text"
                          value={backgroundDraft.name}
                          onChange={(e) => setBackgroundDraft(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="e.g., Mountain View"
                          className="w-full px-4 py-2 bg-navy-dark border border-gold/20 rounded-lg text-cream placeholder-cream/30 focus:outline-none focus:border-gold/50"
                        />
                      </div>
                      <div>
                        <label className="text-cream/70 text-sm block mb-1">Image URL</label>
                        <input
                          type="text"
                          value={backgroundDraft.imageUrl}
                          onChange={(e) => setBackgroundDraft(prev => ({ ...prev, imageUrl: e.target.value }))}
                          placeholder="https://images.unsplash.com/..."
                          className="w-full px-4 py-2 bg-navy-dark border border-gold/20 rounded-lg text-cream placeholder-cream/30 focus:outline-none focus:border-gold/50"
                        />
                      </div>
                    </div>
                    {backgroundDraft.imageUrl && (
                      <div className="mt-4">
                        <label className="text-cream/70 text-sm block mb-1">Preview</label>
                        <div className="aspect-video w-48 rounded-lg overflow-hidden border border-gold/20">
                          <img
                            src={backgroundDraft.imageUrl}
                            alt="Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/400x300?text=Invalid+URL'; }}
                          />
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-4 mt-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={backgroundDraft.isActive}
                          onChange={(e) => setBackgroundDraft(prev => ({ ...prev, isActive: e.target.checked }))}
                          className="w-4 h-4 rounded border-gold/30 bg-navy-dark text-gold focus:ring-gold/50"
                        />
                        <span className="text-cream/70 text-sm">Active</span>
                      </label>
                      <div className="flex-1" />
                      <motion.button
                        onClick={() => {
                          setEditingBackground(null);
                          setBackgroundDraft({ name: '', imageUrl: '', isActive: true });
                        }}
                        className="px-4 py-2 text-cream/60 hover:text-cream"
                        whileHover={{ scale: 1.02 }}
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        onClick={saveBackground}
                        disabled={!backgroundDraft.name || !backgroundDraft.imageUrl}
                        className="px-4 py-2 bg-gold text-navy rounded-lg font-medium flex items-center gap-2 disabled:opacity-50"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </motion.button>
                    </div>
                  </div>
                )}

                {/* Default Backgrounds */}
                <div className="mb-6">
                  <h4 className="text-cream/70 text-sm mb-3">Default Backgrounds (Built-in)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { id: 'beach', label: 'Beach', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop' },
                      { id: 'library', label: 'Library', url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400&h=300&fit=crop' },
                      { id: 'nature', label: 'Nature', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop' },
                      { id: 'home', label: 'Cozy Home', url: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=400&h=300&fit=crop' },
                    ].map(bg => (
                      <div key={bg.id} className="relative group">
                        <div className="aspect-video rounded-xl overflow-hidden border-2 border-gold/20">
                          <img src={bg.url} alt={bg.label} className="w-full h-full object-cover" />
                        </div>
                        <p className="text-cream/70 text-sm mt-2 text-center">{bg.label}</p>
                        <div className="absolute top-2 right-2 px-2 py-0.5 bg-green-500/80 rounded-full">
                          <span className="text-white text-xs">Active</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Custom Backgrounds */}
                {avatarBackgrounds.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-cream/70 text-sm mb-3">Custom Backgrounds</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {avatarBackgrounds.map(bg => (
                        <div key={bg.id} className="relative group">
                          <div className={`aspect-video rounded-xl overflow-hidden border-2 ${bg.isActive ? 'border-gold/40' : 'border-cream/10 opacity-60'}`}>
                            <img src={bg.imageUrl} alt={bg.name} className="w-full h-full object-cover" />
                          </div>
                          <p className="text-cream/70 text-sm mt-2 text-center">{bg.name}</p>
                          <div className="absolute top-2 right-2 flex gap-1">
                            <span className={`px-2 py-0.5 rounded-full text-white text-xs ${bg.isActive ? 'bg-green-500/80' : 'bg-cream/30'}`}>
                              {bg.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          {/* Hover actions */}
                          <div className="absolute inset-0 bg-navy/80 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center gap-2">
                            <motion.button
                              onClick={() => {
                                setEditingBackground(bg.id);
                                setBackgroundDraft({ name: bg.name, imageUrl: bg.imageUrl, isActive: bg.isActive });
                              }}
                              className="p-2 bg-gold/20 text-gold rounded-lg hover:bg-gold/30"
                              whileHover={{ scale: 1.1 }}
                            >
                              <Edit3 className="w-4 h-4" />
                            </motion.button>
                            <motion.button
                              onClick={() => {
                                setConfirmDialog({
                                  isOpen: true,
                                  title: 'Delete Background',
                                  message: `Are you sure you want to delete "${bg.name}"?`,
                                  onConfirm: () => {
                                    deleteBackground(bg.id);
                                    setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: () => {} });
                                  }
                                });
                              }}
                              className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30"
                              whileHover={{ scale: 1.1 }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </motion.button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Info */}
                <div className="p-4 bg-navy-dark/30 rounded-xl border border-gold/10">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-gold/60 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-cream/70 text-sm">
                        Use Unsplash URLs for best quality. Recommended format: <code className="bg-navy-dark px-1 rounded text-gold/80">?w=400&h=300&fit=crop</code>
                      </p>
                      <p className="text-cream/50 text-xs mt-2">
                        Custom backgrounds will appear in the user's avatar settings alongside the default options.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Avatar Styles */}
              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif text-cream">Avatar Styles</h3>
                    <p className="text-cream/50 text-sm">Toggle rendering styles available to users</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { id: 'realistic', label: 'Realistic', icon: '🎭' },
                    { id: 'enhanced', label: 'Enhanced', icon: '✨' },
                    { id: 'cartoon', label: 'Cartoon', icon: '🎨' },
                    { id: 'artistic', label: 'Artistic', icon: '🖼️' },
                    { id: 'anime', label: 'Anime', icon: '🌸' },
                    { id: 'pixar', label: '3D Pixar', icon: '🎬' },
                  ].map(style => {
                    const isActive = avatarStyles[style.id] !== false;
                    return (
                      <motion.div
                        key={style.id}
                        className={`p-4 rounded-xl border text-center cursor-pointer transition-all ${
                          isActive
                            ? 'bg-navy-dark/30 border-gold/20 hover:border-gold/40'
                            : 'bg-navy-dark/10 border-cream/10 opacity-60 hover:opacity-80'
                        }`}
                        onClick={() => toggleAvatarStyle(style.id)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="text-3xl block mb-2">{style.icon}</span>
                        <p className={`font-medium text-sm ${isActive ? 'text-cream' : 'text-cream/50'}`}>{style.label}</p>
                        <span className={`text-xs mt-2 inline-block px-2 py-0.5 rounded-full ${
                          isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {isActive ? 'Active' : 'Inactive'}
                        </span>
                      </motion.div>
                    );
                  })}
                </div>

                <div className="mt-4 p-3 bg-navy-dark/30 rounded-lg border border-gold/10">
                  <p className="text-cream/50 text-sm">
                    Click on a style to enable/disable it. Inactive styles won't be shown to users in their avatar settings.
                  </p>
                </div>
              </div>

              {/* AI System Prompts */}
              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif text-cream">AI System Prompts</h3>
                    <p className="text-cream/50 text-sm">Customize AI behavior and personality</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {defaultPrompts.map(prompt => {
                    const savedPrompt = aiPrompts.find(p => p.key === `prompt_${prompt.key}`);
                    const currentValue = savedPrompt?.value || prompt.defaultValue;
                    const isEditing = editingPrompt === prompt.key;
                    const isGlobal = prompt.isGlobal;

                    return (
                      <div
                        key={prompt.key}
                        className={`p-4 rounded-xl border ${
                          isGlobal
                            ? 'bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border-purple-500/30'
                            : 'bg-navy-dark/30 border-gold/10'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className={`font-medium ${isGlobal ? 'text-purple-300' : 'text-cream'}`}>
                                {prompt.name}
                              </h4>
                              {isGlobal && (
                                <span className="px-2 py-0.5 bg-purple-500/30 text-purple-300 text-xs rounded-full font-medium">
                                  MASTER
                                </span>
                              )}
                            </div>
                            <p className={`text-sm mt-1 ${isGlobal ? 'text-purple-300/70' : 'text-cream/50'}`}>
                              {prompt.description}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            {savedPrompt && (
                              <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                                Customized
                              </span>
                            )}
                            {!isEditing ? (
                              <motion.button
                                onClick={() => {
                                  setEditingPrompt(prompt.key);
                                  setPromptDraft({ value: currentValue, description: prompt.description });
                                }}
                                className={`p-2 ${isGlobal ? 'text-purple-400 hover:text-purple-300' : 'text-gold/70 hover:text-gold'}`}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Edit3 className="w-4 h-4" />
                              </motion.button>
                            ) : (
                              <div className="flex gap-2">
                                <motion.button
                                  onClick={() => savePrompt(prompt.key)}
                                  className="p-2 text-green-400 hover:text-green-300"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <Save className="w-4 h-4" />
                                </motion.button>
                                <motion.button
                                  onClick={() => { setEditingPrompt(null); setPromptDraft({ value: '', description: '' }); }}
                                  className="p-2 text-red-400 hover:text-red-300"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <X className="w-4 h-4" />
                                </motion.button>
                              </div>
                            )}
                          </div>
                        </div>

                        {isEditing ? (
                          <textarea
                            value={promptDraft.value}
                            onChange={(e) => setPromptDraft(prev => ({ ...prev, value: e.target.value }))}
                            className={`w-full h-64 px-4 py-3 border rounded-xl text-cream placeholder-cream/30 focus:outline-none font-mono text-sm resize-y ${
                              isGlobal
                                ? 'bg-purple-900/30 border-purple-500/30 focus:border-purple-400'
                                : 'bg-navy-dark/50 border-gold/20 focus:border-gold/50'
                            }`}
                          />
                        ) : (
                          <div className={`rounded-lg p-3 max-h-40 overflow-y-auto ${
                            isGlobal ? 'bg-purple-900/20' : 'bg-navy-dark/50'
                          }`}>
                            <pre className={`text-sm whitespace-pre-wrap font-mono ${
                              isGlobal ? 'text-purple-200/80' : 'text-cream/70'
                            }`}>{currentValue}</pre>
                          </div>
                        )}

                        {savedPrompt && !isEditing && (
                          <motion.button
                            onClick={() => resetPrompt(prompt.key)}
                            className="mt-3 text-sm text-cream/50 hover:text-cream flex items-center gap-1"
                            whileHover={{ scale: 1.02 }}
                          >
                            <RefreshCw className="w-3 h-3" />
                            Reset to default
                          </motion.button>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 p-4 bg-navy-dark/30 rounded-xl border border-gold/10">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-gold/60 flex-shrink-0 mt-0.5" />
                    <div className="space-y-2">
                      <p className="text-cream/70 text-sm font-medium">Available Placeholders:</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                        <code className="bg-navy-dark px-2 py-1 rounded text-gold/80">{'{userName}'}</code>
                        <code className="bg-navy-dark px-2 py-1 rounded text-gold/80">{'{humor}'}</code>
                        <code className="bg-navy-dark px-2 py-1 rounded text-gold/80">{'{empathy}'}</code>
                        <code className="bg-navy-dark px-2 py-1 rounded text-gold/80">{'{tradition}'}</code>
                        <code className="bg-navy-dark px-2 py-1 rounded text-gold/80">{'{adventure}'}</code>
                        <code className="bg-navy-dark px-2 py-1 rounded text-gold/80">{'{wisdom}'}</code>
                        <code className="bg-navy-dark px-2 py-1 rounded text-gold/80">{'{creativity}'}</code>
                        <code className="bg-navy-dark px-2 py-1 rounded text-gold/80">{'{patience}'}</code>
                        <code className="bg-navy-dark px-2 py-1 rounded text-gold/80">{'{optimism}'}</code>
                        <code className="bg-navy-dark px-2 py-1 rounded text-gold/80">{'{coreValues}'}</code>
                        <code className="bg-navy-dark px-2 py-1 rounded text-gold/80">{'{lifePhilosophy}'}</code>
                        <code className="bg-navy-dark px-2 py-1 rounded text-gold/80">{'{echoVibe}'}</code>
                        <code className="bg-navy-dark px-2 py-1 rounded text-gold/80">{'{stories}'}</code>
                        <code className="bg-navy-dark px-2 py-1 rounded text-gold/80">{'{recipient}'}</code>
                        <code className="bg-navy-dark px-2 py-1 rounded text-gold/80">{'{occasion}'}</code>
                        <code className="bg-navy-dark px-2 py-1 rounded text-gold/80">{'{deliveryDate}'}</code>
                      </div>
                      <p className="text-cream/50 text-xs mt-2">
                        The Global System Instructions are prepended to ALL AI requests and do not support placeholders.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subscription Pricing */}
              <div className="glass-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold to-gold-light flex items-center justify-center">
                      <TrendingUp className="w-5 h-5 text-navy" />
                    </div>
                    <div>
                      <h3 className="text-lg font-serif text-cream">Subscription Pricing</h3>
                      <p className="text-cream/50 text-sm">Configure subscription plan prices</p>
                    </div>
                  </div>
                  {!editingPricing ? (
                    <motion.button
                      onClick={() => setEditingPricing(true)}
                      className="px-4 py-2 bg-gold/20 text-gold rounded-lg text-sm flex items-center gap-2"
                      whileHover={{ scale: 1.02 }}
                    >
                      <Edit3 className="w-4 h-4" />
                      Edit
                    </motion.button>
                  ) : (
                    <div className="flex gap-2">
                      <motion.button
                        onClick={() => setEditingPricing(false)}
                        className="px-4 py-2 bg-cream/10 text-cream/60 rounded-lg text-sm"
                        whileHover={{ scale: 1.02 }}
                      >
                        Cancel
                      </motion.button>
                      <motion.button
                        onClick={savePricing}
                        className="px-4 py-2 bg-gold text-navy rounded-lg text-sm flex items-center gap-2"
                        whileHover={{ scale: 1.02 }}
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </motion.button>
                    </div>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {/* Standard Plan */}
                  <div className="p-4 bg-navy-dark/30 rounded-xl border border-blue-500/30">
                    <h4 className="text-blue-400 font-medium mb-4">Standard Plan</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-cream/50 text-sm">Monthly Price ($)</label>
                        {editingPricing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={pricing.standard.monthly}
                            onChange={(e) => setPricing(prev => ({
                              ...prev,
                              standard: { ...prev.standard, monthly: parseFloat(e.target.value) || 0 }
                            }))}
                            className="w-full mt-1 px-3 py-2 bg-navy-dark/50 border border-gold/20 rounded-lg text-cream focus:outline-none focus:border-gold/50"
                          />
                        ) : (
                          <p className="text-cream text-xl font-medium">${pricing.standard.monthly}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-cream/50 text-sm">Yearly Price ($)</label>
                        {editingPricing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={pricing.standard.yearly}
                            onChange={(e) => setPricing(prev => ({
                              ...prev,
                              standard: { ...prev.standard, yearly: parseFloat(e.target.value) || 0 }
                            }))}
                            className="w-full mt-1 px-3 py-2 bg-navy-dark/50 border border-gold/20 rounded-lg text-cream focus:outline-none focus:border-gold/50"
                          />
                        ) : (
                          <p className="text-cream text-xl font-medium">${pricing.standard.yearly}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Premium Plan */}
                  <div className="p-4 bg-navy-dark/30 rounded-xl border border-gold/30">
                    <h4 className="text-gold font-medium mb-4">Premium Plan</h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-cream/50 text-sm">Monthly Price ($)</label>
                        {editingPricing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={pricing.premium.monthly}
                            onChange={(e) => setPricing(prev => ({
                              ...prev,
                              premium: { ...prev.premium, monthly: parseFloat(e.target.value) || 0 }
                            }))}
                            className="w-full mt-1 px-3 py-2 bg-navy-dark/50 border border-gold/20 rounded-lg text-cream focus:outline-none focus:border-gold/50"
                          />
                        ) : (
                          <p className="text-cream text-xl font-medium">${pricing.premium.monthly}</p>
                        )}
                      </div>
                      <div>
                        <label className="text-cream/50 text-sm">Yearly Price ($)</label>
                        {editingPricing ? (
                          <input
                            type="number"
                            step="0.01"
                            value={pricing.premium.yearly}
                            onChange={(e) => setPricing(prev => ({
                              ...prev,
                              premium: { ...prev.premium, yearly: parseFloat(e.target.value) || 0 }
                            }))}
                            className="w-full mt-1 px-3 py-2 bg-navy-dark/50 border border-gold/20 rounded-lg text-cream focus:outline-none focus:border-gold/50"
                          />
                        ) : (
                          <p className="text-cream text-xl font-medium">${pricing.premium.yearly}</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 p-3 bg-navy-dark/30 rounded-lg border border-gold/10">
                  <p className="text-cream/50 text-sm">
                    💡 Note: Price changes will apply to new subscriptions. Existing subscriptions keep their current rates until renewal.
                  </p>
                </div>
              </div>

              {/* Blacklist Management */}
              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
                    <Ban className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif text-cream">Forbidden Topics Blacklist</h3>
                    <p className="text-cream/50 text-sm">Topics and questions AI will refuse to answer</p>
                  </div>
                </div>

                {/* Add new topic */}
                <div className="mb-6 p-4 bg-navy-dark/30 rounded-xl border border-gold/10">
                  <h4 className="text-cream/70 text-sm mb-3">Add New Topic</h4>
                  <div className="flex flex-col md:flex-row gap-3">
                    <input
                      type="text"
                      value={newTopic}
                      onChange={(e) => setNewTopic(e.target.value)}
                      placeholder="Enter topic or keyword..."
                      className="flex-1 px-4 py-2 bg-navy-dark/50 border border-gold/20 rounded-xl text-cream placeholder-cream/30 focus:outline-none focus:border-gold/50"
                    />
                    <input
                      type="text"
                      value={newTopicDescription}
                      onChange={(e) => setNewTopicDescription(e.target.value)}
                      placeholder="Description (optional)"
                      className="flex-1 px-4 py-2 bg-navy-dark/50 border border-gold/20 rounded-xl text-cream placeholder-cream/30 focus:outline-none focus:border-gold/50"
                    />
                    <motion.button
                      onClick={addBlacklistTopic}
                      disabled={!newTopic.trim()}
                      className="px-6 py-2 bg-gold text-navy rounded-xl font-medium disabled:opacity-50 flex items-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </motion.button>
                  </div>
                </div>

                {/* Blacklist items */}
                {blacklist.length === 0 ? (
                  <div className="text-center py-8">
                    <Ban className="w-12 h-12 text-cream/20 mx-auto mb-3" />
                    <p className="text-cream/50">No blacklisted topics yet</p>
                    <p className="text-cream/30 text-sm mt-1">Add topics that the AI should not discuss</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {blacklist.map(item => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between p-4 rounded-xl border ${
                          item.isActive
                            ? 'bg-red-500/10 border-red-500/30'
                            : 'bg-navy-dark/30 border-gold/10 opacity-60'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-cream font-medium">{item.topic}</span>
                            {!item.isActive && (
                              <span className="px-2 py-0.5 bg-cream/10 text-cream/50 text-xs rounded-full">
                                Disabled
                              </span>
                            )}
                          </div>
                          {item.description && (
                            <p className="text-cream/50 text-sm mt-1">{item.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <motion.button
                            onClick={() => toggleBlacklistTopic(item.id, item.isActive)}
                            className={`p-2 rounded-lg ${
                              item.isActive
                                ? 'text-green-400 hover:bg-green-500/20'
                                : 'text-cream/50 hover:bg-cream/10'
                            }`}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            title={item.isActive ? 'Disable' : 'Enable'}
                          >
                            {item.isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </motion.button>
                          <motion.button
                            onClick={() => deleteBlacklistTopic(item.id)}
                            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </motion.button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-4 p-4 bg-navy-dark/30 rounded-xl border border-gold/10">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-gold/60 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-cream/70 text-sm">
                        The AI will politely decline to discuss topics on the blacklist and redirect the conversation.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Info */}
              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Database className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif text-cream">System Configuration</h3>
                    <p className="text-cream/50 text-sm">Platform limits and settings</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 bg-gradient-to-br from-blue-500/10 to-navy-dark/30 rounded-xl border border-blue-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Image className="w-4 h-4 text-blue-400" />
                      <p className="text-cream/70 text-xs font-medium">Max Photos</p>
                    </div>
                    <p className="text-cream font-semibold text-lg">10</p>
                    <p className="text-cream/40 text-xs mt-1">per user</p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-green-500/10 to-navy-dark/30 rounded-xl border border-green-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <FileImage className="w-4 h-4 text-green-400" />
                      <p className="text-cream/70 text-xs font-medium">Image Formats</p>
                    </div>
                    <p className="text-cream font-semibold text-sm">JPG, PNG, WebP</p>
                    <p className="text-cream/40 text-xs mt-1">supported</p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-orange-500/10 to-navy-dark/30 rounded-xl border border-orange-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <HardDrive className="w-4 h-4 text-orange-400" />
                      <p className="text-cream/70 text-xs font-medium">Max File Size</p>
                    </div>
                    <p className="text-cream font-semibold text-lg">10 MB</p>
                    <p className="text-cream/40 text-xs mt-1">per image</p>
                  </div>

                  <div className="p-4 bg-gradient-to-br from-purple-500/10 to-navy-dark/30 rounded-xl border border-purple-500/20">
                    <div className="flex items-center gap-2 mb-2">
                      <Film className="w-4 h-4 text-purple-400" />
                      <p className="text-cream/70 text-xs font-medium">Avatar Provider</p>
                    </div>
                    <p className="text-cream font-semibold text-sm">
                      {stats?.avatarProvider || 'Not configured'}
                    </p>
                    <p className="text-cream/40 text-xs mt-1">video generation</p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Delete"
        type="danger"
      />

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className={`fixed bottom-4 right-4 z-50 px-6 py-3 rounded-xl shadow-xl flex items-center gap-3 ${
              toast.type === 'success'
                ? 'bg-green-500/90 text-white'
                : 'bg-red-500/90 text-white'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
            <span className="font-medium">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
