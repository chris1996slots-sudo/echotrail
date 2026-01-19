import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Plus,
  Star,
  Image as ImageIcon,
  Video,
  Mic,
  Edit3,
  Trash2,
  X,
  Sparkles,
  Baby,
  GraduationCap,
  Briefcase,
  Heart,
  Award,
  Clock,
  MapPin,
  ChevronDown
} from 'lucide-react';
import { PageTransition, FadeIn } from '../components/PageTransition';
import api from '../services/api';

const categoryIcons = {
  childhood: Baby,
  education: GraduationCap,
  career: Briefcase,
  family: Heart,
  milestone: Award,
  achievement: Star,
  travel: MapPin,
  other: Sparkles
};

const categories = [
  { id: 'childhood', label: 'Childhood', color: 'from-pink-500 to-purple-500' },
  { id: 'education', label: 'Education', color: 'from-blue-500 to-cyan-500' },
  { id: 'career', label: 'Career', color: 'from-green-500 to-emerald-500' },
  { id: 'family', label: 'Family', color: 'from-red-500 to-pink-500' },
  { id: 'milestone', label: 'Milestone', color: 'from-purple-500 to-indigo-500' },
  { id: 'achievement', label: 'Achievement', color: 'from-yellow-500 to-orange-500' },
  { id: 'travel', label: 'Travel', color: 'from-teal-500 to-green-500' },
  { id: 'other', label: 'Other', color: 'from-gray-500 to-slate-500' }
];

