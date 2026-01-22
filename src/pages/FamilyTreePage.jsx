import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  X,
  Upload,
  Camera,
  Loader2,
  Sparkles,
  MessageCircle,
  Film,
  Edit2,
  Trash2,
  Heart,
  MapPin,
  Calendar,
  User as UserIcon,
  Mic,
  Image,
  Video
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import api from '../services/api';

// Define relationship types for flexible member addition
const RELATIONSHIP_TYPES = {
  grandchildren: {
    label: 'Grandchildren',
    options: ['Grandson', 'Granddaughter', 'Grandchild'],
    icon: '👼',
    color: 'from-teal-500/20 to-cyan-500/10'
  },
  children: {
    label: 'Children',
    options: ['Son', 'Daughter', 'Child'],
    icon: '👶',
    color: 'from-green-500/20 to-emerald-500/10'
  },
  siblings: {
    label: 'Siblings',
    options: ['Brother', 'Sister', 'Sibling'],
    icon: '👥',
    color: 'from-blue-500/20 to-cyan-500/10'
  },
  parents: {
    label: 'Parents',
    options: ['Father', 'Mother', 'Parent'],
    icon: '👨‍👩',
    color: 'from-purple-500/20 to-pink-500/10'
  },
  auntsUncles: {
    label: 'Aunts & Uncles',
    options: ['Uncle', 'Aunt'],
    icon: '👔',
    color: 'from-orange-500/20 to-yellow-500/10'
  },
  grandparents: {
    label: 'Grandparents',
    options: ['Grandfather', 'Grandmother', 'Grandparent'],
    icon: '👴',
    color: 'from-indigo-500/20 to-violet-500/10'
  },
  greatGrandparents: {
    label: 'Great-Grandparents',
    options: ['Great-Grandfather', 'Great-Grandmother', 'Great-Grandparent'],
    icon: '🎩',
    color: 'from-gray-500/20 to-slate-500/10'
  },
  greatGreatGrandparents: {
    label: 'Great-Great-Grandparents',
    options: ['Great-Great-Grandfather', 'Great-Great-Grandmother', 'Great-Great-Grandparent'],
    icon: '📜',
    color: 'from-amber-800/20 to-stone-600/10'
  },
};

