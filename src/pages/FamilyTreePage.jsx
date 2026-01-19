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
  const [showGrandchildren, setShowGrandchildren] = useState(true);

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
    deathYear: ''
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
      deathYear: ''
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
      deathYear: ''
    });
    setShowAddModal(true);
  };

  // Handle clicking on filled slot
  const handleMemberClick = (member) => {
    setSelectedMember(member);
    setShowProfileModal(true);
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
      deathYear: selectedMember.deathYear || ''
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
      deathYear: ''
    });
    setSelectedRelationship('');
  };

  // Render category section with all members + add button
  const renderCategory = (categoryKey) => {
    const categoryDef = RELATIONSHIP_TYPES[categoryKey];
    const members = getMembersByCategory(categoryKey);

    return (
      <div key={categoryKey} className="flex flex-col items-center mb-8">
        {/* Category Header */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-2xl">{categoryDef.icon}</span>
          <h3 className="text-cream/70 text-lg font-medium">{categoryDef.label}</h3>
        </div>

        {/* Members Grid */}
        <div className="flex flex-wrap justify-center gap-4 w-full max-w-4xl">
          {/* Existing Members */}
          {members.map((member) => (
            <motion.div
              key={member.id}
              onClick={() => handleMemberClick(member)}
              className={`relative glass-card p-4 cursor-pointer hover:bg-cream/5 transition-all bg-gradient-to-br ${categoryDef.color}`}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.98 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col items-center gap-3 w-32">
                {/* Avatar */}
                <div className="relative">
                  {member.imageData ? (
                    <img
                      src={member.imageData}
                      alt={member.name}
                      className="w-20 h-20 rounded-full object-cover border-3 border-gold/40"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold/30 to-gold/10 flex items-center justify-center border-3 border-gold/40">
                      <UserIcon className="w-10 h-10 text-gold/60" />
                    </div>
                  )}

                  {/* Status indicators */}
                  {(member.voiceData || member.imageData) && (
                    <div className="absolute -bottom-1 -right-1 flex gap-1">
                      {member.voiceData && (
                        <div className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center border-2 border-navy">
                          <Mic className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Name and relationship */}
                <div className="text-center">
                  <h4 className="text-cream font-medium text-sm truncate w-full">{member.name}</h4>
                  <p className="text-cream/50 text-xs">{member.relationship}</p>
                  {member.isDeceased && (
                    <p className="text-cream/40 text-xs italic">({member.deathYear})</p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}

          {/* Add Member Button */}
          <motion.div
            onClick={() => handleAddMember(categoryKey)}
            className="relative glass-card p-4 cursor-pointer hover:bg-gold/5 transition-all border-2 border-dashed border-gold/30 hover:border-gold"
            whileHover={{ scale: 1.05, y: -4 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex flex-col items-center gap-3 w-32 h-full justify-center">
              {/* Plus icon */}
              <div className="w-20 h-20 rounded-full bg-gold/10 flex items-center justify-center border-3 border-dashed border-gold/30">
                <Plus className="w-10 h-10 text-gold/60" />
              </div>

              {/* Label */}
              <div className="text-center">
                <p className="text-gold/70 text-sm font-medium">Add {categoryDef.label.slice(0, -1)}</p>
                <p className="text-cream/40 text-xs">Click to create</p>
              </div>
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
      {/* Animated Tree Background */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <svg className="w-full h-full" viewBox="0 0 1000 1200" preserveAspectRatio="xMidYMax meet">
          {/* Tree Trunk */}
          <motion.path
            d="M 500 1200 Q 480 1000 490 800 Q 495 600 500 400"
            stroke="url(#trunkGradient)"
            strokeWidth="20"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, ease: "easeInOut" }}
          />

          {/* Main Branches - spreading upward */}
          {/* Left main branch */}
          <motion.path
            d="M 500 600 Q 400 550 300 500"
            stroke="url(#branchGradient)"
            strokeWidth="12"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, delay: 0.5 }}
          />

          {/* Right main branch */}
          <motion.path
            d="M 500 600 Q 600 550 700 500"
            stroke="url(#branchGradient)"
            strokeWidth="12"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, delay: 0.5 }}
          />

          {/* Upper branches */}
          <motion.path
            d="M 500 400 Q 420 350 350 300"
            stroke="url(#branchGradient)"
            strokeWidth="10"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, delay: 0.8 }}
          />

          <motion.path
            d="M 500 400 Q 580 350 650 300"
            stroke="url(#branchGradient)"
            strokeWidth="10"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, delay: 0.8 }}
          />

          {/* Smaller branches */}
          <motion.path
            d="M 350 300 Q 320 250 280 200"
            stroke="url(#branchGradient)"
            strokeWidth="6"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
          />

          <motion.path
            d="M 650 300 Q 680 250 720 200"
            stroke="url(#branchGradient)"
            strokeWidth="6"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
          />

          {/* Root system */}
          <motion.path
            d="M 490 1200 Q 450 1250 400 1300"
            stroke="url(#rootGradient)"
            strokeWidth="8"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, delay: 0.3 }}
          />

          <motion.path
            d="M 510 1200 Q 550 1250 600 1300"
            stroke="url(#rootGradient)"
            strokeWidth="8"
            fill="none"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, delay: 0.3 }}
          />

          {/* Gradients */}
          <defs>
            <linearGradient id="trunkGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#8B7355" stopOpacity="0.8" />
            </linearGradient>

            <linearGradient id="branchGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#9E8B6F" stopOpacity="0.3" />
            </linearGradient>

            <linearGradient id="rootGradient" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#8B7355" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#654321" stopOpacity="0.5" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Compact Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-serif text-cream flex items-center justify-center gap-2">
            <Users className="w-7 h-7 text-gold" />
            Your Family Tree
          </h1>

          {/* Toggle Options */}
          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <button
              onClick={() => setShowGrandchildren(!showGrandchildren)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                showGrandchildren
                  ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                  : 'bg-cream/5 text-cream/40 border border-cream/10'
              }`}
            >
              👼 Grandchildren
            </button>
            <button
              onClick={() => setShowChildren(!showChildren)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                showChildren
                  ? 'bg-green-500/20 text-green-300 border border-green-500/30'
                  : 'bg-cream/5 text-cream/40 border border-cream/10'
              }`}
            >
              👶 Children
            </button>
          </div>
        </motion.div>

        {/* Family Tree Structure - Flexible Layout */}
        <div className="space-y-8">
          {/* LEVEL 0: Grandchildren (Children's Children) */}
          {showGrandchildren && renderCategory('grandchildren')}

          {/* Connecting line */}
          {showGrandchildren && getMembersByCategory('grandchildren').length > 0 && (
            <div className="flex justify-center">
              <div className="w-0.5 h-8 bg-gradient-to-b from-cream/20 to-transparent" />
            </div>
          )}

          {/* LEVEL 1: Children */}
          {showChildren && renderCategory('children')}

          {/* Connecting line between Children and User (only if children shown) */}
          {showChildren && getMembersByCategory('children').length > 0 && (
            <div className="flex justify-center">
              <div className="w-0.5 h-8 bg-gradient-to-b from-cream/20 to-transparent" />
            </div>
          )}

          {/* LEVEL 2: User Card (You) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-center"
          >
            <div className="relative glass-card p-6 w-full max-w-sm bg-gradient-to-br from-gold/10 to-gold/5 border-2 border-gold/30">
              <div className="flex flex-col items-center gap-4">
                {/* User avatar */}
                {(() => {
                  // Get active avatar or first avatar from persona
                  const activeAvatar = persona?.avatarImages?.find(img => img.isActive) || persona?.avatarImages?.[0];

                  return activeAvatar?.imageData ? (
                    <img
                      src={activeAvatar.imageData}
                      alt={user?.firstName}
                      className="w-20 h-20 rounded-full object-cover border-3 border-gold"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold to-gold-light flex items-center justify-center border-3 border-gold">
                      <UserIcon className="w-10 h-10 text-navy" />
                    </div>
                  );
                })()}

                {/* User name */}
                <div className="text-center">
                  <h2 className="text-2xl font-medium text-gold">{user?.firstName} {user?.lastName}</h2>
                  <p className="text-cream/60 text-sm">You</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* LEVEL 2.5: Siblings (same level as user) */}
          {renderCategory('siblings')}

          {/* Connecting line */}
          <div className="flex justify-center">
            <div className="w-0.5 h-8 bg-gradient-to-b from-cream/20 to-transparent" />
          </div>

          {/* LEVEL 3: Parents & Aunts/Uncles (Same Generation) */}
          <div className="space-y-8">
            {renderCategory('parents')}
            {renderCategory('auntsUncles')}
          </div>

          {/* Connecting line */}
          <div className="flex justify-center">
            <div className="w-0.5 h-8 bg-gradient-to-b from-cream/20 to-transparent" />
          </div>

          {/* LEVEL 4: Grandparents */}
          {renderCategory('grandparents')}

          {/* LEVEL 5: Great-Grandparents */}
          {renderCategory('greatGrandparents')}
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
                  onClick={() => setShowProfileModal(false)}
                  className="p-2 hover:bg-cream/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-cream/50" />
                </button>
              </div>

              {/* Details */}
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
                  onClick={() => {
                    if (!selectedMember.imageData || !selectedMember.voiceData) {
                      alert('Please add a photo and voice recording to enable live chat with this family member.');
                      return;
                    }
                    setShowProfileModal(false);
                    onNavigate('echo-sim');
                    alert(`Live Chat with ${selectedMember.name} will use their uploaded photo and voice. This feature is coming soon!`);
                  }}
                  className="px-4 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white text-sm font-medium flex items-center justify-center gap-2 hover:from-purple-500 hover:to-pink-500"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <MessageCircle className="w-4 h-4" />
                  Live Chat
                </motion.button>

                <motion.button
                  onClick={() => {
                    if (!selectedMember.imageData || !selectedMember.voiceData) {
                      alert('Please add a photo and voice recording to generate videos with this family member.');
                      return;
                    }
                    setShowProfileModal(false);
                    onNavigate('echo-sim');
                    alert(`Video Generation for ${selectedMember.name} will use their uploaded photo and voice. This feature is coming soon!`);
                  }}
                  className="px-4 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-sm font-medium flex items-center justify-center gap-2 hover:from-blue-500 hover:to-cyan-500"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Film className="w-4 h-4" />
                  Generate Video
                </motion.button>

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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
