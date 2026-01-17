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
  Calendar
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
    imageData: null
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Refs for camera
  const cameraVideoRef = useState(null);
  const canvasRef = useState(null);

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

  const handleAddMember = () => {
    setFormData({
      name: '',
      relationship: '',
      birthYear: '',
      birthplace: '',
      bio: '',
      imageData: null
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
      imageData: member.imageData
    });
    setSelectedMember(member);
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
      alert('Failed to delete family member. Please try again.');
    }
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();

    // Validation
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Name is required';
    if (!formData.relationship.trim()) errors.relationship = 'Relationship is required';
    if (!formData.imageData) errors.imageData = 'Photo is required';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitting(true);

      if (selectedMember) {
        // Update existing member
        const updated = await api.updateFamilyMember(selectedMember.id, formData);
        setFamilyMembers(familyMembers.map(m => m.id === selectedMember.id ? updated.member : m));
      } else {
        // Create new member
        const response = await api.createFamilyMember(formData);
        setFamilyMembers([...familyMembers, response.member]);
      }

      setShowAddModal(false);
      setSelectedMember(null);
      setFormData({
        name: '',
        relationship: '',
        birthYear: '',
        birthplace: '',
        bio: '',
        imageData: null
      });
    } catch (err) {
      console.error('Failed to save family member:', err);
      alert('Failed to save family member. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageData: reader.result });
        setFormErrors({ ...formErrors, imageData: undefined });
      };
      reader.readAsDataURL(file);
    }
  };

  // Camera functions
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      setCameraStream(stream);
      setShowCameraModal(true);

      setTimeout(() => {
        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      console.error('Failed to access camera:', err);
      alert('Failed to access camera. Please make sure you have granted camera permissions.');
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
    if (cameraVideoRef.current && canvasRef.current) {
      const video = cameraVideoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');

      // Flip the image horizontally to un-mirror it
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const photoData = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedPhoto(photoData);
    }
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
  };

  const usePhoto = () => {
    setFormData({ ...formData, imageData: capturedPhoto });
    setFormErrors({ ...formErrors, imageData: undefined });
    stopCamera();
  };

  const viewProfile = (member) => {
    setSelectedMember(member);
    setShowProfileModal(true);
  };

  const startLiveConversation = (member) => {
    // Navigate to Echo Sim with member context
    onNavigate('echo-sim');
    // TODO: Pass member context to Echo Sim
  };

  const generateVideo = (member) => {
    // Navigate to Echo Sim video generation with member context
    onNavigate('echo-sim');
    // TODO: Pass member context to Echo Sim
  };

  // Cleanup camera stream
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  if (loading) {
    return (
      <div className="min-h-screen bg-navy flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
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
            <p className="text-cream/60">Build your legacy with your loved ones</p>
          </div>
          <motion.button
            onClick={handleAddMember}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium flex items-center gap-2 hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg shadow-purple-500/30"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Plus className="w-5 h-5" />
            Add Family Member
          </motion.button>
        </div>

        {/* Family Tree Visualization */}
        {familyMembers.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <Users className="w-20 h-20 text-gold/30 mx-auto mb-6" />
            <h2 className="text-2xl font-serif text-cream mb-3">Start Your Family Tree</h2>
            <p className="text-cream/60 mb-6 max-w-md mx-auto">
              Add your family members to build a visual family tree. You can have conversations with them and generate personalized videos.
            </p>
            <motion.button
              onClick={handleAddMember}
              className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium inline-flex items-center gap-2 hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg shadow-purple-500/30"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-5 h-5" />
              Add Your First Family Member
            </motion.button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {familyMembers.map((member) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => viewProfile(member)}
                className="bg-navy-light border border-gold/20 rounded-2xl p-6 cursor-pointer hover:border-gold/40 transition-all"
              >
                {/* Photo */}
                <div className="aspect-square rounded-xl overflow-hidden mb-4 bg-navy-dark">
                  <img
                    src={member.imageData}
                    alt={member.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Info */}
                <h3 className="text-xl font-serif text-cream mb-1">{member.name}</h3>
                <p className="text-gold/70 text-sm mb-3">{member.relationship}</p>

                {member.birthYear && (
                  <div className="flex items-center gap-2 text-cream/50 text-xs mb-2">
                    <Calendar className="w-3 h-3" />
                    <span>Born {member.birthYear}</span>
                  </div>
                )}

                {member.birthplace && (
                  <div className="flex items-center gap-2 text-cream/50 text-xs">
                    <MapPin className="w-3 h-3" />
                    <span>{member.birthplace}</span>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Add/Edit Member Modal */}
      <AnimatePresence>
        {showAddModal && (
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
              className="bg-navy-dark border border-gold/20 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-serif text-cream mb-1">
                    {selectedMember ? 'Edit' : 'Add'} Family Member
                  </h2>
                  <p className="text-cream/60 text-sm">Fill in the details about your family member</p>
                </div>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setSelectedMember(null);
                  }}
                  className="p-2 rounded-full bg-cream/10 text-cream hover:bg-cream/20 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmitForm}>
                {/* Photo Upload */}
                <div className="mb-6">
                  <label className="block text-cream/70 text-sm mb-3">Photo *</label>

                  {formData.imageData ? (
                    <div className="relative aspect-square w-48 mx-auto rounded-xl overflow-hidden border-2 border-gold/20">
                      <img
                        src={formData.imageData}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, imageData: null })}
                        className="absolute top-2 right-2 p-2 bg-red-500/80 rounded-full text-white hover:bg-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-3 justify-center">
                      <label className="flex-1 max-w-xs cursor-pointer">
                        <div className="aspect-square rounded-xl border-2 border-dashed border-gold/30 hover:border-gold/50 bg-navy-light/30 flex flex-col items-center justify-center transition-all hover:bg-navy-light/50">
                          <Upload className="w-8 h-8 text-gold/50 mb-2" />
                          <span className="text-cream/50 text-sm">Upload Photo</span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={startCamera}
                        className="flex-1 max-w-xs"
                      >
                        <div className="aspect-square rounded-xl border-2 border-dashed border-purple-500/30 hover:border-purple-500/50 bg-purple-500/10 flex flex-col items-center justify-center transition-all hover:bg-purple-500/20">
                          <Camera className="w-8 h-8 text-purple-400/70 mb-2" />
                          <span className="text-purple-300/70 text-sm">Take Photo</span>
                        </div>
                      </button>
                    </div>
                  )}

                  {formErrors.imageData && (
                    <p className="text-red-400 text-sm mt-2 text-center">{formErrors.imageData}</p>
                  )}
                </div>

                {/* Name */}
                <div className="mb-4">
                  <label className="block text-cream/70 text-sm mb-2">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-navy-light border border-gold/20 rounded-xl text-cream focus:outline-none focus:border-gold/50 transition-colors"
                    placeholder="John Doe"
                  />
                  {formErrors.name && (
                    <p className="text-red-400 text-sm mt-1">{formErrors.name}</p>
                  )}
                </div>

                {/* Relationship */}
                <div className="mb-4">
                  <label className="block text-cream/70 text-sm mb-2">Relationship *</label>
                  <select
                    value={formData.relationship}
                    onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                    className="w-full px-4 py-3 bg-navy-light border border-gold/20 rounded-xl text-cream focus:outline-none focus:border-gold/50 transition-colors"
                  >
                    <option value="">Select relationship...</option>
                    <option value="Father">Father</option>
                    <option value="Mother">Mother</option>
                    <option value="Grandfather">Grandfather</option>
                    <option value="Grandmother">Grandmother</option>
                    <option value="Son">Son</option>
                    <option value="Daughter">Daughter</option>
                    <option value="Brother">Brother</option>
                    <option value="Sister">Sister</option>
                    <option value="Uncle">Uncle</option>
                    <option value="Aunt">Aunt</option>
                    <option value="Cousin">Cousin</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Other">Other</option>
                  </select>
                  {formErrors.relationship && (
                    <p className="text-red-400 text-sm mt-1">{formErrors.relationship}</p>
                  )}
                </div>

                {/* Birth Year */}
                <div className="mb-4">
                  <label className="block text-cream/70 text-sm mb-2">Birth Year</label>
                  <input
                    type="text"
                    value={formData.birthYear}
                    onChange={(e) => setFormData({ ...formData, birthYear: e.target.value })}
                    className="w-full px-4 py-3 bg-navy-light border border-gold/20 rounded-xl text-cream focus:outline-none focus:border-gold/50 transition-colors"
                    placeholder="1950"
                  />
                </div>

                {/* Birthplace */}
                <div className="mb-4">
                  <label className="block text-cream/70 text-sm mb-2">Birthplace</label>
                  <input
                    type="text"
                    value={formData.birthplace}
                    onChange={(e) => setFormData({ ...formData, birthplace: e.target.value })}
                    className="w-full px-4 py-3 bg-navy-light border border-gold/20 rounded-xl text-cream focus:outline-none focus:border-gold/50 transition-colors"
                    placeholder="New York, USA"
                  />
                </div>

                {/* Bio */}
                <div className="mb-6">
                  <label className="block text-cream/70 text-sm mb-2">Bio / Story</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 bg-navy-light border border-gold/20 rounded-xl text-cream focus:outline-none focus:border-gold/50 transition-colors resize-none"
                    placeholder="Share their story, memories, or important details..."
                  />
                </div>

                {/* Submit Button */}
                <motion.button
                  type="submit"
                  disabled={submitting}
                  className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:from-purple-500 hover:to-pink-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: submitting ? 1 : 1.02 }}
                  whileTap={{ scale: submitting ? 1 : 0.98 }}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      {selectedMember ? 'Update' : 'Add'} Family Member
                    </>
                  )}
                </motion.button>
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
              className="bg-navy-dark border border-gold/20 rounded-2xl p-6 max-w-2xl w-full"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <Camera className="w-6 h-6 text-purple-400" />
                  <h2 className="text-2xl font-serif text-cream">Take Photo</h2>
                </div>
                <button
                  onClick={stopCamera}
                  className="p-2 rounded-full bg-cream/10 text-cream hover:bg-cream/20 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Camera Preview */}
              <div className="relative aspect-[4/3] bg-black rounded-xl overflow-hidden mb-4">
                {capturedPhoto ? (
                  <img
                    src={capturedPhoto}
                    alt="Captured"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <video
                    ref={cameraVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-contain scale-x-[-1]"
                  />
                )}

                {/* Hidden canvas for capturing */}
                <canvas ref={canvasRef} className="hidden" />
              </div>

              {/* Controls */}
              <div className="flex items-center justify-center gap-3">
                {capturedPhoto ? (
                  <>
                    <button
                      onClick={retakePhoto}
                      className="px-6 py-3 bg-navy-light border border-gold/20 text-cream rounded-xl hover:bg-gold/10 transition-colors flex items-center gap-2"
                    >
                      <RefreshCw className="w-5 h-5" />
                      Retake
                    </button>
                    <button
                      onClick={usePhoto}
                      className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl hover:from-purple-500 hover:to-pink-500 transition-colors flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Use Photo
                    </button>
                  </>
                ) : (
                  <button
                    onClick={capturePhoto}
                    className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-500 hover:to-pink-500 transition-all flex items-center justify-center shadow-lg shadow-purple-500/50"
                  >
                    <Camera className="w-8 h-8" />
                  </button>
                )}
              </div>

              {/* Tip */}
              <div className="mt-4 p-3 bg-purple-500/10 rounded-xl border border-purple-500/20">
                <p className="text-purple-300/70 text-sm text-center">
                  {capturedPhoto
                    ? 'Review your photo and use it or retake if needed'
                    : 'Position yourself in the frame and click the camera button to capture'}
                </p>
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
              className="bg-navy-dark border border-gold/20 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-serif text-cream">Family Member Profile</h2>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="p-2 rounded-full bg-cream/10 text-cream hover:bg-cream/20 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Photo */}
              <div className="aspect-square w-64 mx-auto rounded-2xl overflow-hidden mb-6 border-2 border-gold/20">
                <img
                  src={selectedMember.imageData}
                  alt={selectedMember.name}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="text-center mb-6">
                <h3 className="text-3xl font-serif text-cream mb-2">{selectedMember.name}</h3>
                <p className="text-gold text-lg mb-4">{selectedMember.relationship}</p>

                {selectedMember.birthYear && (
                  <div className="flex items-center justify-center gap-2 text-cream/70 mb-2">
                    <Calendar className="w-4 h-4" />
                    <span>Born {selectedMember.birthYear}</span>
                  </div>
                )}

                {selectedMember.birthplace && (
                  <div className="flex items-center justify-center gap-2 text-cream/70">
                    <MapPin className="w-4 h-4" />
                    <span>{selectedMember.birthplace}</span>
                  </div>
                )}
              </div>

              {/* Bio */}
              {selectedMember.bio && (
                <div className="mb-6 p-4 bg-navy-light/50 rounded-xl border border-gold/10">
                  <h4 className="text-cream/70 text-sm mb-2">Story</h4>
                  <p className="text-cream/90 leading-relaxed">{selectedMember.bio}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <motion.button
                  onClick={() => startLiveConversation(selectedMember)}
                  className="px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:from-purple-500 hover:to-pink-500 transition-all shadow-lg shadow-purple-500/30"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <MessageCircle className="w-5 h-5" />
                  Live Conversation
                </motion.button>

                <motion.button
                  onClick={() => generateVideo(selectedMember)}
                  className="px-6 py-4 bg-gradient-to-r from-gold to-gold-light text-navy rounded-xl font-medium flex items-center justify-center gap-2 hover:from-gold-light hover:to-gold transition-all shadow-lg shadow-gold/30"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Film className="w-5 h-5" />
                  Generate Video
                </motion.button>
              </div>

              {/* Edit/Delete Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gold/10">
                <button
                  onClick={() => {
                    setShowProfileModal(false);
                    handleEditMember(selectedMember);
                  }}
                  className="flex-1 px-4 py-3 bg-navy-light border border-gold/20 text-cream rounded-xl hover:bg-gold/10 transition-colors flex items-center justify-center gap-2"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteMember(selectedMember.id)}
                  className="flex-1 px-4 py-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
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
