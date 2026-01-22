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
      {/* Classic Genealogy Tree Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Vintage parchment/sepia overlay */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 100% 80% at 50% 100%, rgba(139,90,43,0.08) 0%, transparent 70%)',
        }} />

        {/* Soft vignette */}
        <div className="absolute inset-0" style={{
          background: 'radial-gradient(ellipse 80% 60% at 50% 50%, transparent 40%, rgba(0,0,0,0.3) 100%)'
        }} />

        <svg className="w-full h-full" viewBox="0 0 1000 1400" preserveAspectRatio="xMidYMid slice">
          <defs>
            {/* Elegant trunk gradient */}
            <linearGradient id="trunkGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3d2817" />
              <stop offset="30%" stopColor="#5c3d24" />
              <stop offset="50%" stopColor="#6b4a2d" />
              <stop offset="70%" stopColor="#5c3d24" />
              <stop offset="100%" stopColor="#3d2817" />
            </linearGradient>

            {/* Branch gradient - elegant brown */}
            <linearGradient id="branchGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4a3020" />
              <stop offset="50%" stopColor="#6b4a2d" />
              <stop offset="100%" stopColor="#4a3020" />
            </linearGradient>

            {/* Thin branch gradient */}
            <linearGradient id="thinBranchGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#5c3d24" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#3d2817" stopOpacity="0.3" />
            </linearGradient>

            {/* Gold leaf gradient */}
            <radialGradient id="leafGold" cx="50%" cy="30%" r="60%">
              <stop offset="0%" stopColor="#F4D03F" />
              <stop offset="50%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#B8860B" />
            </radialGradient>

            {/* Green leaf gradient */}
            <radialGradient id="leafGreen" cx="50%" cy="30%" r="60%">
              <stop offset="0%" stopColor="#6B8E23" />
              <stop offset="50%" stopColor="#556B2F" />
              <stop offset="100%" stopColor="#2F4F2F" />
            </radialGradient>

            {/* Root gradient */}
            <linearGradient id="rootGradient" x1="50%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#5c3d24" />
              <stop offset="100%" stopColor="#2d1810" stopOpacity="0.2" />
            </linearGradient>

            {/* Soft shadow filter */}
            <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="2" dy="4" stdDeviation="4" floodColor="#1a0f08" floodOpacity="0.4"/>
            </filter>

            {/* Glow filter for leaves */}
            <filter id="leafGlow">
              <feGaussianBlur stdDeviation="2" result="blur"/>
              <feMerge>
                <feMergeNode in="blur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* ===== MAIN TRUNK - Elegant organic shape ===== */}
          <motion.path
            d="M 500 1400
               C 498 1350, 504 1300, 502 1250
               C 500 1200, 498 1150, 500 1100
               C 502 1050, 498 1000, 500 950
               C 502 900, 500 850, 500 800
               C 498 750, 502 700, 500 650
               C 502 600, 498 550, 500 500
               C 500 450, 502 400, 500 350"
            stroke="url(#trunkGradient)"
            strokeWidth="45"
            strokeLinecap="round"
            fill="none"
            filter="url(#softShadow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, ease: "easeOut" }}
          />

          {/* Trunk texture lines */}
          <motion.path
            d="M 485 1350 C 485 1200, 490 1050, 488 900 C 490 750, 485 600, 488 450"
            stroke="rgba(30,15,8,0.3)"
            strokeWidth="2"
            fill="none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.5 }}
          />
          <motion.path
            d="M 515 1350 C 515 1200, 510 1050, 512 900 C 510 750, 515 600, 512 450"
            stroke="rgba(30,15,8,0.3)"
            strokeWidth="2"
            fill="none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.5 }}
          />

          {/* ===== CROWN BRANCHES - Spread outward at top ===== */}
          {/* Left main crown branch */}
          <motion.path
            d="M 500 400 C 450 380, 380 350, 280 300 C 200 260, 120 230, 50 200"
            stroke="url(#branchGradient)"
            strokeWidth="20"
            strokeLinecap="round"
            fill="none"
            filter="url(#softShadow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, delay: 1.8 }}
          />

          {/* Right main crown branch */}
          <motion.path
            d="M 500 400 C 550 380, 620 350, 720 300 C 800 260, 880 230, 950 200"
            stroke="url(#branchGradient)"
            strokeWidth="20"
            strokeLinecap="round"
            fill="none"
            filter="url(#softShadow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, delay: 1.8 }}
          />

          {/* Secondary branches - left side */}
          <motion.path
            d="M 350 340 C 300 290, 220 250, 150 220"
            stroke="url(#branchGradient)"
            strokeWidth="12"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 2.2 }}
          />
          <motion.path
            d="M 280 300 C 250 250, 200 200, 130 150"
            stroke="url(#branchGradient)"
            strokeWidth="10"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 2.4 }}
          />

          {/* Secondary branches - right side */}
          <motion.path
            d="M 650 340 C 700 290, 780 250, 850 220"
            stroke="url(#branchGradient)"
            strokeWidth="12"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 2.2 }}
          />
          <motion.path
            d="M 720 300 C 750 250, 800 200, 870 150"
            stroke="url(#branchGradient)"
            strokeWidth="10"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 2.4 }}
          />

          {/* Top center branches */}
          <motion.path
            d="M 500 380 C 480 320, 450 260, 400 180"
            stroke="url(#branchGradient)"
            strokeWidth="14"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, delay: 2 }}
          />
          <motion.path
            d="M 500 380 C 520 320, 550 260, 600 180"
            stroke="url(#branchGradient)"
            strokeWidth="14"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, delay: 2 }}
          />

          {/* Small twigs */}
          {[
            { d: "M 150 220 C 120 190, 80 160, 40 140", delay: 2.6 },
            { d: "M 130 150 C 100 120, 60 100, 30 80", delay: 2.7 },
            { d: "M 850 220 C 880 190, 920 160, 960 140", delay: 2.6 },
            { d: "M 870 150 C 900 120, 940 100, 970 80", delay: 2.7 },
            { d: "M 400 180 C 370 140, 340 100, 300 60", delay: 2.8 },
            { d: "M 600 180 C 630 140, 660 100, 700 60", delay: 2.8 },
            { d: "M 50 200 C 30 170, 20 130, 30 90", delay: 2.9 },
            { d: "M 950 200 C 970 170, 980 130, 970 90", delay: 2.9 },
          ].map((twig, i) => (
            <motion.path
              key={`twig-${i}`}
              d={twig.d}
              stroke="url(#thinBranchGradient)"
              strokeWidth="6"
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.8, delay: twig.delay }}
            />
          ))}

          {/* ===== ROOTS ===== */}
          <motion.path
            d="M 500 1400 C 450 1400, 380 1380, 300 1350 C 220 1320, 140 1300, 50 1300"
            stroke="url(#rootGradient)"
            strokeWidth="18"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, delay: 0.5 }}
          />
          <motion.path
            d="M 500 1400 C 550 1400, 620 1380, 700 1350 C 780 1320, 860 1300, 950 1300"
            stroke="url(#rootGradient)"
            strokeWidth="18"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, delay: 0.5 }}
          />

          {/* Smaller root tendrils */}
          <motion.path
            d="M 380 1360 C 320 1350, 250 1360, 180 1380"
            stroke="url(#rootGradient)"
            strokeWidth="10"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          />
          <motion.path
            d="M 620 1360 C 680 1350, 750 1360, 820 1380"
            stroke="url(#rootGradient)"
            strokeWidth="10"
            strokeLinecap="round"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          />

          {/* ===== LEAVES - Scattered throughout crown ===== */}
          {[
            // Gold leaves
            { cx: 50, cy: 180, rx: 12, ry: 8, rotate: -30, color: "url(#leafGold)", delay: 3 },
            { cx: 130, cy: 140, rx: 10, ry: 6, rotate: 20, color: "url(#leafGold)", delay: 3.1 },
            { cx: 80, cy: 100, rx: 11, ry: 7, rotate: -10, color: "url(#leafGold)", delay: 3.2 },
            { cx: 950, cy: 180, rx: 12, ry: 8, rotate: 30, color: "url(#leafGold)", delay: 3 },
            { cx: 870, cy: 140, rx: 10, ry: 6, rotate: -20, color: "url(#leafGold)", delay: 3.1 },
            { cx: 920, cy: 100, rx: 11, ry: 7, rotate: 10, color: "url(#leafGold)", delay: 3.2 },
            { cx: 400, cy: 160, rx: 11, ry: 7, rotate: -25, color: "url(#leafGold)", delay: 3.3 },
            { cx: 600, cy: 160, rx: 11, ry: 7, rotate: 25, color: "url(#leafGold)", delay: 3.3 },
            { cx: 300, cy: 80, rx: 9, ry: 5, rotate: -15, color: "url(#leafGold)", delay: 3.4 },
            { cx: 700, cy: 80, rx: 9, ry: 5, rotate: 15, color: "url(#leafGold)", delay: 3.4 },
            { cx: 500, cy: 100, rx: 13, ry: 8, rotate: 0, color: "url(#leafGold)", delay: 3.5 },
            // Green leaves
            { cx: 170, cy: 200, rx: 10, ry: 6, rotate: 35, color: "url(#leafGreen)", delay: 3.2 },
            { cx: 250, cy: 250, rx: 9, ry: 5, rotate: -40, color: "url(#leafGreen)", delay: 3.3 },
            { cx: 830, cy: 200, rx: 10, ry: 6, rotate: -35, color: "url(#leafGreen)", delay: 3.2 },
            { cx: 750, cy: 250, rx: 9, ry: 5, rotate: 40, color: "url(#leafGreen)", delay: 3.3 },
            { cx: 350, cy: 200, rx: 8, ry: 5, rotate: 20, color: "url(#leafGreen)", delay: 3.4 },
            { cx: 650, cy: 200, rx: 8, ry: 5, rotate: -20, color: "url(#leafGreen)", delay: 3.4 },
          ].map((leaf, i) => (
            <motion.ellipse
              key={`leaf-${i}`}
              cx={leaf.cx}
              cy={leaf.cy}
              rx={leaf.rx}
              ry={leaf.ry}
              fill={leaf.color}
              transform={`rotate(${leaf.rotate} ${leaf.cx} ${leaf.cy})`}
              filter="url(#leafGlow)"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 0.9, 0.8], scale: [0, 1.1, 1] }}
              transition={{ duration: 0.8, delay: leaf.delay }}
            />
          ))}

          {/* ===== FLOATING LEAF PARTICLES ===== */}
          {[...Array(8)].map((_, i) => (
            <motion.ellipse
              key={`float-leaf-${i}`}
              cx={100 + i * 110}
              cy={250 + (i % 3) * 50}
              rx={4}
              ry={2.5}
              fill="#D4AF37"
              initial={{ opacity: 0, y: 0, rotate: 0 }}
              animate={{
                opacity: [0, 0.6, 0],
                y: [0, 100, 200],
                rotate: [0, 180, 360]
              }}
              transition={{
                duration: 6,
                delay: 3.5 + i * 0.5,
                repeat: Infinity,
                repeatDelay: 4
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
