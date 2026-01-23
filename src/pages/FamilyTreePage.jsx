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

// Define placeholder slots for specific categories
const PLACEHOLDER_SLOTS = {
  parents: [
    { relationship: 'Mother', label: 'Mom', icon: '👩' },
    { relationship: 'Father', label: 'Dad', icon: '👨' },
  ],
  grandparents: [
    { relationship: 'Grandmother', label: 'Grandma (Mom)', icon: '👵', side: 'maternal' },
    { relationship: 'Grandfather', label: 'Grandpa (Mom)', icon: '👴', side: 'maternal' },
    { relationship: 'Grandmother', label: 'Grandma (Dad)', icon: '👵', side: 'paternal' },
    { relationship: 'Grandfather', label: 'Grandpa (Dad)', icon: '👴', side: 'paternal' },
  ],
  greatGrandparents: [
    // Mom's side - 4 great-grandparents (Grandma's parents + Grandpa's parents)
    { relationship: 'Great-Grandmother', label: "Mom's Grandma (her mom)", icon: '👵', side: 'maternal', branch: 'gm' },
    { relationship: 'Great-Grandfather', label: "Mom's Grandpa (her mom)", icon: '👴', side: 'maternal', branch: 'gm' },
    { relationship: 'Great-Grandmother', label: "Mom's Grandma (her dad)", icon: '👵', side: 'maternal', branch: 'gp' },
    { relationship: 'Great-Grandfather', label: "Mom's Grandpa (her dad)", icon: '👴', side: 'maternal', branch: 'gp' },
    // Dad's side - 4 great-grandparents (Grandma's parents + Grandpa's parents)
    { relationship: 'Great-Grandmother', label: "Dad's Grandma (his mom)", icon: '👵', side: 'paternal', branch: 'gm' },
    { relationship: 'Great-Grandfather', label: "Dad's Grandpa (his mom)", icon: '👴', side: 'paternal', branch: 'gm' },
    { relationship: 'Great-Grandmother', label: "Dad's Grandma (his dad)", icon: '👵', side: 'paternal', branch: 'gp' },
    { relationship: 'Great-Grandfather', label: "Dad's Grandpa (his dad)", icon: '👴', side: 'paternal', branch: 'gp' },
  ],
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
  const [showChildren, setShowChildren] = useState(false); // Hidden by default
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

  // Check if member exists by relationship (and optionally side for grandparents)
  const getMemberByRelationshipAndSide = (relationship, side = null) => {
    return familyMembers.find(m => {
      if (m.relationship !== relationship) return false;
      // For grandparents, we'd need to track which side they're on
      // For now, just match by relationship
      return true;
    });
  };

  // Render placeholder slot
  const renderPlaceholderSlot = (slot, categoryDef, index) => {
    // Check if this slot is filled
    const existingMembers = familyMembers.filter(m => m.relationship === slot.relationship);
    const member = existingMembers[slot.side === 'paternal' ? 1 : 0] || (slot.side ? null : existingMembers[0]);

    if (member) {
      // Filled slot - show member
      return (
        <motion.div
          key={`${slot.relationship}-${slot.side || index}`}
          onClick={() => handleMemberClick(member)}
          className={`relative glass-card p-2 cursor-pointer hover:bg-cream/5 transition-all bg-gradient-to-br ${categoryDef.color}`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <div className="flex flex-col items-center gap-1.5 w-16">
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
              {member.voiceData && (
                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-purple-500 flex items-center justify-center border border-navy">
                  <Mic className="w-2 h-2 text-white" />
                </div>
              )}
            </div>
            <div className="text-center w-full">
              <h4 className="text-cream font-medium text-xs truncate">{member.name}</h4>
              <p className="text-cream/40 text-[10px]">{slot.label}</p>
            </div>
          </div>
        </motion.div>
      );
    }

    // Empty slot - show placeholder
    return (
      <motion.div
        key={`${slot.relationship}-${slot.side || index}`}
        onClick={() => handleEmptySlotClick(slot.relationship, slot.label)}
        className="glass-card p-2 cursor-pointer hover:bg-gold/5 transition-all border border-dashed border-gold/30 hover:border-gold"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex flex-col items-center gap-1 w-16 justify-center">
          <div className="w-12 h-12 rounded-full bg-gold/10 flex items-center justify-center border border-dashed border-gold/30 text-2xl">
            {slot.icon}
          </div>
          <p className="text-gold/60 text-[10px] font-medium text-center">{slot.label}</p>
        </div>
      </motion.div>
    );
  };

  // Render compact category section
  const renderCategory = (categoryKey, compact = false) => {
    const categoryDef = RELATIONSHIP_TYPES[categoryKey];
    const members = getMembersByCategory(categoryKey);
    const placeholders = PLACEHOLDER_SLOTS[categoryKey];

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
          {/* If this category has placeholders, render them */}
          {placeholders ? (
            <>
              {placeholders.map((slot, index) => renderPlaceholderSlot(slot, categoryDef, index))}
              {/* Also show any additional members that don't fit the placeholders */}
              {members.filter(m => {
                const placeholderCount = placeholders.filter(p => p.relationship === m.relationship).length;
                const memberIndex = members.filter(mem => mem.relationship === m.relationship).indexOf(m);
                return memberIndex >= placeholderCount;
              }).map((member) => (
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
                    <div className="relative">
                      {member.imageData ? (
                        <img src={member.imageData} alt={member.name} className="w-12 h-12 rounded-full object-cover border-2 border-gold/40" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold/30 to-gold/10 flex items-center justify-center border-2 border-gold/40">
                          <UserIcon className="w-6 h-6 text-gold/60" />
                        </div>
                      )}
                    </div>
                    <div className="text-center w-full">
                      <h4 className="text-cream font-medium text-xs truncate">{member.name}</h4>
                    </div>
                  </div>
                </motion.div>
              ))}
              {/* Add button for extra members */}
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
            </>
          ) : (
            <>
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
            </>
          )}
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

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Family Tree Structure - Centered Layout with Connection Lines */}
        <div className="space-y-0">
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

          {/* ===== YOU (CENTER) ===== */}
          <div className="flex flex-col items-center py-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center"
            >
              <div className="relative glass-card p-2 bg-gradient-to-br from-gold/15 to-gold/5 border-2 border-gold/40">
                <div className="flex flex-col items-center gap-1.5 w-16">
                  {(() => {
                    const activeAvatar = persona?.avatarImages?.find(img => img.isActive) || persona?.avatarImages?.[0];
                    return activeAvatar?.imageData ? (
                      <img
                        src={activeAvatar.imageData}
                        alt={user?.firstName}
                        className="w-12 h-12 rounded-full object-cover border-2 border-gold"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center border-2 border-gold">
                        <UserIcon className="w-6 h-6 text-navy" />
                      </div>
                    );
                  })()}
                  <div className="text-center w-full">
                    <h4 className="text-cream font-medium text-xs truncate">{user?.firstName}</h4>
                    <p className="text-cream/50 text-[10px]">You</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Connection line down from YOU */}
            <div className="w-0.5 h-6 bg-gradient-to-b from-gold/60 to-cream/40" />
          </div>

          {/* ===== SIBLINGS (optional, beside You) ===== */}
          {familyMembers.some(m => ['Brother', 'Sister', 'Sibling'].includes(m.relationship)) && (
            <div className="flex justify-center pb-4">
              {renderCategory('siblings')}
            </div>
          )}

          {/* ===== PARENTS ROW (centered) ===== */}
          <div className="flex flex-col items-center">
            {/* Parents Header */}
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-lg">👨‍👩</span>
              <h3 className="text-cream/70 text-sm font-medium">Parents</h3>
            </div>

            {/* Connection structure: T-junction from YOU to Mom and Dad */}
            <div className="relative flex flex-col items-center mb-2">
              {/* Horizontal line connecting Mom and Dad */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-0.5 bg-cream/40" />
              {/* Left vertical line going down to Mom */}
              <div className="absolute top-0 left-1/2 -translate-x-[56px] w-0.5 h-4 bg-gradient-to-b from-cream/40 to-teal-500/50" />
              {/* Right vertical line going down to Dad */}
              <div className="absolute top-0 left-1/2 translate-x-[56px] -translate-x-0.5 w-0.5 h-4 bg-gradient-to-b from-cream/40 to-blue-500/50" />
              <div className="h-4" /> {/* Spacer */}
            </div>

            {/* Uncle/Aunt (left) - Mom - Dad - Uncle/Aunt (right) - all in same row */}
            <div className="flex items-start gap-2">
              {/* Mom's side: Add button + existing aunts/uncles */}
              <motion.div
                onClick={() => handleEmptySlotClick('Aunt', 'Aunt (Mom\'s side)')}
                className="glass-card p-2 cursor-pointer hover:bg-teal-500/10 transition-all border border-dashed border-teal-500/30 hover:border-teal-500 self-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex flex-col items-center gap-1 w-14">
                  <div className="w-8 h-8 rounded-full bg-teal-500/10 flex items-center justify-center">
                    <Plus className="w-4 h-4 text-teal-400/70" />
                  </div>
                  <span className="text-[9px] text-teal-400/60 text-center leading-tight">Uncle/<br/>Aunt</span>
                </div>
              </motion.div>

              {/* Existing Maternal Aunts & Uncles (Mom's side) - inline */}
              {familyMembers
                .filter(m => ['Uncle', 'Aunt'].includes(m.relationship))
                .slice(0, Math.ceil(familyMembers.filter(m => ['Uncle', 'Aunt'].includes(m.relationship)).length / 2))
                .map((member) => (
                  <motion.div
                    key={member.id}
                    onClick={() => handleMemberClick(member)}
                    className="glass-card p-2 cursor-pointer hover:bg-teal-500/10 transition-all self-center"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex flex-col items-center gap-1 w-14">
                      {member.imageData ? (
                        <img
                          src={member.imageData}
                          alt={member.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-teal-500/40"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500/20 to-teal-500/10 flex items-center justify-center border-2 border-teal-500/40">
                          <span className="text-base">{member.relationship === 'Uncle' ? '👨' : '👩'}</span>
                        </div>
                      )}
                      <span className="text-[9px] text-cream/70 truncate w-full text-center">{member.name}</span>
                    </div>
                  </motion.div>
                ))}

              {/* Mom */}
              <div className="flex flex-col items-center mx-2">
                {renderPlaceholderSlot(PLACEHOLDER_SLOTS.parents[0], RELATIONSHIP_TYPES.parents, 0)}
                {/* Line down to Mom's parents */}
                <div className="w-0.5 h-8 bg-gradient-to-b from-teal-500/60 to-teal-500/30 mt-1" />
              </div>

              {/* Dad */}
              <div className="flex flex-col items-center mx-2">
                {renderPlaceholderSlot(PLACEHOLDER_SLOTS.parents[1], RELATIONSHIP_TYPES.parents, 1)}
                {/* Line down to Dad's parents */}
                <div className="w-0.5 h-8 bg-gradient-to-b from-blue-500/60 to-blue-500/30 mt-1" />
              </div>

              {/* Existing Paternal Aunts & Uncles (Dad's side) - inline */}
              {familyMembers
                .filter(m => ['Uncle', 'Aunt'].includes(m.relationship))
                .slice(Math.ceil(familyMembers.filter(m => ['Uncle', 'Aunt'].includes(m.relationship)).length / 2))
                .map((member) => (
                  <motion.div
                    key={member.id}
                    onClick={() => handleMemberClick(member)}
                    className="glass-card p-2 cursor-pointer hover:bg-blue-500/10 transition-all self-center"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex flex-col items-center gap-1 w-14">
                      {member.imageData ? (
                        <img
                          src={member.imageData}
                          alt={member.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-blue-500/40"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/20 to-blue-500/10 flex items-center justify-center border-2 border-blue-500/40">
                          <span className="text-base">{member.relationship === 'Uncle' ? '👨' : '👩'}</span>
                        </div>
                      )}
                      <span className="text-[9px] text-cream/70 truncate w-full text-center">{member.name}</span>
                    </div>
                  </motion.div>
                ))}

              {/* Add Uncle/Aunt (Dad's side - paternal) */}
              <motion.div
                onClick={() => handleEmptySlotClick('Uncle', 'Uncle (Dad\'s side)')}
                className="glass-card p-2 cursor-pointer hover:bg-blue-500/10 transition-all border border-dashed border-blue-500/30 hover:border-blue-500 self-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex flex-col items-center gap-1 w-14">
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Plus className="w-4 h-4 text-blue-400/70" />
                  </div>
                  <span className="text-[9px] text-blue-400/60 text-center leading-tight">Uncle/<br/>Aunt</span>
                </div>
              </motion.div>
            </div>
          </div>

          {/* ===== GRANDPARENTS ROW ===== */}
          <div className="flex flex-col items-center py-4">
            <div className="flex items-start gap-12">
              {/* Mom's Parents (Maternal) */}
              <div className="flex flex-col items-center">
                {/* T-junction connector from Mom */}
                <div className="relative flex flex-col items-center mb-2">
                  {/* Horizontal line connecting Grandma and Grandpa */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-0.5 bg-teal-500/40" />
                  {/* Left vertical line to Grandma */}
                  <div className="absolute top-0 left-1/2 -translate-x-[40px] w-0.5 h-4 bg-teal-500/40" />
                  {/* Right vertical line to Grandpa */}
                  <div className="absolute top-0 left-1/2 translate-x-[40px] -translate-x-0.5 w-0.5 h-4 bg-teal-500/40" />
                  <div className="h-4" /> {/* Spacer */}
                </div>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-base">👵👴</span>
                  <h3 className="text-teal-400/80 text-sm font-medium">Mom's Parents</h3>
                </div>
                <div className="flex items-start gap-4">
                  {/* Grandma (Mom) */}
                  <div className="flex flex-col items-center">
                    {renderPlaceholderSlot(PLACEHOLDER_SLOTS.grandparents[0], RELATIONSHIP_TYPES.grandparents, 0)}
                    <div className="w-0.5 h-6 bg-gradient-to-b from-teal-500/50 to-teal-500/20 mt-1" />
                  </div>
                  {/* Grandpa (Mom) */}
                  <div className="flex flex-col items-center">
                    {renderPlaceholderSlot(PLACEHOLDER_SLOTS.grandparents[1], RELATIONSHIP_TYPES.grandparents, 1)}
                    <div className="w-0.5 h-6 bg-gradient-to-b from-teal-500/50 to-teal-500/20 mt-1" />
                  </div>
                </div>
              </div>

              {/* Separator */}
              <div className="w-px h-32 bg-cream/15 self-center" />

              {/* Dad's Parents (Paternal) */}
              <div className="flex flex-col items-center">
                {/* T-junction connector from Dad */}
                <div className="relative flex flex-col items-center mb-2">
                  {/* Horizontal line connecting Grandma and Grandpa */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-0.5 bg-blue-500/40" />
                  {/* Left vertical line to Grandma */}
                  <div className="absolute top-0 left-1/2 -translate-x-[40px] w-0.5 h-4 bg-blue-500/40" />
                  {/* Right vertical line to Grandpa */}
                  <div className="absolute top-0 left-1/2 translate-x-[40px] -translate-x-0.5 w-0.5 h-4 bg-blue-500/40" />
                  <div className="h-4" /> {/* Spacer */}
                </div>
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="text-base">👴👵</span>
                  <h3 className="text-blue-400/80 text-sm font-medium">Dad's Parents</h3>
                </div>
                <div className="flex items-start gap-4">
                  {/* Grandma (Dad) */}
                  <div className="flex flex-col items-center">
                    {renderPlaceholderSlot(PLACEHOLDER_SLOTS.grandparents[2], RELATIONSHIP_TYPES.grandparents, 2)}
                    <div className="w-0.5 h-6 bg-gradient-to-b from-blue-500/50 to-blue-500/20 mt-1" />
                  </div>
                  {/* Grandpa (Dad) */}
                  <div className="flex flex-col items-center">
                    {renderPlaceholderSlot(PLACEHOLDER_SLOTS.grandparents[3], RELATIONSHIP_TYPES.grandparents, 3)}
                    <div className="w-0.5 h-6 bg-gradient-to-b from-blue-500/50 to-blue-500/20 mt-1" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ===== GREAT-GRANDPARENTS ROW ===== */}
          <div className="flex flex-col items-center py-4">
            <div className="flex items-start gap-8">
              {/* Mom's Side - 4 Great-Grandparents */}
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="text-base">🎩</span>
                  <h3 className="text-teal-400/60 text-xs font-medium">Mom's Grandparents</h3>
                </div>
                <div className="flex gap-6">
                  {/* Grandma's parents */}
                  <div className="flex flex-col items-center">
                    {/* T-junction from Grandma to her parents */}
                    <div className="relative flex flex-col items-center mb-2">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-teal-500/30" />
                      <div className="absolute top-0 left-1/2 -translate-x-[24px] w-0.5 h-3 bg-teal-500/30" />
                      <div className="absolute top-0 left-1/2 translate-x-[24px] -translate-x-0.5 w-0.5 h-3 bg-teal-500/30" />
                      <div className="h-3" />
                    </div>
                    <p className="text-teal-400/40 text-[9px] mb-1">Grandma's parents</p>
                    <div className="flex gap-1">
                      {PLACEHOLDER_SLOTS.greatGrandparents.filter(s => s.side === 'maternal' && s.branch === 'gm').map((slot, index) =>
                        renderPlaceholderSlot(slot, RELATIONSHIP_TYPES.greatGrandparents, index)
                      )}
                    </div>
                  </div>
                  {/* Grandpa's parents */}
                  <div className="flex flex-col items-center">
                    {/* T-junction from Grandpa to his parents */}
                    <div className="relative flex flex-col items-center mb-2">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-teal-500/30" />
                      <div className="absolute top-0 left-1/2 -translate-x-[24px] w-0.5 h-3 bg-teal-500/30" />
                      <div className="absolute top-0 left-1/2 translate-x-[24px] -translate-x-0.5 w-0.5 h-3 bg-teal-500/30" />
                      <div className="h-3" />
                    </div>
                    <p className="text-teal-400/40 text-[9px] mb-1">Grandpa's parents</p>
                    <div className="flex gap-1">
                      {PLACEHOLDER_SLOTS.greatGrandparents.filter(s => s.side === 'maternal' && s.branch === 'gp').map((slot, index) =>
                        renderPlaceholderSlot(slot, RELATIONSHIP_TYPES.greatGrandparents, index + 2)
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Separator */}
              <div className="w-px h-36 bg-cream/15 self-center" />

              {/* Dad's Side - 4 Great-Grandparents */}
              <div className="flex flex-col items-center">
                <div className="flex items-center gap-1.5 mb-3">
                  <span className="text-base">🎩</span>
                  <h3 className="text-blue-400/60 text-xs font-medium">Dad's Grandparents</h3>
                </div>
                <div className="flex gap-6">
                  {/* Grandma's parents */}
                  <div className="flex flex-col items-center">
                    {/* T-junction from Grandma to her parents */}
                    <div className="relative flex flex-col items-center mb-2">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-blue-500/30" />
                      <div className="absolute top-0 left-1/2 -translate-x-[24px] w-0.5 h-3 bg-blue-500/30" />
                      <div className="absolute top-0 left-1/2 translate-x-[24px] -translate-x-0.5 w-0.5 h-3 bg-blue-500/30" />
                      <div className="h-3" />
                    </div>
                    <p className="text-blue-400/40 text-[9px] mb-1">Grandma's parents</p>
                    <div className="flex gap-1">
                      {PLACEHOLDER_SLOTS.greatGrandparents.filter(s => s.side === 'paternal' && s.branch === 'gm').map((slot, index) =>
                        renderPlaceholderSlot(slot, RELATIONSHIP_TYPES.greatGrandparents, index + 4)
                      )}
                    </div>
                  </div>
                  {/* Grandpa's parents */}
                  <div className="flex flex-col items-center">
                    {/* T-junction from Grandpa to his parents */}
                    <div className="relative flex flex-col items-center mb-2">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-blue-500/30" />
                      <div className="absolute top-0 left-1/2 -translate-x-[24px] w-0.5 h-3 bg-blue-500/30" />
                      <div className="absolute top-0 left-1/2 translate-x-[24px] -translate-x-0.5 w-0.5 h-3 bg-blue-500/30" />
                      <div className="h-3" />
                    </div>
                    <p className="text-blue-400/40 text-[9px] mb-1">Grandpa's parents</p>
                    <div className="flex gap-1">
                      {PLACEHOLDER_SLOTS.greatGrandparents.filter(s => s.side === 'paternal' && s.branch === 'gp').map((slot, index) =>
                        renderPlaceholderSlot(slot, RELATIONSHIP_TYPES.greatGrandparents, index + 6)
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* GREAT-GREAT-GRANDPARENTS (expandable ancestors) */}
          {showGreatGreatGrandparents && (
            <div className="py-2 border-t border-amber-500/20">
              {renderCategory('greatGreatGrandparents')}
            </div>
          )}

          {/* Expand/Collapse Options - at bottom */}
          <div className="flex justify-center gap-2 flex-wrap pt-6 mt-4 border-t border-cream/10">
            {/* Expand Descendants */}
            <button
              onClick={() => setShowGrandchildren(!showGrandchildren)}
              className={`px-2 py-1 rounded text-[10px] font-medium transition-all flex items-center gap-1 ${
                showGrandchildren
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                  : 'bg-cream/5 text-cream/40 border border-cream/10 hover:border-cream/30'
              }`}
            >
              <span>👼</span>
              {showGrandchildren ? 'Hide' : 'Show'} Grandchildren
            </button>

            {/* Toggle Children */}
            <button
              onClick={() => setShowChildren(!showChildren)}
              className={`px-2 py-1 rounded text-[10px] font-medium transition-all flex items-center gap-1 ${
                showChildren
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                  : 'bg-cream/5 text-cream/40 border border-cream/10 hover:border-cream/30'
              }`}
            >
              <span>👶</span>
              {showChildren ? 'Hide' : 'Show'} Children
            </button>

            {/* Expand Ancestors */}
            <button
              onClick={() => setShowGreatGreatGrandparents(!showGreatGreatGrandparents)}
              className={`px-2 py-1 rounded text-[10px] font-medium transition-all flex items-center gap-1 ${
                showGreatGreatGrandparents
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-cream/5 text-cream/40 border border-cream/10 hover:border-cream/30'
              }`}
            >
              <span>📜</span>
              {showGreatGreatGrandparents ? 'Hide' : 'Show'} Deep Ancestors
            </button>
          </div>
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
                      {/* Generate Video - LEFT */}
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

                      {/* Live Conversation - RIGHT */}
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
                    </div>
                    {(!selectedMember.imageData || !selectedMember.voiceData) && (
                      <p className="text-cream/30 text-xs mt-2 text-center">
                        {!selectedMember.imageData && !selectedMember.voiceData
                          ? 'Add photo & voice to unlock'
                          : !selectedMember.imageData
                            ? 'Add photo to unlock'
                            : 'Add voice to unlock'}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* Profile Details */}
                  <div className="space-y-4 mb-6">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-gold/50" />
                      <div>
                        <p className="text-cream/50 text-xs">Born</p>
                        <p className={selectedMember.birthYear ? 'text-cream' : 'text-cream/30 italic'}>
                          {selectedMember.birthYear || 'Not specified'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-gold/50" />
                      <div>
                        <p className="text-cream/50 text-xs">Birthplace</p>
                        <p className={selectedMember.birthplace ? 'text-cream' : 'text-cream/30 italic'}>
                          {selectedMember.birthplace || 'Not specified'}
                        </p>
                      </div>
                    </div>

                    {selectedMember.isDeceased && (
                      <div className="flex items-center gap-3">
                        <Heart className="w-5 h-5 text-red-400/50" />
                        <div>
                          <p className="text-cream/50 text-xs">Passed Away</p>
                          <p className={selectedMember.deathYear ? 'text-cream' : 'text-cream/30 italic'}>
                            {selectedMember.deathYear || 'Not specified'}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-cream/10">
                      <p className="text-cream/50 text-xs mb-2">Biography</p>
                      <p className={selectedMember.bio ? 'text-cream/80 leading-relaxed' : 'text-cream/30 italic'}>
                        {selectedMember.bio || 'No biography added yet'}
                      </p>
                    </div>
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