export function EchoTimelinePage() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingEvent, setEditingEvent] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    eventDate: '',
    ageAtEvent: '',
    category: 'milestone',
    importance: 3,
    imageUrl: '',
    avatarMessage: ''
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await api.getTimelineEvents();
      setEvents(data.sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate)));
    } catch (error) {
      console.error('Failed to load timeline events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddEvent = async () => {
    try {
      if (editingEvent) {
        // Update existing event
        await api.updateTimelineEvent(editingEvent.id, newEvent);
      } else {
        // Create new event
        await api.createTimelineEvent(newEvent);
      }
      setShowAddModal(false);
      setEditingEvent(null);
      setNewEvent({
        title: '',
        description: '',
        eventDate: '',
        ageAtEvent: '',
        category: 'milestone',
        importance: 3,
        imageUrl: '',
        avatarMessage: ''
      });
      loadEvents();
    } catch (error) {
      console.error('Failed to save event:', error);
    }
  };

  const handleEditEvent = (event) => {
    setEditingEvent(event);
    setNewEvent({
      title: event.title,
      description: event.description || '',
      eventDate: event.eventDate.split('T')[0], // Convert to YYYY-MM-DD format
      ageAtEvent: event.ageAtEvent?.toString() || '',
      category: event.category,
      importance: event.importance,
      imageUrl: event.imageUrl || '',
      avatarMessage: event.avatarMessage || ''
    });
    setShowAddModal(true);
  };

  const handleDeleteEvent = async (id) => {
    if (!confirm('Delete this event from your timeline?')) return;
    try {
      await api.deleteTimelineEvent(id);
      loadEvents();
    } catch (error) {
      console.error('Failed to delete event:', error);
    }
  };

  const filteredEvents = selectedCategory === 'all'
    ? events
    : events.filter(e => e.category === selectedCategory);

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-navy via-navy-dark to-navy-light py-20 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <FadeIn>
            <div className="text-center mb-12">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
                className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-gold to-gold-light rounded-full flex items-center justify-center"
              >
                <Calendar className="w-10 h-10 text-navy" />
              </motion.div>
              <h1 className="text-3xl md:text-5xl font-serif text-cream mb-4">Echo Timeline</h1>
              <p className="text-cream/60 text-base md:text-lg max-w-2xl mx-auto">
                Your life's journey, preserved forever. Add milestones, memories, and moments
                that shaped who you are.
              </p>
            </div>
          </FadeIn>

          {/* Category Filter */}
          <div className="mb-8 flex flex-wrap gap-2 justify-center px-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === 'all'
                  ? 'bg-gold text-navy'
                  : 'bg-navy-light/50 text-cream/70 hover:bg-navy-light'
              }`}
            >
              All Events
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedCategory === cat.id
                    ? `bg-gradient-to-r ${cat.color} text-white`
                    : 'bg-navy-light/50 text-cream/70 hover:bg-navy-light'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Add Event Button */}
          <div className="mb-12 text-center">
            <motion.button
              onClick={() => setShowAddModal(true)}
              className="btn-primary inline-flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Plus className="w-5 h-5" />
              Add Life Event
            </motion.button>
          </div>

          {/* Timeline */}
          {loading ? (
            <div className="text-center py-20">
              <Clock className="w-12 h-12 text-gold/50 mx-auto mb-4 animate-spin" />
              <p className="text-cream/50">Loading your timeline...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-20">
              <Calendar className="w-16 h-16 text-gold/30 mx-auto mb-4" />
              <p className="text-cream/50 mb-2">
                {selectedCategory === 'all'
                  ? 'No events yet. Start building your timeline!'
                  : `No ${categories.find(c => c.id === selectedCategory)?.label} events yet.`}
              </p>
            </div>
          ) : (
            <div className="relative">
              {/* Timeline Line */}
              <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-gold via-gold/50 to-transparent hidden md:block" />

              <div className="space-y-8">
                {filteredEvents.map((event, index) => {
                  const CategoryIcon = categoryIcons[event.category] || Sparkles;
                  const categoryData = categories.find(c => c.id === event.category);

                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="relative md:pl-24"
                    >
                      {/* Timeline Dot */}
                      <div className="absolute left-6 top-6 w-5 h-5 rounded-full bg-gradient-to-br from-gold to-gold-light border-4 border-navy hidden md:block" />

                      {/* Event Card */}
                      <div className="glass-card p-6 border-gold/20 hover:border-gold/40 transition-all">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${categoryData?.color} flex items-center justify-center`}>
                                <CategoryIcon className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h3 className="text-xl font-serif text-cream">{event.title}</h3>
                                <div className="flex items-center gap-3 text-sm text-cream/50">
                                  <span>{new Date(event.eventDate).toLocaleDateString()}</span>
                                  {event.ageAtEvent && <span>• Age {event.ageAtEvent}</span>}
                                </div>
                              </div>
                            </div>

                            {/* Importance Stars */}
                            <div className="flex gap-1 mb-3">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= event.importance
                                      ? 'text-gold fill-gold'
                                      : 'text-cream/20'
                                  }`}
                                />
                              ))}
                            </div>

                            {event.description && (
                              <p className="text-cream/70 mb-4">{event.description}</p>
                            )}

                            {event.avatarMessage && (
                              <div className="bg-gold/10 border border-gold/20 rounded-lg p-4 mb-4">
                                <div className="flex items-center gap-2 mb-2">
                                  <Sparkles className="w-4 h-4 text-gold" />
                                  <span className="text-xs font-medium text-gold">Avatar's Memory</span>
                                </div>
                                <p className="text-cream/80 text-sm italic">"{event.avatarMessage}"</p>
                              </div>
                            )}

                            {event.imageUrl && (
                              <div className="rounded-lg overflow-hidden mb-4">
                                <img
                                  src={event.imageUrl}
                                  alt={event.title}
                                  className="w-full max-h-64 object-cover"
                                />
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditEvent(event)}
                              className="p-2 rounded-lg text-cream/50 hover:text-gold hover:bg-gold/10 transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(event.id)}
                              className="p-2 rounded-lg text-cream/50 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add Event Modal */}
          <AnimatePresence>
            {showAddModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                onClick={() => setShowAddModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-navy-dark border-2 border-gold/30 rounded-2xl p-4 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-serif text-cream">{editingEvent ? 'Edit Life Event' : 'Add Life Event'}</h2>
                    <button
                      onClick={() => {
                        setShowAddModal(false);
                        setEditingEvent(null);
                      }}
                      className="p-2 rounded-lg text-cream/50 hover:text-cream hover:bg-navy-light/50"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-cream/70 text-sm mb-2">Event Title *</label>
                      <input
                        type="text"
                        value={newEvent.title}
                        onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                        placeholder="My first day of school"
                        className="w-full px-4 py-3 bg-navy-light/50 border border-gold/20 rounded-lg text-cream focus:outline-none focus:border-gold/50"
                      />
                    </div>

                    <div>
                      <label className="block text-cream/70 text-sm mb-2">Description</label>
                      <textarea
                        value={newEvent.description}
                        onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                        placeholder="Tell the story of this moment..."
                        rows={4}
                        className="w-full px-4 py-3 bg-navy-light/50 border border-gold/20 rounded-lg text-cream focus:outline-none focus:border-gold/50 resize-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-cream/70 text-sm mb-2">Date *</label>
                        <input
                          type="date"
                          value={newEvent.eventDate}
                          onChange={(e) => setNewEvent({ ...newEvent, eventDate: e.target.value })}
                          className="w-full px-4 py-3 bg-navy-light/50 border border-gold/20 rounded-lg text-cream focus:outline-none focus:border-gold/50"
                        />
                      </div>
                      <div>
                        <label className="block text-cream/70 text-sm mb-2">Your Age</label>
                        <input
                          type="number"
                          value={newEvent.ageAtEvent}
                          onChange={(e) => setNewEvent({ ...newEvent, ageAtEvent: e.target.value })}
                          placeholder="25"
                          className="w-full px-4 py-3 bg-navy-light/50 border border-gold/20 rounded-lg text-cream focus:outline-none focus:border-gold/50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-cream/70 text-sm mb-2">Category *</label>
                      <select
                        value={newEvent.category}
                        onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                        className="w-full px-4 py-3 bg-navy-light/50 border border-gold/20 rounded-lg text-cream focus:outline-none focus:border-gold/50"
                      >
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.label}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-cream/70 text-sm mb-2">Importance</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setNewEvent({ ...newEvent, importance: star })}
                            className="transition-transform hover:scale-110"
                          >
                            <Star
                              className={`w-8 h-8 ${
                                star <= newEvent.importance
                                  ? 'text-gold fill-gold'
                                  : 'text-cream/20'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-cream/70 text-sm mb-2">Avatar's Memory (Optional)</label>
                      <textarea
                        value={newEvent.avatarMessage}
                        onChange={(e) => setNewEvent({ ...newEvent, avatarMessage: e.target.value })}
                        placeholder="What would your avatar say about this moment? (AI can help generate this later)"
                        rows={3}
                        className="w-full px-4 py-3 bg-navy-light/50 border border-gold/20 rounded-lg text-cream focus:outline-none focus:border-gold/50 resize-none"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-4">
                      <button
                        onClick={() => {
                          setShowAddModal(false);
                          setEditingEvent(null);
                        }}
                        className="flex-1 px-6 py-3 bg-navy-light text-cream/70 rounded-lg hover:bg-navy-light/70 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddEvent}
                        disabled={!newEvent.title || !newEvent.eventDate}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-gold to-gold-light text-navy font-medium rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {editingEvent ? 'Save Changes' : 'Add Event'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
}
