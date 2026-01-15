import { useState, useEffect } from 'react';
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
  Heart
} from 'lucide-react';
import { PageTransition, FadeIn, StaggerContainer, StaggerItem } from '../components/PageTransition';
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
      { id: 'gemini', name: 'Google Gemini', docsUrl: 'https://aistudio.google.com/', tier: 'free', description: '60 req/min free tier' },
      { id: 'ollama', name: 'Ollama (Local)', docsUrl: 'https://ollama.com/', tier: 'free', description: 'Runs locally, no API key' },
    ]
  },
  voice: {
    name: 'Voice (TTS)',
    description: 'Text-to-speech and voice cloning',
    icon: Mic,
    color: 'from-emerald-500 to-teal-500',
    providers: [
      { id: 'elevenlabs', name: 'ElevenLabs', docsUrl: 'https://elevenlabs.io/', tier: 'premium', description: 'Best voice cloning' },
      { id: 'edge-tts', name: 'Edge TTS (Free)', docsUrl: 'https://github.com/rany2/edge-tts', tier: 'free', description: 'Microsoft voices, unlimited' },
      { id: 'openai-tts', name: 'OpenAI TTS', docsUrl: 'https://platform.openai.com/', tier: 'budget', description: '$0.015/1K chars' },
      { id: 'google-tts', name: 'Google Cloud TTS', docsUrl: 'https://cloud.google.com/text-to-speech', tier: 'free', description: '4M chars/month free' },
    ]
  },
  avatar: {
    name: 'Avatar (Video)',
    description: 'Talking avatar and lip-sync',
    icon: Video,
    color: 'from-orange-500 to-red-500',
    providers: [
      { id: 'heygen', name: 'HeyGen', docsUrl: 'https://heygen.com/', tier: 'premium', description: 'Professional avatars' },
      { id: 'd-id', name: 'D-ID (Free Trial)', docsUrl: 'https://www.d-id.com/', tier: 'free', description: '5 min free' },
      { id: 'sadtalker', name: 'SadTalker (Local)', docsUrl: 'https://github.com/OpenTalker/SadTalker', tier: 'free', description: 'Open source, runs locally' },
      { id: 'none', name: 'Audio Only', docsUrl: '', tier: 'free', description: 'No video, voice only' },
    ]
  }
};

// Legacy format for backward compatibility
const aiServices = [
  { id: 'llm', name: 'AI Brain', icon: Cpu, color: 'from-purple-500 to-indigo-500', category: 'llm' },
  { id: 'voice', name: 'Voice', icon: Mic, color: 'from-emerald-500 to-teal-500', category: 'voice' },
  { id: 'avatar', name: 'Avatar', icon: Video, color: 'from-orange-500 to-red-500', category: 'avatar' },
];