export function FamilyTreePage({ onNavigate }) {
  const { user } = useApp();
  const [loading, setLoading] = useState(true);
  const [persona, setPersona] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedRelationship, setSelectedRelationship] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showChildren, setShowChildren] = useState(true);
  const [showGrandchildren, setShowGrandchildren] = useState(false); // Hidden by default
  const [showGreatGreatGrandparents, setShowGreatGreatGrandparents] = useState(false); // Expand ancestors

  // Chat state
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    relationship: '',
    birthYear: '',
    birthplace: '',
    bio: '',
    imageData: null,
    voiceData: null,
    isDeceased: false,
    deathYear: '',
    // Extended fields
    nickname: '',
    occupation: '',
    education: '',
    hobbies: '',
    phoneNumber: '',
    email: '',
    spouse: '',
    marriageDate: '',
    physicalDescription: '',
    personalityTraits: '',
    favoriteMemories: '',
    importantDates: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [membersResponse, personaResponse] = await Promise.all([
        api.getFamilyMembers(),
        api.getPersona()
      ]);
      setFamilyMembers(membersResponse.members || []);
      setPersona(personaResponse);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadFamilyMembers = async () => {
    try {
      const response = await api.getFamilyMembers();
      setFamilyMembers(response.members || []);
    } catch (err) {
      console.error('Failed to load family members:', err);
    }
  };

  // Get members by category
  const getMembersByCategory = (category) => {
    const categoryDef = RELATIONSHIP_TYPES[category];
    return familyMembers.filter(m => categoryDef.options.includes(m.relationship));
  };

  // Handle adding new member to category
  const handleAddMember = (category) => {
    const categoryDef = RELATIONSHIP_TYPES[category];
    const defaultRelationship = categoryDef.options[0]; // Use first option as default

    setSelectedRelationship(defaultRelationship);
    setFormData({
      name: '',
      relationship: defaultRelationship,
      birthYear: '',
      birthplace: '',
      bio: '',
      imageData: null,
      voiceData: null,
      isDeceased: false,
      deathYear: '',
      nickname: '',
      occupation: '',
      education: '',
      hobbies: '',
      phoneNumber: '',
      email: '',
      spouse: '',
      marriageDate: '',
      physicalDescription: '',
      personalityTraits: '',
      favoriteMemories: '',
      importantDates: ''
    });
    setShowAddModal(true);
  };

  // Handle clicking on an empty slot
  const handleEmptySlotClick = (relationship, label) => {
    setSelectedRelationship(relationship);
    setFormData({
      name: '',
      relationship,
      birthYear: '',
      birthplace: '',
      bio: '',
      imageData: null,
      voiceData: null,
      isDeceased: false,
      deathYear: '',
      nickname: '',
      occupation: '',
      education: '',
      hobbies: '',
      phoneNumber: '',
      email: '',
      spouse: '',
      marriageDate: '',
      physicalDescription: '',
      personalityTraits: '',
      favoriteMemories: '',
      importantDates: ''
    });
    setShowAddModal(true);
  };

  // Handle clicking on filled slot
  const handleMemberClick = (member) => {
    setSelectedMember(member);
    setShowProfileModal(true);
    setShowChat(true); // Open chat directly
    setChatMessages([]); // Reset chat
    setChatInput('');
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageData: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVoiceUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('audio/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, voiceData: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.createFamilyMember(formData);
      await loadFamilyMembers();
      setShowAddModal(false);
      resetForm();
    } catch (err) {
      console.error('Failed to create family member:', err);
      alert(err.message || 'Failed to create family member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.updateFamilyMember(selectedMember.id, formData);
      await loadFamilyMembers();
      setShowProfileModal(false);
      setSelectedMember(null);
      resetForm();
    } catch (err) {
      console.error('Failed to update family member:', err);
      alert(err.message || 'Failed to update family member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this family member?')) return;

    setSubmitting(true);
    try {
      await api.deleteFamilyMember(selectedMember.id);
      await loadFamilyMembers();
      setShowProfileModal(false);
      setSelectedMember(null);
      resetForm();
    } catch (err) {
      console.error('Failed to delete family member:', err);
      alert(err.message || 'Failed to delete family member');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = () => {
    setFormData({
      name: selectedMember.name,
      relationship: selectedMember.relationship,
      birthYear: selectedMember.birthYear || '',
      birthplace: selectedMember.birthplace || '',
      bio: selectedMember.bio || '',
      imageData: selectedMember.imageData,
      voiceData: selectedMember.voiceData,
      isDeceased: selectedMember.isDeceased,
      deathYear: selectedMember.deathYear || '',
      nickname: selectedMember.nickname || '',
      occupation: selectedMember.occupation || '',
      education: selectedMember.education || '',
      hobbies: selectedMember.hobbies || '',
      phoneNumber: selectedMember.phoneNumber || '',
      email: selectedMember.email || '',
      spouse: selectedMember.spouse || '',
      marriageDate: selectedMember.marriageDate || '',
      physicalDescription: selectedMember.physicalDescription || '',
      personalityTraits: selectedMember.personalityTraits || '',
      favoriteMemories: selectedMember.favoriteMemories || '',
      importantDates: selectedMember.importantDates || ''
    });
    setShowProfileModal(false);
    setShowAddModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      relationship: '',
      birthYear: '',
      birthplace: '',
      bio: '',
      imageData: null,
      voiceData: null,
      isDeceased: false,
      deathYear: '',
      nickname: '',
      occupation: '',
      education: '',
      hobbies: '',
      phoneNumber: '',
      email: '',
      spouse: '',
      marriageDate: '',
      physicalDescription: '',
      personalityTraits: '',
      favoriteMemories: '',
      importantDates: ''
    });
    setSelectedRelationship('');
  };

  // Handle chat with family member
  const handleSendMessage = async () => {
    if (!chatInput.trim() || !selectedMember || isChatLoading) return;

    const userMessage = chatInput.trim();
    setChatInput('');

    // Add user message to chat
    setChatMessages(prev => [...prev, {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }]);

    setIsChatLoading(true);

    try {
      const response = await api.chatWithFamilyMember(selectedMember.id, userMessage);

      // Add AI response to chat
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: response.message,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error('Failed to send message:', error);
      setChatMessages(prev => [...prev, {
        role: 'error',
        content: 'Sorry, I had trouble responding. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Render compact category section
  const renderCategory = (categoryKey, compact = false) => {
    const categoryDef = RELATIONSHIP_TYPES[categoryKey];
    const members = getMembersByCategory(categoryKey);

    return (
      <div key={categoryKey} className="flex flex-col items-center">
        {/* Category Header - smaller */}
        <div className="flex items-center gap-1.5 mb-2">
          <span className="text-lg">{categoryDef.icon}</span>
          <h3 className="text-cream/60 text-sm font-medium">{categoryDef.label}</h3>
          <span className="text-cream/30 text-xs">({members.length})</span>
        </div>

        {/* Members Grid - compact */}
        <div className="flex flex-wrap justify-center gap-2">
          {/* Existing Members - smaller cards */}
          {members.map((member) => (
            <motion.div
              key={member.id}
              onClick={() => handleMemberClick(member)}
              className={`relative glass-card p-2 cursor-pointer hover:bg-cream/5 transition-all bg-gradient-to-br ${categoryDef.color}`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex flex-col items-center gap-1.5 w-16">
                {/* Avatar - smaller */}
                <div className="relative">
                  {member.imageData ? (
                    <img
                      src={member.imageData}
                      alt={member.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-gold/40"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold/30 to-gold/10 flex items-center justify-center border-2 border-gold/40">
                      <UserIcon className="w-6 h-6 text-gold/60" />
                    </div>
                  )}

                  {/* Status indicator - smaller */}
                  {member.voiceData && (
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center border border-navy">
                      <Mic className="w-2 h-2 text-white" />
                    </div>
                  )}
                </div>

                {/* Name only - truncated */}
                <div className="text-center w-full">
                  <h4 className="text-cream font-medium text-xs truncate">{member.name}</h4>
                  {member.isDeceased && (
                    <p className="text-cream/30 text-[10px]">†{member.deathYear}</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {/* Add Member Button - smaller */}
          <motion.div
            onClick={() => handleAddMember(categoryKey)}
            className="glass-card p-2 cursor-pointer hover:bg-gold/5 transition-all border border-dashed border-gold/30 hover:border-gold"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex flex-col items-center gap-1 w-16 justify-center">
              <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center border border-dashed border-gold/30">
                <Plus className="w-6 h-6 text-gold/60" />
              </div>
              <p className="text-gold/60 text-[10px] font-medium">Add</p>
            </div>
          </motion.div>
        </div>
      </div>
    );
  };

  // Old render function (keep for modals that still use it)
  const renderFamilySlot = (slotDef) => {
    const member = getMemberByRelationship(slotDef.relationship);

    if (member) {
      // Filled slot - show member
      return (
        <motion.div
          key={slotDef.relationship}
          onClick={() => handleMemberClick(member)}
          className="relative glass-card p-4 cursor-pointer hover:bg-cream/5 transition-all"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex flex-col items-center gap-3">
            {/* Avatar */}
            <div className="relative">
              {member.imageData ? (
                <img
                  src={member.imageData}
                  alt={member.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-gold/30"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center border-2 border-gold/30">
                  <UserIcon className="w-8 h-8 text-gold/50" />
                </div>
              )}

              {/* Status indicators */}
              <div className="absolute -bottom-1 -right-1 flex gap-1">
                {member.voiceData && (
                  <div className="w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                    <Mic className="w-3 h-3 text-white" />
                  </div>
                )}
                {member.imageData && (
                  <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                    <Image className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
            </div>

            {/* Name and relationship */}
            <div className="text-center">
              <h4 className="text-cream font-medium">{member.name}</h4>
              <p className="text-cream/50 text-xs">{slotDef.label}</p>
            </div>
          </div>
        </motion.div>
      );
    } else {
      // Empty slot - show placeholder
      return (
        <motion.div
          key={slotDef.relationship}
          onClick={() => handleEmptySlotClick(slotDef.relationship, slotDef.label)}
          className="relative glass-card p-4 cursor-pointer hover:bg-cream/5 transition-all border-2 border-dashed border-cream/10"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex flex-col items-center gap-3">
            {/* Empty avatar with plus */}
            <div className="w-16 h-16 rounded-full bg-cream/5 flex items-center justify-center border-2 border-dashed border-cream/20">
              <Plus className="w-8 h-8 text-cream/30" />
            </div>

            {/* Label */}
            <div className="text-center">
              <p className="text-cream/40 text-sm">{slotDef.label}</p>
            </div>
          </div>
        </motion.div>
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-dark via-navy to-navy-light pt-16 pb-12 px-4 relative overflow-hidden">
      {/* Ultra-Realistic Tree Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Atmospheric glow behind tree */}
        <div className="absolute inset-0 bg-gradient-radial from-gold/5 via-transparent to-transparent" style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 70%, rgba(212,175,55,0.08) 0%, transparent 70%)' }} />

        <svg className="w-full h-full" viewBox="0 0 1000 1400" preserveAspectRatio="xMidYMax slice">
          <defs>
            {/* Realistic bark texture gradient */}
            <linearGradient id="barkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2d1810" />
              <stop offset="20%" stopColor="#4a2c1a" />
              <stop offset="40%" stopColor="#3d2316" />
              <stop offset="60%" stopColor="#5c3a24" />
              <stop offset="80%" stopColor="#3d2316" />
              <stop offset="100%" stopColor="#2d1810" />
            </linearGradient>

            {/* Trunk center highlight */}
            <linearGradient id="trunkHighlight" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="transparent" />
              <stop offset="30%" stopColor="rgba(212,175,55,0.15)" />
              <stop offset="50%" stopColor="rgba(212,175,55,0.25)" />
              <stop offset="70%" stopColor="rgba(212,175,55,0.15)" />
              <stop offset="100%" stopColor="transparent" />
            </linearGradient>

            {/* Branch gradient - darker to lighter */}
            <linearGradient id="branchGradientL" x1="100%" y1="50%" x2="0%" y2="50%">
              <stop offset="0%" stopColor="#4a2c1a" />
              <stop offset="100%" stopColor="#2d1810" stopOpacity="0.3" />
            </linearGradient>

            <linearGradient id="branchGradientR" x1="0%" y1="50%" x2="100%" y2="50%">
              <stop offset="0%" stopColor="#4a2c1a" />
              <stop offset="100%" stopColor="#2d1810" stopOpacity="0.3" />
            </linearGradient>

            {/* Root gradient */}
            <linearGradient id="rootGradient" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#4a2c1a" />
              <stop offset="100%" stopColor="#1a0f08" stopOpacity="0.2" />
            </linearGradient>

            {/* Golden leaf glow */}
            <radialGradient id="leafGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.6" />
              <stop offset="70%" stopColor="#D4AF37" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
            </radialGradient>

            {/* Filters for realistic effects */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>

            <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#000" floodOpacity="0.3"/>
            </filter>
          </defs>

          {/* Ground fog/mist effect */}
          <motion.ellipse
            cx="500" cy="1350" rx="600" ry="100"
            fill="url(#rootGradient)"
            opacity="0.3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            transition={{ duration: 2 }}
          />

          {/* ===== MAIN TRUNK ===== */}
          {/* Trunk shadow */}
          <motion.path
            d="M 520 1400
               C 525 1300, 530 1200, 525 1100
               C 520 1000, 515 900, 520 800
               C 525 700, 520 600, 515 500
               C 510 450, 505 400, 500 350
               L 500 350
               C 495 400, 490 450, 485 500
               C 480 600, 475 700, 480 800
               C 485 900, 480 1000, 475 1100
               C 470 1200, 475 1300, 480 1400
               Z"
            fill="#1a0f08"
            opacity="0.4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 0.4, scale: 1 }}
            transition={{ duration: 1.5 }}
            style={{ transformOrigin: '500px 900px' }}
          />

          {/* Main trunk body */}
          <motion.path
            d="M 515 1400
               C 520 1300, 525 1200, 520 1100
               C 515 1000, 510 900, 515 800
               C 520 700, 515 600, 510 500
               C 505 450, 502 400, 500 350
               L 500 350
               C 498 400, 495 450, 490 500
               C 485 600, 480 700, 485 800
               C 490 900, 485 1000, 480 1100
               C 475 1200, 480 1300, 485 1400
               Z"
            fill="url(#barkGradient)"
            filter="url(#shadow)"
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ duration: 2, ease: "easeOut" }}
            style={{ transformOrigin: '500px 1400px' }}
          />

          {/* Trunk highlight/depth */}
          <motion.path
            d="M 505 1400
               C 508 1300, 510 1200, 508 1100
               C 505 1000, 503 900, 505 800
               C 508 700, 505 600, 502 500
               C 500 450, 500 400, 500 350
               L 500 350
               C 500 400, 500 450, 498 500
               C 495 600, 492 700, 495 800
               C 498 900, 495 1000, 492 1100
               C 490 1200, 492 1300, 495 1400
               Z"
            fill="url(#trunkHighlight)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 2, delay: 0.5 }}
          />

          {/* Bark texture lines */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <motion.path
              key={`bark-${i}`}
              d={`M ${493 + i * 3} ${1350 - i * 150} Q ${495 + i * 2} ${1300 - i * 150} ${492 + i * 3} ${1250 - i * 150}`}
              stroke="#1a0f08"
              strokeWidth="1"
              fill="none"
              opacity="0.3"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1, delay: 1 + i * 0.1 }}
            />
          ))}

          {/* ===== MAIN BRANCHES ===== */}
          {/* Left main branch */}
          <motion.path
            d="M 490 550
               C 450 520, 400 500, 340 480
               C 300 465, 250 455, 200 450
               C 180 448, 160 450, 140 455"
            stroke="url(#branchGradientL)"
            strokeWidth="18"
            strokeLinecap="round"
            fill="none"
            filter="url(#shadow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, delay: 1.5, ease: "easeOut" }}
          />

          {/* Right main branch */}
          <motion.path
            d="M 510 550
               C 550 520, 600 500, 660 480
               C 700 465, 750 455, 800 450
               C 820 448, 840 450, 860 455"
            stroke="url(#branchGradientR)"
            strokeWidth="18"
            strokeLinecap="round"
            fill="none"
            filter="url(#shadow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, delay: 1.5, ease: "easeOut" }}
          />

          {/* Upper left branch */}
          <motion.path
            d="M 495 450
               C 460 420, 420 400, 370 380
               C 330 365, 280 355, 230 350"
            stroke="url(#branchGradientL)"
            strokeWidth="12"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, delay: 1.8 }}
          />

          {/* Upper right branch */}
          <motion.path
            d="M 505 450
               C 540 420, 580 400, 630 380
               C 670 365, 720 355, 770 350"
            stroke="url(#branchGradientR)"
            strokeWidth="12"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, delay: 1.8 }}
          />

          {/* Secondary branches - left side */}
          <motion.path
            d="M 340 480 C 310 450, 280 430, 240 420"
            stroke="url(#branchGradientL)"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 2.2 }}
          />
          <motion.path
            d="M 370 380 C 340 350, 300 330, 260 320"
            stroke="url(#branchGradientL)"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 2.4 }}
          />

          {/* Secondary branches - right side */}
          <motion.path
            d="M 660 480 C 690 450, 720 430, 760 420"
            stroke="url(#branchGradientR)"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 2.2 }}
          />
          <motion.path
            d="M 630 380 C 660 350, 700 330, 740 320"
            stroke="url(#branchGradientR)"
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 2.4 }}
          />

          {/* Small twigs */}
          {[
            { d: "M 200 450 C 180 440, 160 435, 130 440", delay: 2.6 },
            { d: "M 230 350 C 210 340, 190 335, 160 340", delay: 2.7 },
            { d: "M 240 420 C 220 405, 195 400, 170 405", delay: 2.8 },
            { d: "M 800 450 C 820 440, 840 435, 870 440", delay: 2.6 },
            { d: "M 770 350 C 790 340, 810 335, 840 340", delay: 2.7 },
            { d: "M 760 420 C 780 405, 805 400, 830 405", delay: 2.8 },
          ].map((twig, i) => (
            <motion.path
              key={`twig-${i}`}
              d={twig.d}
              stroke={i < 3 ? "url(#branchGradientL)" : "url(#branchGradientR)"}
              strokeWidth="3"
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, delay: twig.delay }}
            />
          ))}

          {/* ===== ROOTS ===== */}
          {/* Main roots spreading */}
          <motion.path
            d="M 485 1400 C 470 1380, 440 1370, 380 1380 C 320 1390, 250 1395, 180 1400"
            stroke="url(#rootGradient)"
            strokeWidth="14"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, delay: 0.5 }}
          />
          <motion.path
            d="M 515 1400 C 530 1380, 560 1370, 620 1380 C 680 1390, 750 1395, 820 1400"
            stroke="url(#rootGradient)"
            strokeWidth="14"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, delay: 0.5 }}
          />

          {/* Secondary roots */}
          <motion.path
            d="M 480 1395 C 450 1400, 420 1395, 350 1400"
            stroke="url(#rootGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
          />
          <motion.path
            d="M 520 1395 C 550 1400, 580 1395, 650 1400"
            stroke="url(#rootGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
          />

          {/* ===== GOLDEN LEAVES / PARTICLES ===== */}
          {[
            { cx: 150, cy: 445, r: 8, delay: 3 },
            { cx: 180, cy: 400, r: 6, delay: 3.1 },
            { cx: 220, cy: 360, r: 7, delay: 3.2 },
            { cx: 260, cy: 420, r: 5, delay: 3.3 },
            { cx: 280, cy: 330, r: 6, delay: 3.4 },
            { cx: 850, cy: 445, r: 8, delay: 3 },
            { cx: 820, cy: 400, r: 6, delay: 3.1 },
            { cx: 780, cy: 360, r: 7, delay: 3.2 },
            { cx: 740, cy: 420, r: 5, delay: 3.3 },
            { cx: 720, cy: 330, r: 6, delay: 3.4 },
            { cx: 170, cy: 440, r: 4, delay: 3.5 },
            { cx: 830, cy: 440, r: 4, delay: 3.5 },
          ].map((leaf, i) => (
            <motion.circle
              key={`leaf-${i}`}
              cx={leaf.cx}
              cy={leaf.cy}
              r={leaf.r}
              fill="url(#leafGlow)"
              filter="url(#glow)"
              initial={{ opacity: 0, scale: 0 }}
              animate={{
                opacity: [0, 0.8, 0.6],
                scale: [0, 1.2, 1]
              }}
              transition={{
                duration: 1.5,
                delay: leaf.delay,
                repeat: Infinity,
                repeatType: "reverse",
                repeatDelay: 2 + Math.random() * 2
              }}
            />
          ))}

          {/* Floating particles */}
          {[...Array(15)].map((_, i) => (
            <motion.circle
              key={`particle-${i}`}
              cx={200 + Math.random() * 600}
              cy={300 + Math.random() * 200}
              r={1 + Math.random() * 2}
              fill="#D4AF37"
              initial={{ opacity: 0, y: 0 }}
              animate={{
                opacity: [0, 0.6, 0],
                y: [-20, -60]
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                delay: 3 + i * 0.3,
                repeat: Infinity,
                repeatDelay: Math.random() * 3
              }}
            />
          ))}
        </svg>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Compact Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-4"
        >
          <h1 className="text-2xl font-serif text-cream flex items-center justify-center gap-2 mb-3">
            <Users className="w-6 h-6 text-gold" />
            Family Tree
          </h1>

          {/* Expand Options */}
          <div className="flex justify-center gap-3 flex-wrap">
            {/* Expand Descendants */}
            <button
              onClick={() => setShowGrandchildren(!showGrandchildren)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                showGrandchildren
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                  : 'bg-cream/5 text-cream/50 border border-cream/10 hover:border-cream/30'
              }`}
            >
              <span>👼</span>
              {showGrandchildren ? 'Hide Grandchildren' : 'Show Grandchildren'}
            </button>

            {/* Toggle Children */}
            <button
              onClick={() => setShowChildren(!showChildren)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                showChildren
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                  : 'bg-cream/5 text-cream/50 border border-cream/10 hover:border-cream/30'
              }`}
            >
              <span>👶</span>
              {showChildren ? 'Hide Children' : 'Show Children'}
            </button>

            {/* Expand Ancestors */}
            <button
              onClick={() => setShowGreatGreatGrandparents(!showGreatGreatGrandparents)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                showGreatGreatGrandparents
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-cream/5 text-cream/50 border border-cream/10 hover:border-cream/30'
              }`}
            >
              <span>📜</span>
              {showGreatGreatGrandparents ? 'Hide Deep Ancestors' : 'Show Deep Ancestors'}
            </button>
          </div>
        </motion.div>

        {/* Family Tree Structure - Compact Layout */}
        <div className="space-y-3">
          {/* DESCENDANTS SECTION (expandable) */}
          {showGrandchildren && (
            <div className="pb-3 border-b border-teal-500/20">
              {renderCategory('grandchildren')}
            </div>
          )}

          {showChildren && (
            <div className="pb-3 border-b border-green-500/20">
              {renderCategory('children')}
            </div>
          )}

          {/* USER ROW: You + Siblings */}
          <div className="flex flex-wrap justify-center items-start gap-4 py-3">
            {/* Siblings left (desktop) */}
            <div className="hidden md:block">
              {renderCategory('siblings')}
            </div>

            {/* User Card (You) - Center */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center"
            >
              <div className="relative glass-card p-3 bg-gradient-to-br from-gold/15 to-gold/5 border-2 border-gold/40">
                <div className="flex flex-col items-center gap-2">
                  {(() => {
                    const activeAvatar = persona?.avatarImages?.find(img => img.isActive) || persona?.avatarImages?.[0];
                    return activeAvatar?.imageData ? (
                      <img
                        src={activeAvatar.imageData}
                        alt={user?.firstName}
                        className="w-14 h-14 rounded-full object-cover border-2 border-gold"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center border-2 border-gold">
                        <UserIcon className="w-7 h-7 text-navy" />
                      </div>
                    );
                  })()}
                  <div className="text-center">
                    <h2 className="text-base font-medium text-gold">{user?.firstName} {user?.lastName}</h2>
                    <p className="text-cream/50 text-[10px]">You</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Siblings (mobile) */}
            <div className="md:hidden">
              {renderCategory('siblings')}
            </div>
          </div>

          {/* PARENTS ROW */}
          <div className="flex flex-wrap justify-center gap-6 py-2 border-t border-cream/10">
            {renderCategory('parents')}
            {renderCategory('auntsUncles')}
          </div>

          {/* GRANDPARENTS ROW */}
          <div className="py-2 border-t border-cream/10">
            {renderCategory('grandparents')}
          </div>

          {/* GREAT-GRANDPARENTS ROW */}
          <div className="py-2 border-t border-cream/10">
            {renderCategory('greatGrandparents')}
          </div>

          {/* GREAT-GREAT-GRANDPARENTS (expandable ancestors) */}
          {showGreatGreatGrandparents && (
            <div className="py-2 border-t border-amber-500/20">
              {renderCategory('greatGreatGrandparents')}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-serif text-cream">
                  {selectedMember ? 'Edit Family Member' : `Add ${formData.relationship}`}
                </h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 hover:bg-cream/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-cream/50" />
                </button>
              </div>

              <form onSubmit={selectedMember ? handleUpdate : handleSubmit} className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm text-cream/70 mb-2">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-navy-light/50 border border-cream/10 rounded-lg text-cream focus:outline-none focus:border-gold/50"
                    placeholder="Enter name"
                  />
                </div>

                {/* Photo Upload (Optional) */}
                <div>
                  <label className="block text-sm text-cream/70 mb-2">
                    Photo <span className="text-cream/40 text-xs">(Optional)</span>
                  </label>
                  <div className="flex items-center gap-4">
                    {formData.imageData && (
                      <img
                        src={formData.imageData}
                        alt="Preview"
                        className="w-20 h-20 rounded-lg object-cover"
                      />
                    )}
                    <label className="flex-1 px-4 py-3 bg-navy-light/50 border border-cream/10 rounded-lg text-cream/50 cursor-pointer hover:border-gold/30 transition-colors flex items-center justify-center gap-2">
                      <Upload className="w-5 h-5" />
                      <span>{formData.imageData ? 'Change Photo' : 'Upload Photo'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Voice Upload (Optional) */}
                <div>
                  <label className="block text-sm text-cream/70 mb-2">
                    Voice Recording <span className="text-cream/40 text-xs">(Optional)</span>
                  </label>
                  <div className="flex items-center gap-4">
                    {formData.voiceData && (
                      <div className="flex items-center gap-2">
                        <Mic className="w-5 h-5 text-purple-400" />
                        <span className="text-cream/70 text-sm">Audio uploaded</span>
                      </div>
                    )}
                    <label className="flex-1 px-4 py-3 bg-navy-light/50 border border-cream/10 rounded-lg text-cream/50 cursor-pointer hover:border-gold/30 transition-colors flex items-center justify-center gap-2">
                      <Mic className="w-5 h-5" />
                      <span>{formData.voiceData ? 'Change Voice' : 'Upload Voice'}</span>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={handleVoiceUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Birth Year */}
                <div>
                  <label className="block text-sm text-cream/70 mb-2">Birth Year</label>
                  <input
                    type="text"
                    value={formData.birthYear}
                    onChange={(e) => setFormData({ ...formData, birthYear: e.target.value })}
                    className="w-full px-4 py-3 bg-navy-light/50 border border-cream/10 rounded-lg text-cream focus:outline-none focus:border-gold/50"
                    placeholder="e.g., 1950"
                  />
                </div>

                {/* Birthplace */}
                <div>
                  <label className="block text-sm text-cream/70 mb-2">Birthplace</label>
                  <input
                    type="text"
                    value={formData.birthplace}
                    onChange={(e) => setFormData({ ...formData, birthplace: e.target.value })}
                    className="w-full px-4 py-3 bg-navy-light/50 border border-cream/10 rounded-lg text-cream focus:outline-none focus:border-gold/50"
                    placeholder="e.g., Berlin, Germany"
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm text-cream/70 mb-2">Biography / Story</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 bg-navy-light/50 border border-cream/10 rounded-lg text-cream focus:outline-none focus:border-gold/50 resize-none"
                    placeholder="Share their story, memories, important details..."
                  />
                </div>

                {/* Deceased */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="isDeceased"
                    checked={formData.isDeceased}
                    onChange={(e) => setFormData({ ...formData, isDeceased: e.target.checked })}
                    className="w-5 h-5 bg-navy-light border border-cream/20 rounded cursor-pointer"
                  />
                  <label htmlFor="isDeceased" className="text-cream/70 cursor-pointer">
                    This person is deceased
                  </label>
                </div>

                {/* Death Year (if deceased) */}
                {formData.isDeceased && (
                  <div>
                    <label className="block text-sm text-cream/70 mb-2">Death Year</label>
                    <input
                      type="text"
                      value={formData.deathYear}
                      onChange={(e) => setFormData({ ...formData, deathYear: e.target.value })}
                      className="w-full px-4 py-3 bg-navy-light/50 border border-cream/10 rounded-lg text-cream focus:outline-none focus:border-gold/50"
                      placeholder="e.g., 2020"
                    />
                  </div>
                )}

                {/* Divider */}
                <div className="border-t border-cream/10 my-4"></div>
                <h4 className="text-cream font-medium mb-3">Additional Information (Optional)</h4>

                {/* Nickname */}
                <div>
                  <label className="block text-sm text-cream/70 mb-2">Nickname</label>
                  <input
                    type="text"
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    className="w-full px-4 py-3 bg-navy-light/50 border border-cream/10 rounded-lg text-cream focus:outline-none focus:border-gold/50"
                    placeholder="e.g., Grandpa Joe"
                  />
                </div>

                {/* Occupation */}
                <div>
                  <label className="block text-sm text-cream/70 mb-2">Occupation / Career</label>
                  <input
                    type="text"
                    value={formData.occupation}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    className="w-full px-4 py-3 bg-navy-light/50 border border-cream/10 rounded-lg text-cream focus:outline-none focus:border-gold/50"
                    placeholder="e.g., Teacher, Engineer, Artist"
                  />
                </div>

                {/* Education */}
                <div>
                  <label className="block text-sm text-cream/70 mb-2">Education</label>
                  <input
                    type="text"
                    value={formData.education}
                    onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                    className="w-full px-4 py-3 bg-navy-light/50 border border-cream/10 rounded-lg text-cream focus:outline-none focus:border-gold/50"
                    placeholder="e.g., PhD in Physics, High School Diploma"
                  />
                </div>

                {/* Hobbies */}
                <div>
                  <label className="block text-sm text-cream/70 mb-2">Hobbies & Interests</label>
                  <textarea
                    value={formData.hobbies}
                    onChange={(e) => setFormData({ ...formData, hobbies: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-3 bg-navy-light/50 border border-cream/10 rounded-lg text-cream focus:outline-none focus:border-gold/50 resize-none"
                    placeholder="e.g., Gardening, reading, cooking, traveling"
                  />
                </div>

                {/* Contact Section */}
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Phone Number */}
                  <div>
                    <label className="block text-sm text-cream/70 mb-2">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                      className="w-full px-4 py-3 bg-navy-light/50 border border-cream/10 rounded-lg text-cream focus:outline-none focus:border-gold/50"
                      placeholder="+49 123 456 7890"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm text-cream/70 mb-2">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-4 py-3 bg-navy-light/50 border border-cream/10 rounded-lg text-cream focus:outline-none focus:border-gold/50"
                      placeholder="email@example.com"
                    />
                  </div>
                </div>

                {/* Family Section */}
                <div className="grid sm:grid-cols-2 gap-4">
                  {/* Spouse */}
                  <div>
                    <label className="block text-sm text-cream/70 mb-2">Spouse</label>
                    <input
                      type="text"
                      value={formData.spouse}
                      onChange={(e) => setFormData({ ...formData, spouse: e.target.value })}
                      className="w-full px-4 py-3 bg-navy-light/50 border border-cream/10 rounded-lg text-cream focus:outline-none focus:border-gold/50"
                      placeholder="Spouse's name"
                    />
                  </div>

                  {/* Marriage Date */}
                  <div>
                    <label className="block text-sm text-cream/70 mb-2">Marriage Date</label>
                    <input
                      type="text"
                      value={formData.marriageDate}
                      onChange={(e) => setFormData({ ...formData, marriageDate: e.target.value })}
                      className="w-full px-4 py-3 bg-navy-light/50 border border-cream/10 rounded-lg text-cream focus:outline-none focus:border-gold/50"
                      placeholder="e.g., June 1975"
                    />
                  </div>
                </div>

                {/* Physical Description */}
                <div>
                  <label className="block text-sm text-cream/70 mb-2">Physical Description</label>
                  <textarea
                    value={formData.physicalDescription}
                    onChange={(e) => setFormData({ ...formData, physicalDescription: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-3 bg-navy-light/50 border border-cream/10 rounded-lg text-cream focus:outline-none focus:border-gold/50 resize-none"
                    placeholder="e.g., Tall with blue eyes, always wearing a smile"
                  />
                </div>

                {/* Personality Traits */}
                <div>
                  <label className="block text-sm text-cream/70 mb-2">Personality Traits</label>
                  <textarea
                    value={formData.personalityTraits}
                    onChange={(e) => setFormData({ ...formData, personalityTraits: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-3 bg-navy-light/50 border border-cream/10 rounded-lg text-cream focus:outline-none focus:border-gold/50 resize-none"
                    placeholder="e.g., Kind, patient, funny, wise"
                  />
                </div>

                {/* Favorite Memories */}
                <div>
                  <label className="block text-sm text-cream/70 mb-2">Favorite Memories</label>
                  <textarea
                    value={formData.favoriteMemories}
                    onChange={(e) => setFormData({ ...formData, favoriteMemories: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 bg-navy-light/50 border border-cream/10 rounded-lg text-cream focus:outline-none focus:border-gold/50 resize-none"
                    placeholder="Share cherished moments and special memories..."
                  />
                </div>

                {/* Important Dates */}
                <div>
                  <label className="block text-sm text-cream/70 mb-2">Important Dates</label>
                  <textarea
                    value={formData.importantDates}
                    onChange={(e) => setFormData({ ...formData, importantDates: e.target.value })}
                    rows={2}
                    className="w-full px-4 py-3 bg-navy-light/50 border border-cream/10 rounded-lg text-cream focus:outline-none focus:border-gold/50 resize-none"
                    placeholder="e.g., Anniversary: May 15, Retirement: 2010"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-6 py-3 bg-cream/5 text-cream/70 rounded-lg hover:bg-cream/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-gold to-gold-light text-navy rounded-lg font-medium hover:from-gold-light hover:to-gold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving...
                      </>
                    ) : selectedMember ? (
                      'Update'
                    ) : (
                      'Add to Tree'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfileModal && selectedMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowProfileModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="glass-card p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with photo */}
              <div className="flex items-start gap-6 mb-6 pb-6 border-b border-cream/10">
                {selectedMember.imageData ? (
                  <img
                    src={selectedMember.imageData}
                    alt={selectedMember.name}
                    className="w-24 h-24 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center">
                    <UserIcon className="w-12 h-12 text-gold/50" />
                  </div>
                )}

                <div className="flex-1">
                  <h2 className="text-2xl font-serif text-cream mb-1">{selectedMember.name}</h2>
                  <p className="text-cream/50 mb-3">{selectedMember.relationship}</p>

                  {/* Toggle between Chat and Profile */}
                  <div className="flex gap-2 mb-3">
                    <button
                      onClick={() => setShowChat(true)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                        showChat
                          ? 'bg-gold/20 text-gold border border-gold/30'
                          : 'bg-cream/5 text-cream/50 border border-cream/10 hover:bg-cream/10'
                      }`}
                    >
                      <MessageCircle className="w-4 h-4" />
                      Chat
                    </button>
                    <button
                      onClick={() => setShowChat(false)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                        !showChat
                          ? 'bg-gold/20 text-gold border border-gold/30'
                          : 'bg-cream/5 text-cream/50 border border-cream/10 hover:bg-cream/10'
                      }`}
                    >
                      <UserIcon className="w-4 h-4" />
                      Profile
                    </button>
                  </div>

                  {/* Media indicators */}
                  <div className="flex gap-2">
                    {selectedMember.imageData && (
                      <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs rounded-full flex items-center gap-1">
                        <Image className="w-3 h-3" />
                        Photo
                      </span>
                    )}
                    {selectedMember.voiceData && (
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs rounded-full flex items-center gap-1">
                        <Mic className="w-3 h-3" />
                        Voice
                      </span>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    setShowChat(false);
                    setChatMessages([]);
                  }}
                  className="p-2 hover:bg-cream/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-cream/50" />
                </button>
              </div>

              {/* Chat Interface */}
              {showChat ? (
                <div className="flex flex-col h-[500px]">
                  {/* Chat messages */}
                  <div className="flex-1 overflow-y-auto space-y-3 mb-4 p-4 bg-navy-dark/30 rounded-lg">
                    {chatMessages.length === 0 ? (
                      <div className="text-center text-cream/40 py-8">
                        <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">Start a conversation with {selectedMember.name}</p>
                        <p className="text-xs mt-1">Ask about their life, memories, or seek their wisdom</p>
                      </div>
                    ) : (
                      chatMessages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] px-4 py-2 rounded-lg ${
                              msg.role === 'user'
                                ? 'bg-gold/20 text-cream'
                                : msg.role === 'error'
                                ? 'bg-red-500/20 text-red-300'
                                : 'bg-cream/10 text-cream'
                            }`}
                          >
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                          </div>
                        </div>
                      ))
                    )}
                    {isChatLoading && (
                      <div className="flex justify-start">
                        <div className="bg-cream/10 px-4 py-2 rounded-lg">
                          <Loader2 className="w-4 h-4 text-cream/50 animate-spin" />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chat input */}
                  <div className="flex gap-2 mb-4">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder={`Message ${selectedMember.name}...`}
                      disabled={isChatLoading}
                      className="flex-1 px-4 py-3 bg-navy-light/50 border border-cream/10 rounded-lg text-cream placeholder-cream/30 focus:outline-none focus:border-gold/50 disabled:opacity-50"
                    />
                    <button
                      onClick={handleSendMessage}
                      disabled={!chatInput.trim() || isChatLoading}
                      className="px-6 py-3 bg-gradient-to-r from-gold to-gold-light text-navy rounded-lg font-medium hover:from-gold-light hover:to-gold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Send
                    </button>
                  </div>

                  {/* Advanced Options */}
                  <div className="border-t border-cream/10 pt-4">
                    <p className="text-cream/50 text-xs mb-3">Advanced Interactions</p>
                    <div className="grid grid-cols-2 gap-2">
                      <motion.button
                        onClick={() => {
                          setShowProfileModal(false);
                          setTimeout(() => onNavigate('echo-sim'), 0);
                        }}
                        disabled={!selectedMember.imageData || !selectedMember.voiceData}
                        className={`px-3 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                          selectedMember.imageData && selectedMember.voiceData
                            ? 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-300 border border-purple-500/30 hover:from-purple-600/30 hover:to-pink-600/30'
                            : 'bg-cream/5 text-cream/30 border border-cream/10 cursor-not-allowed'
                        }`}
                        whileHover={selectedMember.imageData && selectedMember.voiceData ? { scale: 1.02 } : {}}
                        whileTap={selectedMember.imageData && selectedMember.voiceData ? { scale: 0.98 } : {}}
                      >
                        <Video className="w-4 h-4" />
                        <span className="hidden sm:inline">Live Conversation</span>
                        <span className="sm:hidden">Live</span>
                      </motion.button>

                      <motion.button
                        onClick={() => {
                          setShowProfileModal(false);
                          setTimeout(() => onNavigate('echo-sim'), 0);
                        }}
                        disabled={!selectedMember.imageData || !selectedMember.voiceData}
                        className={`px-3 py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                          selectedMember.imageData && selectedMember.voiceData
                            ? 'bg-gradient-to-r from-blue-600/20 to-cyan-600/20 text-blue-300 border border-blue-500/30 hover:from-blue-600/30 hover:to-cyan-600/30'
                            : 'bg-cream/5 text-cream/30 border border-cream/10 cursor-not-allowed'
                        }`}
                        whileHover={selectedMember.imageData && selectedMember.voiceData ? { scale: 1.02 } : {}}
                        whileTap={selectedMember.imageData && selectedMember.voiceData ? { scale: 0.98 } : {}}
                      >
                        <Film className="w-4 h-4" />
                        <span className="hidden sm:inline">Generate Video</span>
                        <span className="sm:hidden">Video</span>
                      </motion.button>
                    </div>
                    {(!selectedMember.imageData || !selectedMember.voiceData) && (
                      <p className="text-cream/30 text-xs mt-2 text-center">
                        Add photo & voice to unlock advanced features
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* Profile Details */}
                  <div className="space-y-4 mb-6">
                    {selectedMember.birthYear && (
                      <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-gold/50" />
                        <div>
                          <p className="text-cream/50 text-xs">Born</p>
                          <p className="text-cream">{selectedMember.birthYear}</p>
                        </div>
                      </div>
                    )}

                    {selectedMember.birthplace && (
                      <div className="flex items-center gap-3">
                        <MapPin className="w-5 h-5 text-gold/50" />
                        <div>
                          <p className="text-cream/50 text-xs">Birthplace</p>
                          <p className="text-cream">{selectedMember.birthplace}</p>
                        </div>
                      </div>
                    )}

                    {selectedMember.isDeceased && selectedMember.deathYear && (
                      <div className="flex items-center gap-3">
                        <Heart className="w-5 h-5 text-red-400/50" />
                        <div>
                          <p className="text-cream/50 text-xs">Passed Away</p>
                          <p className="text-cream">{selectedMember.deathYear}</p>
                        </div>
                      </div>
                    )}

                    {selectedMember.bio && (
                      <div className="pt-4 border-t border-cream/10">
                        <p className="text-cream/50 text-xs mb-2">Biography</p>
                        <p className="text-cream/80 leading-relaxed">{selectedMember.bio}</p>
                      </div>
                    )}
                  </div>

                  {/* Action buttons */}
                  <div className="grid grid-cols-2 gap-3">
                    <motion.button
                      onClick={startEdit}
                      className="px-4 py-3 rounded-xl bg-cream/10 text-cream text-sm font-medium flex items-center justify-center gap-2 hover:bg-cream/20"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Edit2 className="w-4 h-4" />
                      Edit
                    </motion.button>

                    <motion.button
                      onClick={handleDelete}
                      disabled={submitting}
                      className="px-4 py-3 rounded-xl bg-red-500/10 text-red-400 text-sm font-medium flex items-center justify-center gap-2 hover:bg-red-500/20 disabled:opacity-50"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="w-4 h-4" />
                          Delete
                        </>
                      )}
                    </motion.button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
