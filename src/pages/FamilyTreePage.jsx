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
  CheckCircle2,
  RefreshCw,
  ArrowLeft,
  Heart,
  MapPin,
  Calendar,
  User
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
  const [selectedSlot, setSelectedSlot] = useState(null); // Which slot is being filled
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const [capturedPhoto, setCapturedPhoto] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    relationship: '',
    birthYear: '',
    birthplace: '',
    bio: '',
    imageData: null,
    isDeceased: false,
    deathYear: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Refs for camera
  const [cameraVideoRef, setCameraVideoRef] = useState(null);
  const [canvasRef, setCanvasRef] = useState(null);

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

  // Organize family members by relationship
  const organizeFamily = () => {
    const organized = {
      grandparents: {
        paternal: {
          grandfather: familyMembers.find(m => m.relationship === 'Paternal Grandfather'),
          grandmother: familyMembers.find(m => m.relationship === 'Paternal Grandmother')
        },
        maternal: {
          grandfather: familyMembers.find(m => m.relationship === 'Maternal Grandfather'),
          grandmother: familyMembers.find(m => m.relationship === 'Maternal Grandmother')
        }
      },
      parents: {
        father: familyMembers.find(m => m.relationship === 'Father'),
        mother: familyMembers.find(m => m.relationship === 'Mother')
      },
      self: user,
      spouse: familyMembers.find(m => m.relationship === 'Spouse' || m.relationship === 'Partner'),
      children: familyMembers.filter(m => m.relationship === 'Son' || m.relationship === 'Daughter'),
      siblings: familyMembers.filter(m => m.relationship === 'Brother' || m.relationship === 'Sister')
    };
    return organized;
  };

  const handleAddMemberToSlot = (slot) => {
    setSelectedSlot(slot);
    setFormData({
      name: '',
      relationship: slot.relationship,
      birthYear: '',
      birthplace: '',
      bio: '',
      imageData: null,
      isDeceased: false,
      deathYear: ''
    });
    setFormErrors({});
    setShowAddModal(true);
  };

  const handleEditMember = (member) => {
    setFormData({
      name: member.name,
      relationship: member.relationship,
      birthYear: member.birthYear || '',
      birthplace: member.birthplace || '',
      bio: member.bio || '',
      imageData: member.imageData,
      isDeceased: member.isDeceased || false,
      deathYear: member.deathYear || ''
    });
    setSelectedMember(member);
    setSelectedSlot(null);
    setShowAddModal(true);
  };

  const handleDeleteMember = async (memberId) => {
    if (!confirm('Are you sure you want to delete this family member?')) return;

    try {
      await api.deleteFamilyMember(memberId);
      setFamilyMembers(familyMembers.filter(m => m.id !== memberId));
      setShowProfileModal(false);
    } catch (err) {
      console.error('Failed to delete family member:', err);
      alert('Failed to delete family member');
    }
  };

  const viewProfile = (member) => {
    setSelectedMember(member);
    setShowProfileModal(true);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData({ ...formData, imageData: event.target.result });
    };
    reader.readAsDataURL(file);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 1280, height: 720 }
      });
      setCameraStream(stream);
      setShowCameraModal(true);

      setTimeout(() => {
        if (cameraVideoRef) {
          cameraVideoRef.srcObject = stream;
          cameraVideoRef.play();
        }
      }, 100);
    } catch (err) {
      console.error('Camera error:', err);
      alert('Could not access camera. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setShowCameraModal(false);
    setCapturedPhoto(null);
  };

  const capturePhoto = () => {
    if (!cameraVideoRef || !canvasRef) return;

    const video = cameraVideoRef;
    const canvas = canvasRef;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');
    ctx.save();
    ctx.scale(-1, 1);
    ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
    ctx.restore();

    const imageData = canvas.toDataURL('image/jpeg', 0.9);
    setCapturedPhoto(imageData);
  };

  const usePhoto = () => {
    if (capturedPhoto) {
      setFormData({ ...formData, imageData: capturedPhoto });
      stopCamera();
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.relationship.trim()) errors.relationship = 'Relationship is required';
    if (!formData.imageData) errors.imageData = 'Photo is required';
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setSubmitting(true);
    try {
      if (selectedMember) {
        // Update existing member
        await api.updateFamilyMember(selectedMember.id, formData);
        setFamilyMembers(familyMembers.map(m =>
          m.id === selectedMember.id ? { ...m, ...formData } : m
        ));
      } else {
        // Create new member
        const response = await api.createFamilyMember(formData);
        setFamilyMembers([...familyMembers, response.member]);
      }
      setShowAddModal(false);
      setSelectedMember(null);
      setSelectedSlot(null);
    } catch (err) {
      console.error('Failed to save family member:', err);
      alert('Failed to save family member');
    } finally {
      setSubmitting(false);
    }
  };

  // Render a tree node (person slot)
  const renderTreeNode = (member, slot) => {
    const isEmpty = !member;

    return (
      <motion.div
        whileHover={{ scale: isEmpty ? 1.05 : 1.02 }}
        onClick={() => isEmpty ? handleAddMemberToSlot(slot) : viewProfile(member)}
        className={`relative cursor-pointer ${isEmpty ? 'opacity-70' : ''}`}
      >
        <div className={`w-24 h-24 sm:w-32 sm:h-32 rounded-2xl border-2 overflow-hidden transition-all ${
          isEmpty
            ? 'border-dashed border-gold/30 bg-navy-light/30 hover:border-gold/60 hover:bg-navy-light/50'
            : 'border-gold/40 bg-navy-light hover:border-gold/70'
        }`}>
          {isEmpty ? (
            <div className="w-full h-full flex items-center justify-center">
              <Plus className="w-8 h-8 text-gold/50" />
            </div>
          ) : (
            <img
              src={member.imageData}
              alt={member.name}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Name and info */}
        <div className="mt-2 text-center">
          {isEmpty ? (
            <p className="text-xs text-cream/50">{slot.label}</p>
          ) : (
            <>
              <p className="text-sm font-medium text-cream truncate max-w-[120px] mx-auto">
                {member.name}
              </p>
              {member.birthYear && (
                <p className="text-xs text-cream/50">
                  {member.isDeceased && member.deathYear
                    ? `${member.birthYear} - ${member.deathYear}`
                    : member.birthYear
                  }
                </p>
              )}
              {member.isDeceased && (
                <span className="text-xs text-red-400">✝</span>
              )}
            </>
          )}
        </div>
      </motion.div>
    );
  };

  const family = organizeFamily();

  if (loading) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-gold animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8"
      >
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-serif text-cream mb-2">Family Tree</h1>
            <p className="text-cream/60">Your family legacy, visualized</p>
          </div>
        </div>

        {/* Visual Family Tree */}
        <div className="bg-navy-light/30 rounded-3xl p-8 border border-gold/10 overflow-x-auto">
          <div className="min-w-max">
            {/* Grandparents Level */}
            <div className="flex justify-center gap-8 sm:gap-16 mb-12">
              {/* Paternal Grandparents */}
              <div className="flex gap-6">
                {renderTreeNode(family.grandparents.paternal.grandfather, {
                  relationship: 'Paternal Grandfather',
                  label: 'Add Grandfather'
                })}
                {renderTreeNode(family.grandparents.paternal.grandmother, {
                  relationship: 'Paternal Grandmother',
                  label: 'Add Grandmother'
                })}
              </div>

              {/* Maternal Grandparents */}
              <div className="flex gap-6">
                {renderTreeNode(family.grandparents.maternal.grandfather, {
                  relationship: 'Maternal Grandfather',
                  label: 'Add Grandfather'
                })}
                {renderTreeNode(family.grandparents.maternal.grandmother, {
                  relationship: 'Maternal Grandmother',
                  label: 'Add Grandmother'
                })}
              </div>
            </div>

            {/* Connecting lines to parents */}
            <div className="flex justify-center mb-4">
              <div className="w-px h-8 bg-gradient-to-b from-gold/30 to-transparent"></div>
            </div>

            {/* Parents Level */}
            <div className="flex justify-center gap-12 mb-12">
              {renderTreeNode(family.parents.father, {
                relationship: 'Father',
                label: 'Add Father'
              })}
              {renderTreeNode(family.parents.mother, {
                relationship: 'Mother',
                label: 'Add Mother'
              })}
            </div>

            {/* Connecting lines to self */}
            <div className="flex justify-center mb-4">
              <div className="w-px h-8 bg-gradient-to-b from-gold/30 to-transparent"></div>
            </div>

            {/* Self + Spouse Level */}
            <div className="flex justify-center gap-12 mb-12">
              {/* Self */}
              <div className="relative">
                <div className="w-32 h-32 rounded-2xl border-4 border-gold/70 bg-gradient-to-br from-purple-600/20 to-pink-600/20 overflow-hidden">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt="You"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-16 h-16 text-gold" />
                    </div>
                  )}
                </div>
                <div className="mt-2 text-center">
                  <p className="text-sm font-medium text-cream">You</p>
                  <p className="text-xs text-gold">{user.firstName} {user.lastName}</p>
                </div>
              </div>

              {/* Spouse/Partner */}
              {renderTreeNode(family.spouse, {
                relationship: 'Spouse',
                label: 'Add Partner'
              })}
            </div>

            {/* Connecting lines to children */}
            {family.children.length > 0 && (
              <div className="flex justify-center mb-4">
                <div className="w-px h-8 bg-gradient-to-b from-gold/30 to-transparent"></div>
              </div>
            )}

            {/* Children Level */}
            {family.children.length > 0 && (
              <div className="flex justify-center gap-6 flex-wrap">
                {family.children.map(child => (
                  <div key={child.id}>
                    {renderTreeNode(child, null)}
                  </div>
                ))}
              </div>
            )}

            {/* Add child button */}
            <div className="flex justify-center mt-6">
              <motion.button
                onClick={() => handleAddMemberToSlot({ relationship: 'Son', label: 'Add Child' })}
                className="px-4 py-2 bg-navy-light/50 border border-gold/20 rounded-xl text-cream/70 text-sm hover:border-gold/40 hover:text-cream transition-all flex items-center gap-2"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Plus className="w-4 h-4" />
                Add Child
              </motion.button>
            </div>
          </div>
        </div>

        {/* Siblings Section (Below tree) */}
        {family.siblings.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-serif text-cream mb-4">Siblings</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
              {family.siblings.map(sibling => (
                <div key={sibling.id}>
                  {renderTreeNode(sibling, null)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Add sibling button */}
        <div className="flex justify-center mt-6">
          <motion.button
            onClick={() => handleAddMemberToSlot({ relationship: 'Brother', label: 'Add Sibling' })}
            className="px-4 py-2 bg-navy-light/50 border border-gold/20 rounded-xl text-cream/70 text-sm hover:border-gold/40 hover:text-cream transition-all flex items-center gap-2"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-4 h-4" />
            Add Sibling
          </motion.button>
        </div>
      </motion.div>

      {/* Add/Edit Member Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-navy-dark/95 backdrop-blur-lg flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-navy-light border border-gold/20 rounded-2xl p-6 max-w-lg w-full my-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-serif text-cream">
                  {selectedMember ? 'Edit Family Member' : 'Add Family Member'}
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedMember(null);
                    setSelectedSlot(null);
                  }}
                  className="p-2 rounded-full bg-cream/10 text-cream hover:bg-cream/20 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Photo Upload */}
                <div>
                  <label className="block text-sm font-medium text-cream mb-2">
                    Photo *
                  </label>
                  {formData.imageData ? (
                    <div className="relative">
                      <img
                        src={formData.imageData}
                        alt="Preview"
                        className="w-full h-48 object-cover rounded-xl"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, imageData: null })}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <label className="flex-1 px-4 py-3 bg-navy-dark border border-gold/20 rounded-xl text-cream/70 text-center cursor-pointer hover:border-gold/40 transition-all">
                        <Upload className="w-5 h-5 mx-auto mb-1" />
                        <span className="text-sm">Upload Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="px-4 py-3 bg-navy-dark border border-gold/20 rounded-xl text-cream/70 hover:border-gold/40 transition-all"
                      >
                        <Camera className="w-5 h-5 mx-auto mb-1" />
                        <span className="text-sm">Camera</span>
                      </button>
                    </div>
                  )}
                  {formErrors.imageData && (
                    <p className="text-red-400 text-xs mt-1">{formErrors.imageData}</p>
                  )}
                </div>

                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-cream mb-2">
                    Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-navy-dark border border-gold/20 rounded-xl text-cream placeholder-cream/30 focus:border-gold/40 focus:outline-none"
                    placeholder="Enter name"
                  />
                  {formErrors.name && (
                    <p className="text-red-400 text-xs mt-1">{formErrors.name}</p>
                  )}
                </div>

                {/* Relationship */}
                <div>
                  <label className="block text-sm font-medium text-cream mb-2">
                    Relationship *
                  </label>
                  <select
                    value={formData.relationship}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                    className="w-full px-4 py-3 bg-navy-dark border border-gold/20 rounded-xl text-cream focus:border-gold/40 focus:outline-none"
                  >
                    <option value="">Select relationship</option>
                    <optgroup label="Grandparents">
                      <option value="Paternal Grandfather">Paternal Grandfather</option>
                      <option value="Paternal Grandmother">Paternal Grandmother</option>
                      <option value="Maternal Grandfather">Maternal Grandfather</option>
                      <option value="Maternal Grandmother">Maternal Grandmother</option>
                    </optgroup>
                    <optgroup label="Parents">
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                    </optgroup>
                    <optgroup label="Siblings">
                      <option value="Brother">Brother</option>
                      <option value="Sister">Sister</option>
                    </optgroup>
                    <optgroup label="Partner">
                      <option value="Spouse">Spouse</option>
                      <option value="Partner">Partner</option>
                    </optgroup>
                    <optgroup label="Children">
                      <option value="Son">Son</option>
                      <option value="Daughter">Daughter</option>
                    </optgroup>
                  </select>
                  {formErrors.relationship && (
                    <p className="text-red-400 text-xs mt-1">{formErrors.relationship}</p>
                  )}
                </div>

                {/* Birth Year */}
                <div>
                  <label className="block text-sm font-medium text-cream mb-2">
                    Birth Year
                  </label>
                  <input
                    type="text"
                    value={formData.birthYear}
                    onChange={(e) => setFormData({ ...formData, birthYear: e.target.value })}
                    className="w-full px-4 py-3 bg-navy-dark border border-gold/20 rounded-xl text-cream placeholder-cream/30 focus:border-gold/40 focus:outline-none"
                    placeholder="e.g. 1950"
                  />
                </div>

                {/* Deceased */}
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isDeceased}
                      onChange={(e) => setFormData({ ...formData, isDeceased: e.target.checked })}
                      className="w-4 h-4 rounded border-gold/20 bg-navy-dark text-gold focus:ring-gold/40"
                    />
                    <span className="text-sm text-cream">Deceased</span>
                  </label>
                </div>

                {/* Death Year (if deceased) */}
                {formData.isDeceased && (
                  <div>
                    <label className="block text-sm font-medium text-cream mb-2">
                      Death Year
                    </label>
                    <input
                      type="text"
                      value={formData.deathYear}
                      onChange={(e) => setFormData({ ...formData, deathYear: e.target.value })}
                      className="w-full px-4 py-3 bg-navy-dark border border-gold/20 rounded-xl text-cream placeholder-cream/30 focus:border-gold/40 focus:outline-none"
                      placeholder="e.g. 2020"
                    />
                  </div>
                )}

                {/* Birthplace */}
                <div>
                  <label className="block text-sm font-medium text-cream mb-2">
                    Birthplace
                  </label>
                  <input
                    type="text"
                    value={formData.birthplace}
                    onChange={(e) => setFormData({ ...formData, birthplace: e.target.value })}
                    className="w-full px-4 py-3 bg-navy-dark border border-gold/20 rounded-xl text-cream placeholder-cream/30 focus:border-gold/40 focus:outline-none"
                    placeholder="City, Country"
                  />
                </div>

                {/* Bio */}
                <div>
                  <label className="block text-sm font-medium text-cream mb-2">
                    Story / Bio
                  </label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 bg-navy-dark border border-gold/20 rounded-xl text-cream placeholder-cream/30 focus:border-gold/40 focus:outline-none resize-none"
                    placeholder="Share their story, memories, or important details..."
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddModal(false);
                      setSelectedMember(null);
                      setSelectedSlot(null);
                    }}
                    className="flex-1 px-6 py-3 bg-navy-dark border border-gold/20 text-cream rounded-xl hover:border-gold/40 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        {selectedMember ? 'Update' : 'Add'} Member
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camera Modal */}
      <AnimatePresence>
        {showCameraModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-navy-dark/95 backdrop-blur-lg flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-navy-light border border-gold/20 rounded-2xl p-6 max-w-2xl w-full"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-serif text-cream">Take Photo</h2>
                <button
                  onClick={stopCamera}
                  className="p-2 rounded-full bg-cream/10 text-cream hover:bg-cream/20 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="relative aspect-video bg-navy-dark rounded-xl overflow-hidden mb-4">
                {capturedPhoto ? (
                  <img src={capturedPhoto} alt="Captured" className="w-full h-full object-cover" />
                ) : (
                  <video
                    ref={(el) => setCameraVideoRef(el)}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                )}
              </div>

              <canvas ref={(el) => setCanvasRef(el)} className="hidden" />

              <div className="flex gap-3">
                {capturedPhoto ? (
                  <>
                    <button
                      onClick={retakePhoto}
                      className="flex-1 px-6 py-3 bg-navy-dark border border-gold/20 text-cream rounded-xl hover:border-gold/40 transition-all"
                    >
                      Retake
                    </button>
                    <button
                      onClick={usePhoto}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-500 hover:to-pink-500 transition-all"
                    >
                      Use Photo
                    </button>
                  </>
                ) : (
                  <button
                    onClick={capturePhoto}
                    className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium hover:from-purple-500 hover:to-pink-500 transition-all flex items-center justify-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    Capture Photo
                  </button>
                )}
              </div>
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
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-navy-light border border-gold/20 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-serif text-cream">{selectedMember.name}</h2>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="p-2 rounded-full bg-cream/10 text-cream hover:bg-cream/20 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Photo */}
              <div className="aspect-square rounded-2xl overflow-hidden mb-6 bg-navy-dark">
                <img
                  src={selectedMember.imageData}
                  alt={selectedMember.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="space-y-4 mb-6">
                <div>
                  <p className="text-sm text-cream/50 mb-1">Relationship</p>
                  <p className="text-cream font-medium">{selectedMember.relationship}</p>
                </div>

                {selectedMember.birthYear && (
                  <div>
                    <p className="text-sm text-cream/50 mb-1">
                      {selectedMember.isDeceased ? 'Lifespan' : 'Birth Year'}
                    </p>
                    <p className="text-cream font-medium">
                      {selectedMember.isDeceased && selectedMember.deathYear
                        ? `${selectedMember.birthYear} - ${selectedMember.deathYear}`
                        : selectedMember.birthYear}
                      {selectedMember.isDeceased && ' ✝'}
                    </p>
                  </div>
                )}

                {selectedMember.birthplace && (
                  <div>
                    <p className="text-sm text-cream/50 mb-1">Birthplace</p>
                    <p className="text-cream font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {selectedMember.birthplace}
                    </p>
                  </div>
                )}

                {selectedMember.bio && (
                  <div>
                    <p className="text-sm text-cream/50 mb-1">Story</p>
                    <p className="text-cream/80 leading-relaxed">{selectedMember.bio}</p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    handleEditMember(selectedMember);
                  }}
                  className="flex-1 px-6 py-3 bg-navy-dark border border-gold/20 text-cream rounded-xl hover:border-gold/40 transition-all flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-5 h-5" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteMember(selectedMember.id)}
                  className="flex-1 px-6 py-3 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl hover:border-red-500/40 transition-all flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