export function AdminDashboard({ onNavigate }) {
  const { user } = useApp();
  const [activeTab, setActiveTab] = useState('overview');
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
  const [selectedChat, setSelectedChat] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // User details state
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [expandedStory, setExpandedStory] = useState(null);

  // Check if user is admin
  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      onNavigate('persona');
    }
  }, [user, onNavigate]);

  // Fetch data
  useEffect(() => {
    fetchData();
  }, [activeTab, statsPeriod]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('echotrail_token');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      };

      if (activeTab === 'overview' || activeTab === 'users') {
        const statsRes = await fetch(`${API_URL}/api/admin/stats?period=${statsPeriod}`, { headers });
        if (statsRes.ok) setStats(await statsRes.json());
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
        const chatsRes = await fetch(`${API_URL}/api/support/admin/chats?status=all`, { headers });
        if (chatsRes.ok) {
          setSupportChats(await chatsRes.json());
        }
      }
    } catch (error) {
      console.error('Failed to fetch admin data:', error);
    }
    setLoading(false);
  };

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
      }
    } catch (error) {
      console.error('Failed to load chat:', error);
    }
  };

  // Send message as admin
  const sendAdminMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat || sendingMessage) return;

    setSendingMessage(true);
    try {
      const token = localStorage.getItem('echotrail_token');
      await fetch(`${API_URL}/api/support/admin/chats/${selectedChat.id}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ content: newMessage.trim() })
      });
      setNewMessage('');
      await loadChat(selectedChat.id);
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

  // Load user details
  const loadUserDetails = async (userId) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('echotrail_token');
      const res = await fetch(`${API_URL}/api/admin/users/${userId}/details`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setUserDetails(await res.json());
        setSelectedUser(userId);
      }
    } catch (error) {
      console.error('Failed to load user details:', error);
    }
    setLoading(false);
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

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'support', label: 'Support', icon: MessageCircle, badge: supportChats.filter(c => c.status === 'open').length },
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
                    label: 'Premium Subscriptions',
                    value: stats?.premiumUsers || 0,
                    change: stats?.newPremiumSubscriptions || 0,
                    icon: TrendingUp,
                    color: 'text-gold'
                  },
                  {
                    label: 'Standard Subscriptions',
                    value: stats?.standardUsers || 0,
                    change: stats?.newStandardSubscriptions || 0,
                    icon: Activity,
                    color: 'text-blue-400'
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
                          <Icon className={`w-8 h-8 ${stat.color}`} />
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

              <div className="grid lg:grid-cols-2 gap-6">
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
                        return (
                          <div key={service.id} className="flex items-center justify-between p-3 bg-navy-dark/30 rounded-lg">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${service.color} flex items-center justify-center`}>
                                <Icon className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <p className="text-cream font-medium">{service.name}</p>
                                <p className="text-cream/50 text-xs">{config?.hasKey ? 'API Key configured' : 'Not configured'}</p>
                              </div>
                            </div>
                            <div className={`w-3 h-3 rounded-full ${
                              config?.isActive && config?.hasKey ? 'bg-green-500' : 'bg-red-500'
                            }`} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </FadeIn>
              </div>
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
                  const needsApiKey = !['edge-tts', 'sadtalker', 'none', 'ollama'].includes(selectedProvider);

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
                            <span className={`px-2 py-1 rounded text-xs ${
                              u.role === 'ADMIN' ? 'bg-purple-500/20 text-purple-400' : 'bg-cream/10 text-cream/60'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded text-xs ${
                              u.subscription === 'PREMIUM'
                                ? 'bg-gold/20 text-gold'
                                : u.subscription === 'STANDARD'
                                ? 'bg-blue-500/20 text-blue-400'
                                : 'bg-cream/10 text-cream/60'
                            }`}>
                              {u.subscription}
                            </span>
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

              {/* User Header */}
              <div className="glass-card p-6 mb-6">
                <div className="flex items-start gap-6">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    {userDetails.persona?.avatarImages?.find(img => img.isActive) ? (
                      <img
                        src={userDetails.persona.avatarImages.find(img => img.isActive)?.imageData}
                        alt="Avatar"
                        className="w-20 h-20 rounded-full object-cover border-2 border-gold/30"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gold/20 flex items-center justify-center">
                        <UserIcon className="w-10 h-10 text-gold" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <h2 className="text-2xl font-serif text-cream">{userDetails.firstName} {userDetails.lastName}</h2>
                        <p className="text-cream/50">{userDetails.email}</p>
                        {userDetails.purpose && (
                          <p className="text-cream/40 text-sm mt-1">Purpose: {userDetails.purpose}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          userDetails.subscription === 'PREMIUM'
                            ? 'bg-gold/20 text-gold'
                            : userDetails.subscription === 'STANDARD'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-cream/10 text-cream/60'
                        }`}>
                          {userDetails.subscription}
                        </span>
                        <p className="text-cream/40 text-xs mt-2">Joined {new Date(userDetails.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-5 gap-4 mt-4 pt-4 border-t border-gold/10">
                      <div className="text-center">
                        <p className="text-xl font-serif text-cream">{userDetails.persona?.lifeStories?.length || 0}</p>
                        <p className="text-cream/40 text-xs">Stories</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-serif text-cream">{userDetails.memories?.length || 0}</p>
                        <p className="text-cream/40 text-xs">Memories</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-serif text-cream">{userDetails.timeCapsules?.length || 0}</p>
                        <p className="text-cream/40 text-xs">Capsules</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-serif text-cream">{userDetails.persona?.avatarImages?.length || 0}</p>
                        <p className="text-cream/40 text-xs">Avatars</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xl font-serif text-cream">{userDetails.wisdomChats?.length || 0}</p>
                        <p className="text-cream/40 text-xs">Chats</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Avatar Images */}
              {userDetails.persona?.avatarImages?.length > 0 && (
                <div className="glass-card p-6 mb-6">
                  <h3 className="text-lg font-serif text-cream mb-4 flex items-center gap-2">
                    <Image className="w-5 h-5 text-gold" />
                    Avatar Images ({userDetails.persona.avatarImages.length})
                  </h3>
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {userDetails.persona.avatarImages.map(img => (
                      <div key={img.id} className="flex-shrink-0">
                        <div className={`relative w-24 h-24 rounded-xl overflow-hidden border-2 ${
                          img.isActive ? 'border-gold' : 'border-gold/20'
                        }`}>
                          <img src={img.imageData} alt={img.label} className="w-full h-full object-cover" />
                          {img.isActive && (
                            <div className="absolute top-1 right-1 w-5 h-5 bg-gold rounded-full flex items-center justify-center">
                              <Check className="w-3 h-3 text-navy" />
                            </div>
                          )}
                        </div>
                        <p className="text-cream/50 text-xs text-center mt-1 truncate w-24">{img.label}</p>
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
                  <div className="flex items-center gap-2">
                    <span className="text-cream/50 text-sm">{supportChats.filter(c => c.status === 'open').length} open</span>
                  </div>
                </div>
                {supportChats.length === 0 ? (
                  <div className="p-8 text-center">
                    <MessageCircle className="w-12 h-12 text-gold/30 mx-auto mb-3" />
                    <p className="text-cream/50">No support conversations yet</p>
                  </div>
                ) : (
                  <div className="divide-y divide-gold/5">
                    {supportChats.map(chat => (
                      <div
                        key={chat.id}
                        className="p-4 hover:bg-navy-light/30 cursor-pointer flex items-center gap-4"
                        onClick={() => loadChat(chat.id)}
                      >
                        <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                          <UserIcon className="w-5 h-5 text-gold/60" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-cream font-medium truncate">{chat.userName || 'Unknown User'}</p>
                            <span className={`px-2 py-0.5 text-xs rounded ${
                              chat.status === 'open' ? 'bg-green-500/20 text-green-400' : 'bg-cream/10 text-cream/50'
                            }`}>{chat.status}</span>
                          </div>
                          <p className="text-cream/50 text-sm truncate">{chat.userEmail}</p>
                          {chat.messages?.[0] && (
                            <p className="text-cream/40 text-xs truncate mt-1">{chat.messages[0].content}</p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-cream/40 text-xs">{new Date(chat.updatedAt).toLocaleDateString()}</p>
                          <p className="text-cream/30 text-xs">{new Date(chat.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chatMessages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                        msg.sender === 'admin'
                          ? 'bg-gold text-navy rounded-br-md'
                          : 'bg-navy-dark text-cream rounded-bl-md'
                      }`}>
                        <p className="text-sm">{msg.content}</p>
                        <p className={`text-xs mt-1 ${msg.sender === 'admin' ? 'text-navy/50' : 'text-cream/40'}`}>
                          {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {chatMessages.length === 0 && (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-cream/40">No messages yet</p>
                    </div>
                  )}
                </div>

                {/* Input */}
                {selectedChat.status === 'open' && (
                  <form onSubmit={sendAdminMessage} className="p-4 border-t border-gold/10">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your reply..."
                        className="flex-1 px-4 py-3 bg-navy-dark/50 border border-gold/20 rounded-xl text-cream placeholder-cream/30 focus:outline-none focus:border-gold/50"
                      />
                      <motion.button
                        type="submit"
                        disabled={!newMessage.trim() || sendingMessage}
                        className="px-6 py-3 bg-gold text-navy rounded-xl font-medium disabled:opacity-50 flex items-center gap-2"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Send className="w-4 h-4" />
                        Send
                      </motion.button>
                    </div>
                  </form>
                )}
              </div>
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
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                    <Image className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif text-cream">Avatar Hintergründe</h3>
                    <p className="text-cream/50 text-sm">Verwalte die verfügbaren Hintergrundbilder</p>
                  </div>
                </div>

                {/* Default Backgrounds */}
                <div className="mb-6">
                  <h4 className="text-cream/70 text-sm mb-3">Standard Hintergründe</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { id: 'beach', label: 'Am Strand', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=300&fit=crop' },
                      { id: 'library', label: 'Bibliothek', url: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?w=400&h=300&fit=crop' },
                      { id: 'nature', label: 'In der Natur', url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop' },
                      { id: 'home', label: 'Gemütliches Zuhause', url: 'https://images.unsplash.com/photo-1616046229478-9901c5536a45?w=400&h=300&fit=crop' },
                    ].map(bg => (
                      <div key={bg.id} className="relative group">
                        <div className="aspect-video rounded-xl overflow-hidden border-2 border-gold/20">
                          <img src={bg.url} alt={bg.label} className="w-full h-full object-cover" />
                        </div>
                        <p className="text-cream/70 text-sm mt-2 text-center">{bg.label}</p>
                        <div className="absolute top-2 right-2 px-2 py-0.5 bg-green-500/80 rounded-full">
                          <span className="text-white text-xs">Aktiv</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Info about custom backgrounds */}
                <div className="p-4 bg-navy-dark/30 rounded-xl border border-gold/10">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-gold/60 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-cream/70 text-sm">
                        Die Hintergrundbilder werden über Unsplash bereitgestellt. Benutzer können zusätzlich eigene Bilder hochladen.
                      </p>
                      <p className="text-cream/50 text-xs mt-2">
                        Um eigene Standard-Hintergründe hinzuzufügen, bearbeite die <code className="bg-navy-dark px-1 rounded">backgrounds</code> Array in <code className="bg-navy-dark px-1 rounded">PersonaPage.jsx</code>
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
                    <h3 className="text-lg font-serif text-cream">Avatar Stile</h3>
                    <p className="text-cream/50 text-sm">Verfügbare Rendering-Stile für Avatare</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  {[
                    { id: 'realistic', label: 'Realistic', icon: '🎭', active: true },
                    { id: 'enhanced', label: 'Enhanced', icon: '✨', active: true },
                    { id: 'cartoon', label: 'Cartoon', icon: '🎨', active: true },
                    { id: 'artistic', label: 'Artistic', icon: '🖼️', active: true },
                    { id: 'anime', label: 'Anime', icon: '🌸', active: true },
                    { id: 'pixar', label: '3D Pixar', icon: '🎬', active: true },
                  ].map(style => (
                    <div key={style.id} className="p-4 bg-navy-dark/30 rounded-xl border border-gold/20 text-center">
                      <span className="text-3xl block mb-2">{style.icon}</span>
                      <p className="text-cream font-medium text-sm">{style.label}</p>
                      <span className={`text-xs mt-2 inline-block px-2 py-0.5 rounded-full ${
                        style.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}>
                        {style.active ? 'Aktiv' : 'Inaktiv'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* System Info */}
              <div className="glass-card p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Database className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-serif text-cream">System Info</h3>
                    <p className="text-cream/50 text-sm">Übersicht über Systemeinstellungen</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-navy-dark/30 rounded-xl">
                    <p className="text-cream/60 text-sm mb-1">Max. Fotos pro Benutzer</p>
                    <p className="text-cream font-medium">10 Fotos</p>
                  </div>
                  <div className="p-4 bg-navy-dark/30 rounded-xl">
                    <p className="text-cream/60 text-sm mb-1">Unterstützte Bildformate</p>
                    <p className="text-cream font-medium">JPG, PNG, WebP</p>
                  </div>
                  <div className="p-4 bg-navy-dark/30 rounded-xl">
                    <p className="text-cream/60 text-sm mb-1">Max. Bildgröße</p>
                    <p className="text-cream font-medium">10 MB</p>
                  </div>
                  <div className="p-4 bg-navy-dark/30 rounded-xl">
                    <p className="text-cream/60 text-sm mb-1">Video-Avatar Provider</p>
                    <p className="text-cream font-medium">
                      {stats?.avatarProvider || 'Nicht konfiguriert'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
