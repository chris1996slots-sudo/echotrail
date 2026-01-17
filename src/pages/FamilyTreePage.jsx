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
  User,
  Mic,
  Image,
  Video
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import api from '../services/api';

export function FamilyTreePage({ onNavigate }) {
  const { user } = useApp();
  const [loading, setLoading] = useState(true);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedGeneration, setSelectedGeneration] = useState('children'); // Which generation to add
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    relationship: '',
    birthYear: '',
    birthplace: '',
    bio: '',
    imageData: null,
    voiceData: null, // New: voice recording
    isDeceased: false,
    deathYear: ''
  });

  useEffect(() => {
    loadFamilyMembers();
  }, []);

  const loadFamilyMembers = async () => {
    try {
      setLoading(true);
      const response = await api.getFamilyMembers();
      setFamilyMembers(response.members || []);
    } catch (err) {
      console.error('Failed to load family members:', err);
    } finally {
      setLoading(false);
    }
  };

  // Organize family into generations (inverted - user at top)
  const organizeGenerations = () => {
    return {
      // User is at the top (Generation 0)
      self: user,

      // Children (Generation -1)
      children: familyMembers.filter(m =>
        m.relationship === 'Son' || m.relationship === 'Daughter'
      ),

      // Grandchildren (Generation -2)
      grandchildren: familyMembers.filter(m =>
        m.relationship === 'Grandson' || m.relationship === 'Granddaughter'
      ),

      // Great-Grandchildren (Generation -3)
      greatGrandchildren: familyMembers.filter(m =>
        m.relationship === 'Great-Grandson' || m.relationship === 'Great-Granddaughter'
      ),
    };
  };

  const handleAddMember = (generation) => {
    setSelectedGeneration(generation);
    setFormData({
      name: '',
      relationship: generation === 'children' ? 'Son' :
                    generation === 'grandchildren' ? 'Grandson' : 'Great-Grandson',
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.relationship) return;

    try {
      setSubmitting(true);
      if (selectedMember) {
        // Update existing
        await api.updateFamilyMember(selectedMember.id, formData);
      } else {
        // Create new
        await api.createFamilyMember(formData);
      }
      await loadFamilyMembers();
      setShowAddModal(false);
      setShowProfileModal(false);
      setSelectedMember(null);
    } catch (err) {
      console.error('Failed to save family member:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to remove this family member?')) return;
    try {
      await api.deleteFamilyMember(id);
      await loadFamilyMembers();
      setShowProfileModal(false);
    } catch (err) {
      console.error('Failed to delete family member:', err);
    }
  };

  const viewProfile = (member) => {
    setSelectedMember(member);
    setShowProfileModal(true);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
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

  // Render a tree node (person or empty slot)
  const renderPersonNode = (member, generation, position) => {
    const isEmpty = !member;

    return (
      <motion.div
        key={position || 'empty'}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: isEmpty ? 1.05 : 1.02 }}
        onClick={() => isEmpty ? handleAddMember(generation) : viewProfile(member)}
        className="cursor-pointer flex flex-col items-center"
      >
        {/* Person Image Circle */}
        <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 overflow-hidden transition-all ${
          isEmpty
            ? 'border-dashed border-cream/30 bg-navy-light/30 hover:border-gold/60'
            : 'border-gold/40 bg-navy-light hover:border-gold shadow-lg'
        }`}>
          {isEmpty ? (
            <div className="w-full h-full flex items-center justify-center">
              <Plus className="w-8 h-8 text-cream/40" />
            </div>
          ) : (
            member.imageData ? (
              <img src={member.imageData} alt={member.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center">
                <User className="w-10 h-10 text-gold/60" />
              </div>
            )
          )}
        </div>

        {/* Name and Info */}
        <div className="mt-2 text-center">
          {!isEmpty ? (
            <>
              <p className="text-cream text-sm font-medium">{member.name}</p>
              <p className="text-cream/50 text-xs">{member.relationship}</p>
              {member.isDeceased && (
                <span className="text-red-400 text-xs">✝ {member.deathYear}</span>
              )}
            </>
          ) : (
            <p className="text-cream/40 text-xs">Add {generation}</p>
          )}
        </div>
      </motion.div>
    );
  };

  const generations = organizeGenerations();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-navy via-navy to-navy-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-navy via-navy to-navy-dark py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-serif text-cream mb-3">Family Tree</h1>
          <p className="text-cream/60 text-sm sm:text-base max-w-2xl mx-auto">
            Build your legacy tree - add your children, grandchildren, and future generations
          </p>
        </div>

        {/* Tree Visualization */}
        <div className="glass-card p-6 sm:p-8 mb-8">
          <div className="flex flex-col items-center space-y-12">
            {/* Generation 0: YOU (at top) */}
            <div className="relative">
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center"
              >
                <div className="w-28 h-28 rounded-full border-4 border-gold bg-gradient-to-br from-gold/20 to-gold/10 overflow-hidden shadow-2xl">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="You" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-12 h-12 text-gold" />
                    </div>
                  )}
                </div>
                <div className="mt-3 text-center">
                  <p className="text-cream font-medium text-lg">{user?.firstName} {user?.lastName}</p>
                  <p className="text-gold text-xs">You</p>
                </div>
              </motion.div>

              {/* Connecting line down */}
              <div className="absolute left-1/2 -translate-x-1/2 top-full w-0.5 h-12 bg-gradient-to-b from-gold/60 to-transparent" />
            </div>

            {/* Generation -1: Children */}
            <div className="relative w-full">
              <div className="text-center mb-4">
                <h3 className="text-cream/70 text-sm font-medium">Your Children</h3>
              </div>
              <div className="flex flex-wrap justify-center gap-8">
                {generations.children.length > 0 ? (
                  generations.children.map((child, idx) => renderPersonNode(child, 'children', idx))
                ) : (
                  renderPersonNode(null, 'children', 0)
                )}
                {/* Always show + button to add more */}
                {generations.children.length > 0 && (
                  <motion.button
                    onClick={() => handleAddMember('children')}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-dashed border-cream/30 bg-navy-light/20 hover:border-gold/60 hover:bg-navy-light/40 flex items-center justify-center transition-all"
                    whileHover={{ scale: 1.05 }}
                  >
                    <Plus className="w-8 h-8 text-cream/40" />
                  </motion.button>
                )}
              </div>
              {/* Connecting lines down to grandchildren */}
              {generations.children.length > 0 && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0.5 h-12 bg-gradient-to-b from-cream/30 to-transparent" />
              )}
            </div>

            {/* Generation -2: Grandchildren */}
            {(generations.grandchildren.length > 0 || generations.children.length > 0) && (
              <div className="relative w-full">
                <div className="text-center mb-4">
                  <h3 className="text-cream/70 text-sm font-medium">Your Grandchildren</h3>
                </div>
                <div className="flex flex-wrap justify-center gap-8">
                  {generations.grandchildren.length > 0 ? (
                    generations.grandchildren.map((grandchild, idx) => renderPersonNode(grandchild, 'grandchildren', idx))
                  ) : (
                    renderPersonNode(null, 'grandchildren', 0)
                  )}
                  {generations.grandchildren.length > 0 && (
                    <motion.button
                      onClick={() => handleAddMember('grandchildren')}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-dashed border-cream/30 bg-navy-light/20 hover:border-gold/60 hover:bg-navy-light/40 flex items-center justify-center transition-all"
                      whileHover={{ scale: 1.05 }}
                    >
                      <Plus className="w-8 h-8 text-cream/40" />
                    </motion.button>
                  )}
                </div>
                {generations.grandchildren.length > 0 && (
                  <div className="absolute left-1/2 -translate-x-1/2 top-full w-0.5 h-12 bg-gradient-to-b from-cream/20 to-transparent" />
                )}
              </div>
            )}

            {/* Generation -3: Great-Grandchildren */}
            {(generations.greatGrandchildren.length > 0 || generations.grandchildren.length > 0) && (
              <div className="w-full">
                <div className="text-center mb-4">
                  <h3 className="text-cream/70 text-sm font-medium">Your Great-Grandchildren</h3>
                </div>
                <div className="flex flex-wrap justify-center gap-8">
                  {generations.greatGrandchildren.length > 0 ? (
                    generations.greatGrandchildren.map((ggChild, idx) => renderPersonNode(ggChild, 'greatGrandchildren', idx))
                  ) : (
                    renderPersonNode(null, 'greatGrandchildren', 0)
                  )}
                  {generations.greatGrandchildren.length > 0 && (
                    <motion.button
                      onClick={() => handleAddMember('greatGrandchildren')}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 border-dashed border-cream/30 bg-navy-light/20 hover:border-gold/60 hover:bg-navy-light/40 flex items-center justify-center transition-all"
                      whileHover={{ scale: 1.05 }}
                    >
                      <Plus className="w-8 h-8 text-cream/40" />
                    </motion.button>
                  )}
                </div>
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
              className="fixed inset-0 z-50 bg-navy-dark/95 backdrop-blur-lg flex items-center justify-center p-4"
              onClick={() => setShowAddModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-navy border border-gold/20 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-serif text-cream">Add Family Member</h2>
                  <button onClick={() => setShowAddModal(false)} className="text-cream/50 hover:text-cream">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Photo Upload */}
                  <div>
                    <label className="block text-cream/70 text-sm mb-2">Photo (Optional)</label>
                    <div className="flex items-center gap-4">
                      {formData.imageData && (
                        <img src={formData.imageData} alt="Preview" className="w-20 h-20 rounded-full object-cover" />
                      )}
                      <label className="flex-1 px-4 py-3 rounded-xl bg-navy-light/50 border border-cream/20 text-cream/60 text-sm cursor-pointer hover:border-gold/40 transition-colors flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Upload Photo
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                    </div>
                  </div>

                  {/* Voice Upload */}
                  <div>
                    <label className="block text-cream/70 text-sm mb-2">Voice Recording (Optional)</label>
                    <label className="w-full px-4 py-3 rounded-xl bg-navy-light/50 border border-cream/20 text-cream/60 text-sm cursor-pointer hover:border-gold/40 transition-colors flex items-center gap-2">
                      <Mic className="w-4 h-4" />
                      Upload Voice
                      <input type="file" accept="audio/*" onChange={handleVoiceUpload} className="hidden" />
                    </label>
                    {formData.voiceData && (
                      <p className="mt-2 text-green-400 text-xs">✓ Voice uploaded</p>
                    )}
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-cream/70 text-sm mb-2">Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-navy-light/50 border border-cream/20 text-cream placeholder-cream/30 text-sm focus:outline-none focus:border-gold/50"
                      placeholder="Enter name..."
                      required
                    />
                  </div>

                  {/* Relationship */}
                  <div>
                    <label className="block text-cream/70 text-sm mb-2">Relationship *</label>
                    <select
                      value={formData.relationship}
                      onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-navy-light/50 border border-cream/20 text-cream text-sm focus:outline-none focus:border-gold/50"
                      required
                    >
                      <option value="">Select relationship...</option>
                      <optgroup label="Children">
                        <option value="Son">Son</option>
                        <option value="Daughter">Daughter</option>
                      </optgroup>
                      <optgroup label="Grandchildren">
                        <option value="Grandson">Grandson</option>
                        <option value="Granddaughter">Granddaughter</option>
                      </optgroup>
                      <optgroup label="Great-Grandchildren">
                        <option value="Great-Grandson">Great-Grandson</option>
                        <option value="Great-Granddaughter">Great-Granddaughter</option>
                      </optgroup>
                    </select>
                  </div>

                  {/* Birth Year */}
                  <div>
                    <label className="block text-cream/70 text-sm mb-2">Birth Year (Optional)</label>
                    <input
                      type="text"
                      value={formData.birthYear}
                      onChange={(e) => setFormData({ ...formData, birthYear: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-navy-light/50 border border-cream/20 text-cream placeholder-cream/30 text-sm focus:outline-none focus:border-gold/50"
                      placeholder="e.g., 2020"
                    />
                  </div>

                  {/* Birthplace */}
                  <div>
                    <label className="block text-cream/70 text-sm mb-2">Birthplace (Optional)</label>
                    <input
                      type="text"
                      value={formData.birthplace}
                      onChange={(e) => setFormData({ ...formData, birthplace: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-navy-light/50 border border-cream/20 text-cream placeholder-cream/30 text-sm focus:outline-none focus:border-gold/50"
                      placeholder="City, Country"
                    />
                  </div>

                  {/* Bio */}
                  <div>
                    <label className="block text-cream/70 text-sm mb-2">Story / Notes (Optional)</label>
                    <textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl bg-navy-light/50 border border-cream/20 text-cream placeholder-cream/30 text-sm focus:outline-none focus:border-gold/50 resize-none"
                      placeholder="Share memories, stories, or important details..."
                      rows={4}
                    />
                  </div>

                  {/* Deceased Status */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="deceased"
                      checked={formData.isDeceased}
                      onChange={(e) => setFormData({ ...formData, isDeceased: e.target.checked })}
                      className="w-4 h-4 rounded bg-navy-light border-cream/20"
                    />
                    <label htmlFor="deceased" className="text-cream/70 text-sm">Deceased</label>
                    {formData.isDeceased && (
                      <input
                        type="text"
                        value={formData.deathYear}
                        onChange={(e) => setFormData({ ...formData, deathYear: e.target.value })}
                        placeholder="Death year"
                        className="flex-1 px-3 py-2 rounded-lg bg-navy-light/50 border border-cream/20 text-cream placeholder-cream/30 text-sm focus:outline-none focus:border-gold/50"
                      />
                    )}
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={submitting}
                    className="w-full px-6 py-3 bg-gradient-to-r from-gold to-gold-light text-navy font-medium rounded-xl hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Heart className="w-5 h-5" />
                        Add to Family Tree
                      </>
                    )}
                  </motion.button>
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
              className="fixed inset-0 z-50 bg-navy-dark/95 backdrop-blur-lg flex items-center justify-center p-4"
              onClick={() => setShowProfileModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-navy border border-gold/20 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              >
                {/* Header with photo */}
                <div className="flex items-start gap-6 mb-6">
                  <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-gold/40 flex-shrink-0">
                    {selectedMember.imageData ? (
                      <img src={selectedMember.imageData} alt={selectedMember.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-gold/20 to-gold/10 flex items-center justify-center">
                        <User className="w-12 h-12 text-gold/60" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-serif text-cream mb-1">{selectedMember.name}</h2>
                    <p className="text-cream/60 text-sm mb-2">{selectedMember.relationship}</p>
                    {selectedMember.isDeceased && (
                      <p className="text-red-400 text-sm">✝ {selectedMember.deathYear}</p>
                    )}
                  </div>
                  <button onClick={() => setShowProfileModal(false)} className="text-cream/50 hover:text-cream">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Info */}
                <div className="space-y-4 mb-6">
                  {selectedMember.birthYear && (
                    <div className="flex items-center gap-3 text-sm">
                      <Calendar className="w-4 h-4 text-gold" />
                      <span className="text-cream/70">Born: </span>
                      <span className="text-cream">{selectedMember.birthYear}</span>
                    </div>
                  )}
                  {selectedMember.birthplace && (
                    <div className="flex items-center gap-3 text-sm">
                      <MapPin className="w-4 h-4 text-gold" />
                      <span className="text-cream/70">Birthplace: </span>
                      <span className="text-cream">{selectedMember.birthplace}</span>
                    </div>
                  )}
                  {selectedMember.bio && (
                    <div>
                      <p className="text-cream/70 text-sm mb-2">Story:</p>
                      <p className="text-cream text-sm leading-relaxed">{selectedMember.bio}</p>
                    </div>
                  )}
                  {selectedMember.voiceData && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mic className="w-4 h-4 text-green-400" />
                      <span className="text-green-400">Voice recording available</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <motion.button
                    onClick={() => {
                      // TODO: Implement live conversation with this family member
                      alert('Live conversation feature coming soon!');
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
                      // TODO: Implement video generation for this family member
                      alert('Video generation feature coming soon!');
                    }}
                    className="px-4 py-3 rounded-xl bg-gold/20 text-gold text-sm font-medium flex items-center justify-center gap-2 hover:bg-gold/30"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Film className="w-4 h-4" />
                    Create Video
                  </motion.button>
                </div>

                {/* Edit/Delete */}
                <div className="grid grid-cols-2 gap-3 border-t border-cream/10 pt-4">
                  <motion.button
                    onClick={() => {
                      setFormData({
                        name: selectedMember.name,
                        relationship: selectedMember.relationship,
                        birthYear: selectedMember.birthYear || '',
                        birthplace: selectedMember.birthplace || '',
                        bio: selectedMember.bio || '',
                        imageData: selectedMember.imageData,
                        voiceData: selectedMember.voiceData,
                        isDeceased: selectedMember.isDeceased || false,
                        deathYear: selectedMember.deathYear || ''
                      });
                      setShowProfileModal(false);
                      setShowAddModal(true);
                    }}
                    className="px-4 py-2 rounded-lg bg-navy-light/50 text-cream text-sm flex items-center justify-center gap-2 hover:bg-navy-light"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </motion.button>
                  <motion.button
                    onClick={() => handleDelete(selectedMember.id)}
                    className="px-4 py-2 rounded-lg bg-red-500/20 text-red-400 text-sm flex items-center justify-center gap-2 hover:bg-red-500/30"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
